// 管理数据接口（口令保护）
// GET /api/data?key=ADMIN_KEY            -> JSON {count, results}
// GET /api/data?key=ADMIN_KEY&format=csv -> 下载 CSV（含 BOM，Excel 直接打开中文不乱码）
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (key !== env.ADMIN_KEY) return new Response("forbidden", { status: 403 });

  const { results } = await env.DB.prepare(
    `SELECT * FROM survey_responses ORDER BY id DESC`
  ).all();

  if (url.searchParams.get("format") === "csv") {
    const header = ["编号", "姓名", "手机号", "年龄段", "康养顾问", "顾问部门", "感兴趣活动", "覆盖分类", "活动形式", "参与时间", "活动地点", "其他建议", "提交时间"];
    const rows = results.map((r) => [
      r.id,
      r.name,
      r.phone,
      r.age,
      r.advisor,
      r.advisor_dept,
      (JSON.parse(r.interests || "[]").join("、")),
      (JSON.parse(r.categories || "[]").join("、")),
      r.form,
      r.time,
      r.place,
      r.remark,
      new Date(Number(r.created_at)).toLocaleString("zh-CN"),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    return new Response("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="survey_responses.csv"',
      },
    });
  }

  return Response.json({ count: results.length, results });
}
