import { rep } from "/home/claude/mwri-probe/scripts/probe_harness.mjs";
export const label = "عقد hvV مع مستدعيه الثلاثة";
export const expectedWriteAttempts = 2;
export async function run(env){
  const c = env.ctx, h = env.html;
  const R = c.resv("gerd");

  // ١) العقد الفعلى لـhvV: خارج المدى يُثبّت على الطرف ويرفع out — ولا يُرجع null أبداً
  let nulls = 0, outs = 0;
  for(let x=400; x<=800; x+=0.5){
    const r = c.hvV(R,x);
    if(r.v===null) nulls++;
    if(r.out) outs++;
  }
  rep("hvV لا تُرجع v=null لأى منسوب منتهٍ (٨٠١ عيّنة)", nulls===0, "عدد الـnull = "+nulls);
  rep("hvV ترفع out خارج 505–640", outs>0);
  rep("فوق 640 تُثبَّت على 74 مع out=true", c.hvV(R,700).v===74 && c.hvV(R,700).out===true);
  rep("تحت 505 تُثبَّت على 0 مع out=true", c.hvV(R,400).v===0 && c.hvV(R,400).out===true);

  // ٢) المستدعيان اللذان يحترمان العقد
  const gn = (h.match(/v:\(hv\.out\?null:hv\.v\)/)||[]).length;
  rep("gerdNow يحوّل out إلى null قبل العرض", gn===1);
  rep("gerdDelta يفحص a.out||b.out", /if\(a\.out\|\|b\.out\)\s*return/.test(h));

  // ٣) ⛔ المستدعى الثالث يفحص شرطاً لا يتحقق أبداً
  const dead = /if\(v1\.v===null\|\|v2\.v===null\)\s*continue;/.test(h);
  rep("⛔ damIntervals يحرس بـv===null وهو شرط ميت", !dead,
      dead ? "الحارس لا يفلتر شيئاً — الفترة خارج المدى تدخل الحساب بقيمة مثبَّتة" : "");

  // ٤) الأثر العددى: كم يخطئ ΔS لو سقطت رصدة فوق FSL؟
  const dsWrong = c.hvV(R,646).v - c.hvV(R,630).v;           // فترة 630 ← 646 (فوق FSL)
  rep("مقدار الخطأ الكامن كبير: ΔS يُحسب "+dsWrong.toFixed(1)+" مليار بدل رفض الفترة",
      dsWrong > 20, "المفروض رفض الفترة لا تثبيتها على 74");

  // ٥) لا أثر اليوم — الرصدة الحية داخل المدى
  const now = c.hvV(R,622.93);
  rep("الرصدة الحية 622.93 داخل المدى (لا أثر تشغيلى اليوم)", now.out===false);
}
