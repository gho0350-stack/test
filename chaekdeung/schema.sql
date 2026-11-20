-- 책등 D1 스키마. 개인 식별 정보는 저장하지 않습니다 (기기 ID는 브라우저가 만든 무작위 값, IP는 해시만 보관).

CREATE TABLE IF NOT EXISTS lights (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  device      TEXT    NOT NULL,                 -- 관리자가 쓴 문장은 'admin'
  source      TEXT    NOT NULL DEFAULT 'user',  -- 'user' 독자가 남긴 문장, 'admin' 관리자가 고른 문장
  book        TEXT    NOT NULL,
  author      TEXT    NOT NULL DEFAULT '',
  quote       TEXT    NOT NULL,
  note        TEXT    NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  deliveries  INTEGER NOT NULL DEFAULT 0,
  thanks      INTEGER NOT NULL DEFAULT 0,       -- "고마워요"를 받은 횟수
  reports     INTEGER NOT NULL DEFAULT 0,
  hidden      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_lights_pool ON lights (hidden, source, deliveries, created_at);
CREATE INDEX IF NOT EXISTS idx_lights_device ON lights (device);

-- 누가 어떤 문장을 이미 받았는지 (같은 문장을 두 번 받지 않도록)
CREATE TABLE IF NOT EXISTS seen (
  device    TEXT    NOT NULL,
  light_id  INTEGER NOT NULL,
  at        INTEGER NOT NULL,
  PRIMARY KEY (device, light_id)
);

-- 받은 문장에 누른 "고마워요" (한 사람이 한 문장에 한 번)
CREATE TABLE IF NOT EXISTS thanks (
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

-- 서점 링크를 누른 횟수 (누가 눌렀는지는 저장하지 않습니다)
CREATE TABLE IF NOT EXISTS clicks (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  store  TEXT    NOT NULL,
  book   TEXT    NOT NULL,
  at     INTEGER NOT NULL
);

-- 하루 사용 횟수 제한 (보내기, 받기, 도서 검색, 관리자 로그인 실패)
CREATE TABLE IF NOT EXISTS limits (
  k    TEXT    NOT NULL,
  day  TEXT    NOT NULL,
  n    INTEGER NOT NULL,
  PRIMARY KEY (k, day)
);
