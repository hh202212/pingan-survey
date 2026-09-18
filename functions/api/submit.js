// 接收调研提交，写入 D1
// POST /api/submit  body: JSON
export async function onRequestPost({ request, env }) {
  try {
    const b = await request.json();
    const name = (b.name || "").trim();
    const phone = (b.phone || "").trim();
    if (!name) return Response.json({ ok: false, msg: "请填写称呼" }, { status: 400 });
    if (!/^1\d{10}$/.test(phone)) return Response.json({ ok: false, msg: "手机号格式不正确" }, { status: 400 });

    // 去重：同一手机号已提交过则拒绝重复提交（数据库唯一索引为并发兜底）
    const exist = await env.DB.prepare(
      `SELECT id FROM survey_responses WHERE phone = ?`
    ).bind(phone).first();
    if (exist) return Response.json({ ok: false, dup: true, msg: "该手机号已提交过调研，请勿重复提交" }, { status: 409 });

    const interests = Array.isArray(b.interests) ? b.interests : [];
    const categories = Array.isArray(b.categories) ? [...new Set(b.categories)] : [];

    await env.DB.prepare(
      `INSERT INTO survey_responses
        (name, phone, age, interests, categories, form, time, place, remark, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      name,
      phone,
      b.age || "",
      JSON.stringify(interests),
      JSON.stringify(categories),
      b.form || "",
      b.time || "",
      b.place || "",
      b.remark || "",
      Date.now()
    ).run();

    return Response.json({ ok: true, count: interests.length, cats: categories.length });
  } catch (e) {
    // 并发场景下的唯一索引冲突，统一按重复提交处理
    if (/UNIQUE|constraint|unique/i.test(String(e))) {
      return Response.json({ ok: false, dup: true, msg: "该手机号已提交过调研，请勿重复提交" }, { status: 409 });
    }
    return Response.json({ ok: false, msg: String(e) }, { status: 500 });
  }
}
