-- 平安客户活动调研表 · D1 表结构
-- 部署前执行：wrangler d1 execute pingan-survey --file=./schema.sql --remote
-- 本地联调：wrangler d1 execute pingan-survey --file=./schema.sql --local

CREATE TABLE IF NOT EXISTS survey_responses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT,
  phone       TEXT,
  age         TEXT,
  interests   TEXT,   -- JSON 数组：具体活动名称
  categories  TEXT,   -- JSON 数组：所属分类
  form        TEXT,   -- 活动形式：线下沙龙/线上直播/两者皆可
  time        TEXT,   -- 参与时间：工作日白天/周末/晚间
  place       TEXT,   -- 活动地点：就近网点/社区/指定场馆
  remark      TEXT,   -- 其他建议
  created_at  INTEGER -- 提交时间戳(ms)
);

CREATE INDEX IF NOT EXISTS idx_survey_created ON survey_responses(created_at DESC);

-- 手机号唯一：数据库层兜底防重复提交（与 submit.js 的前置查询双重保险）
CREATE UNIQUE INDEX IF NOT EXISTS uni_survey_phone ON survey_responses(phone);
