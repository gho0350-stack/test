-- 책등 D1 스키마. 개인 식별 정보는 저장하지 않습니다 (기기 ID는 브라우저가 만든 무작위 값, IP는 해시만 보관).

CREATE TABLE IF NOT EXISTS lights (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  device      TEXT    NOT NULL,
  book        TEXT    NOT NULL,
  author      TEXT    NOT NULL DEFAULT '',
  quote       TEXT    NOT NULL,
  note        TEXT    NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  deliveries  INTEGER NOT NULL DEFAULT 0,
  reports     INTEGER NOT NULL DEFAULT 0,
  hidden      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_lights_pool ON lights (hidden, deliveries, created_at);

-- 누가 어떤 문장을 이미 받았는지 (같은 문장을 두 번 받지 않도록)
CREATE TABLE IF NOT EXISTS seen (
  device    TEXT    NOT NULL,
  light_id  INTEGER NOT NULL,
  at        INTEGER NOT NULL,
  PRIMARY KEY (device, light_id)
);

CREATE TABLE IF NOT EXISTS reports (
  device    TEXT    NOT NULL,
  light_id  INTEGER NOT NULL,
  PRIMARY KEY (device, light_id)
);

-- 지금 읽고 있는 사람 (30초마다 오는 신호)
CREATE TABLE IF NOT EXISTS presence (
  device     TEXT    PRIMARY KEY,
  last_seen  INTEGER NOT NULL
);

-- 하루 사용 횟수 제한 (보내기, 받기, 도서 검색)
CREATE TABLE IF NOT EXISTS limits (
  k    TEXT    NOT NULL,
  day  TEXT    NOT NULL,
  n    INTEGER NOT NULL,
  PRIMARY KEY (k, day)
);
