import { rep, near, isNull } from "/home/claude/mwri-probe/scripts/probe_harness.mjs";
export const label = "بطاقة القرار (2.94)";
export const expectedWriteAttempts = 2;

// سلسلة مصطنعة مستقلة عن أى مخرَج للتطبيق — صعود ١ سم/يوم من 176.00
function series(startISO, n, step, rate){
  const d0 = Date.parse(startISO)/864e5;
  const out=[];
  for(let i=0;i<n;i++){
    const d = new Date((d0 + i*step)*864e5);
    const iso = d.toISOString().slice(0,10);
    out.push({ t: iso, v: 176.00 + i*step*rate });
  }
  return out;
}
export async function run(env){
  const c = env.ctx;
  const today = new Date();
  const start = new Date(Date.now() - 120*864e5).toISOString().slice(0,10);

  // ١) بلا بيانات: لا اختلاق ولا انهيار
  c.ST.alti.data.nasser = null; c.ST.gwm.data.nasser = null;
  isNull("بلا رصدة: decState تُرجع null", c.decState());
  rep("بلا رصدة: الحكم لا رصدة لا حكم", c.decVerdict(null).nm.indexOf("لا رصدة")!==-1);
  rep("بلا رصدة: البطاقة تُرسم بلا انهيار", c.decCard().indexOf("بطاقة القرار")!==-1);

  // ٢) حقن سلسلة صاعدة ١ سم/يوم، آخر رصدة اليوم
  const S = series(start, 13, 10, 0.01);   // كل ١٠ أيام، ١٢٠ يوماً
  S[S.length-1].t = today.toISOString().slice(0,10);
  c.ST.alti.data.nasser = { series: S };
  c.ST.gwm.data.nasser = null;

  const R = c.decRate(30);
  near("المعدل المشتقّ = 1.00 سم/يوم", R.mPerDay*100, 1.0, 0.02);
  rep("نافذة المعدل داخل 8–75 يوماً", R.days>=8 && R.days<=75, "days="+R.days);

  // ٣) العتبة الأقرب صعوداً من 177.00 بمعدل 1 سم/يوم = 178.00 خلال ١٠٠ يوم
  const N1 = c.decNext(177.00, 0.01);
  near("العتبة الأقرب 178.00", N1.h, 178.00, 1e-9);
  rep("اسم العتبة = مفيض توشكى", N1.nm.indexOf("توشكى")!==-1);
  rep("الإجراء مذكور مع العتبة", N1.act.indexOf("السكب")!==-1);
  near("الزمن = ١٠٠ يوم", N1.days, 100, 0.5);

  // ٤) الاتجاه الهابط يعطى العتبة الأدنى لا الأعلى
  const N2 = c.decNext(177.00, -0.01);
  near("هبوطاً ← 175.00", N2.h, 175.00, 1e-9);

  // ٥) الثبات لا يُفتعل له عتبة
  rep("معدل 1 مم/يوم يُعدّ ثباتاً", c.decNext(177.00, 0.001).stable===true);
  rep("فوق 182 صعوداً: لا عتبة", c.decNext(183.00, 0.01).none===true);
  isNull("منسوب نصّى يُرفض", c.decNext("177", 0.01));
  isNull("معدل NaN يُرفض", c.decNext(177.00, NaN));

  // ٦) الحكم: قاعدة الأيام معلنة ومطبَّقة
  const mk = (days, age) => ({ stale:false, N:{age:age||0,h:177}, rate:{mPerDay:0.01,days:30},
                               next:{h:178,nm:"عتبة مفيض توشكى",act:"بدء السكب",days:days} });
  rep("≤١٠ أيام ← قرار مطلوب اليوم", c.decVerdict(mk(7)).nm.indexOf("اليوم")!==-1);
  rep("≤٣٠ يوماً ← تحضير", c.decVerdict(mk(20)).nm.indexOf("تحضير")!==-1);
  rep("بعيد ← متابعة", c.decVerdict(mk(200)).nm.indexOf("متابعة")!==-1);
  const stale = mk(7); stale.stale=true; stale.N.age=60;
  rep("الرصدة القديمة توقف الحكم مهما قربت العتبة", c.decVerdict(stale).nm.indexOf("مؤجَّل")!==-1);

  // ٧) العتبات مطابقة لسجل الوزارة (mwri-nile-data)
  const off=[[147,"التخزين الميت"],[160,null],[175,null],[178,null],[182,null]];
  rep("سلّم العتبات خمس درجات", c.DEC_ACTIONS.length===5);
  off.forEach((p,i)=> near("العتبة "+(i+1)+" = "+p[0], c.DEC_ACTIONS[i].h, p[0], 1e-9));
  rep("عتبة توشكى تساوى TOSHKA_H", c.DEC_ACTIONS[3].h===c.TOSHKA_H);

  // ٨) الأسوأ المعقول مشتقّ من السلسلة لا مضاعِف
  const W = c.decWorst();
  near("أسرع صعود مرصود = 1.00 سم/يوم (السلسلة خطية)", W.r*100, 1.0, 0.02);

  // ٩) البطاقة تعرض الأسطر الخمسة
  const html = c.decCard();
  ["الموقف اليوم","المسار","العتبة الأقرب","القرار المطلوب","ما يقلب هذا الحكم","ثقة الرقم"]
    .forEach(k => rep("سطر البطاقة: "+k, html.indexOf(k)!==-1));
  rep("البطاقة تعلن أن المسار استقراء لا تنبؤ", html.indexOf("ليس تنبؤاً")!==-1);

  // ١٠) حساسية: لو أُهملت الإزاحة لاختلف المنسوب المعروض
  rep("حساسية: 178.35 جيودياً ليست 178.35 معروضة", c.nasserH(178.35)!==178.35);
}
