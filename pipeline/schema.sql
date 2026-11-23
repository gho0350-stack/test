-- 어디살지 통합 DB 스키마 (SQLite/PostgreSQL 호환 문법 위주)
-- 원칙: 출처(source)와 기준일(as_of)을 모든 지표 테이블에 남긴다.

CREATE TABLE school (
  school_id      TEXT PRIMARY KEY,          -- NEIS SD_SCHUL_CODE (예: 7010268)
  edu_office     TEXT NOT NULL,             -- ATPT_OFCDC_SC_CODE (예: B10)
  name           TEXT NOT NULL,
  level          TEXT NOT NULL,             -- 초/중/고
  hs_type        TEXT,                      -- 일반고/자율고/특목고/특성화고 (HS_SC_NM)
  founding       TEXT,                      -- 공립/사립 (FOND_SC_NM)
  coedu          TEXT,                      -- 남/여/남여공학 (COEDU_SC_NM)
  road_addr      TEXT, zipcode TEXT, homepage TEXT,
  lat REAL, lon REAL,                       -- 학구도 학교위치 CSV 또는 카카오 지오코딩
  loaded_at      TEXT                       -- NEIS LOAD_DTM
);

CREATE TABLE school_zone (                  -- 학구도안내서비스 SHP -> GeoJSON/PostGIS
  zone_id TEXT PRIMARY KEY, school_id TEXT REFERENCES school, zone_kind TEXT,  -- 통학구역/학교군/비평준화
  geom_geojson TEXT, as_of TEXT, source TEXT DEFAULT '학구도안내서비스'
);

CREATE TABLE school_stats (                 -- 진학 실적은 반드시 출처 등급과 기준을 함께 저장
  school_id TEXT REFERENCES school, year INTEGER,
  graduates INTEGER, med INTEGER, sky INTEGER, seoul INTEGER,
  source_tier TEXT CHECK (source_tier IN ('공식공시','학교발표','별도집계')),
  source_note TEXT,                         -- 출처 URL/문서명
  basis TEXT,                               -- 재학생만/졸업생 포함, 중복합격 포함 여부, 등록 인원 여부
  PRIMARY KEY (school_id, year, source_tier)
);

CREATE TABLE apt (
  apt_id TEXT PRIMARY KEY,                  -- K-apt kaptCode 우선
  name TEXT NOT NULL, sigungu_cd TEXT, dong TEXT, road_addr TEXT, jibun_addr TEXT,
  lat REAL, lon REAL
);
CREATE TABLE apt_stats (apt_id TEXT REFERENCES apt, households INTEGER, dong_count INTEGER, approved_date TEXT, source TEXT DEFAULT 'K-apt', as_of TEXT);

CREATE TABLE apt_trade (apt_id TEXT REFERENCES apt, deal_date TEXT, area REAL, floor INTEGER, amount_manwon INTEGER, build_year INTEGER, area_bucket INTEGER);
CREATE TABLE apt_rent  (apt_id TEXT REFERENCES apt, deal_date TEXT, area REAL, floor INTEGER, deposit_manwon INTEGER, monthly_manwon INTEGER,
                        rent_kind TEXT CHECK (rent_kind IN ('전세','월세')), area_bucket INTEGER);

CREATE TABLE apt_school (                   -- 학교-아파트 연결 (양방향 조회의 핵심)
  apt_id TEXT REFERENCES apt, school_id TEXT REFERENCES school,
  relation TEXT CHECK (relation IN ('통학구역','학교군','수동확인')),
  walk_meters INTEGER, walk_minutes INTEGER,   -- 카카오/TMAP 보행 경로
  confidence TEXT,                           -- 확정/GIS추정/확인필요
  PRIMARY KEY (apt_id, school_id)
);

CREATE TABLE facility (facility_id TEXT PRIMARY KEY, kind TEXT, name TEXT, road_addr TEXT, dong TEXT, lat REAL, lon REAL, source TEXT, extra_json TEXT);
-- kind: academy / hospital / pharmacy / park / library / subway / bus / daycare / kindergarten

CREATE TABLE member (member_id INTEGER PRIMARY KEY, email TEXT UNIQUE, nickname TEXT UNIQUE, region TEXT, residence_verified INTEGER DEFAULT 0, created_at TEXT);
CREATE TABLE community_post (post_id INTEGER PRIMARY KEY, board TEXT, region TEXT, school_id TEXT, apt_id TEXT, member_id INTEGER REFERENCES member, title TEXT, body TEXT, created_at TEXT);
CREATE TABLE community_comment (comment_id INTEGER PRIMARY KEY, post_id INTEGER REFERENCES community_post, member_id INTEGER REFERENCES member, body TEXT, created_at TEXT);
CREATE TABLE message (msg_id INTEGER PRIMARY KEY, from_member INTEGER, to_member INTEGER, body TEXT, read_at TEXT, created_at TEXT);
