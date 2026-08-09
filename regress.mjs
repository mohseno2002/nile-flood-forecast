import { rep } from "/home/claude/mwri-probe/scripts/probe_harness.mjs";
export const label = "انحدار الترقيع 2.93";
export const expectedWriteAttempts = 2;
export async function run(env){
  const c = env.ctx, h = env.html;
  const R = c.resv("gerd");
  // الحارس الجديد يفلتر فعلاً
  rep("damIntervals يحرس بـout لا بـnull", /if\(v1\.out\|\|v2\.out\) continue;/.test(h) && !/v1\.v===null/.test(h));
  // حارس النوع
  rep("dongolaQ يرفض النصّ", c.dongolaQ("12")===null);
  rep("dongolaQAlt يرفض النصّ", c.dongolaQAlt("12",false,"07")===null);
  rep("khartoumQ يرفض النصّ", c.khartoumQ("12")===null);
  rep("nasserStore يرفض النصّ", c.nasserStore("175","official")===null);
  // لا انحدار: الأرقام السليمة تبقى كما هى
  rep("dongolaQ(10.10) لم تتأثر", Math.abs(c.dongolaQ(10.10)-127.835)<0.05);
  rep("nasserStore(175) لم تتأثر", Math.abs(c.nasserStore(175,"official")-121.3)<0.01);
  rep("hvV(622.93) لم تتأثر", c.hvV(R,622.93).out===false);
  rep("المنحنى المعايَر donActiveQ يعمل", typeof c.donActiveQ(12,false,"08")==="number");
  rep("BUILD = 2.93", /var BUILD = "2\.93";/.test(h));
}
