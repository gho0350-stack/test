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

-- =====================================================================
-- 정식 서비스용 확장 (PostgreSQL + PostGIS). 위의 apt/apt_school 은 아래 구조로 대체한다.
-- =====================================================================
-- CREATE EXTENSION postgis;

CREATE TABLE apt_master (                      -- 전체 아파트 마스터 (K-apt U 국토부 실거래 U 건축물대장)
  apt_uid        TEXT PRIMARY KEY,             -- 법정동코드(시군구5)-동명-대표지번 (필지 중복 시 #2, #3)
  name           TEXT NOT NULL,                -- 대표 단지명 (K-apt 우선)
  gu TEXT, dong TEXT, bjd_code TEXT,           -- 법정동코드 10자리
  road_addr      TEXT,
  households INTEGER, dong_count INTEGER, approved_date DATE, build_year INTEGER,
  kapt_code      TEXT,                         -- 없으면 NULL (K-apt 미등록 소규모 단지)
  sources        TEXT[],                       -- {kapt, molit, bldrgst}
  match_method   TEXT CHECK (match_method IN ('lot','name','none')),
  location       GEOMETRY(Point, 4326),        -- 대표 좌표
  boundary       GEOMETRY(MultiPolygon, 4326), -- 단지 경계
  boundary_type  TEXT NOT NULL DEFAULT 'none' CHECK (boundary_type IN ('none','estimated','actual')),
  boundary_note  TEXT                          -- 병합한 필지 목록, 검증 상태
);
CREATE TABLE apt_lot (                         -- 복수 지번 / 필지 (PNU)
  apt_uid TEXT REFERENCES apt_master, lot TEXT, pnu TEXT, is_primary BOOLEAN DEFAULT FALSE, PRIMARY KEY (apt_uid, lot)
);
CREATE TABLE apt_alias (apt_uid TEXT REFERENCES apt_master, alias TEXT, source TEXT, PRIMARY KEY (apt_uid, alias));
CREATE TABLE apt_match_issue (                 -- 매칭 실패·충돌 관리
  issue_id SERIAL PRIMARY KEY, kind TEXT, source TEXT, ref TEXT, detail TEXT, resolved BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE apt_trade_raw (                   -- 거래 원본 (취소·정정 반영 위해 계약월 단위로 갱신)
  apt_uid TEXT, deal_ym TEXT, deal_date DATE, area NUMERIC, floor INT, amount_manwon INT, cancel_flag TEXT, deal_type TEXT,
  collected_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE apt_rent_raw (apt_uid TEXT, deal_ym TEXT, deal_date DATE, area NUMERIC, floor INT, deposit_manwon INT, monthly_manwon INT, contract_type TEXT, collected_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE school_zone (                     -- 학구도: 학교급별 경계 + 배정 규칙 (경계 포함 != 배정 확정)
  zone_id TEXT PRIMARY KEY, school_level TEXT CHECK (school_level IN ('초','중','고')),
  zone_kind TEXT CHECK (zone_kind IN ('통학구역','중학구','학교군','비평준화지역')),
  zone_name TEXT, geom GEOMETRY(MultiPolygon, 4326),
  rule_type TEXT CHECK (rule_type IN ('지정배정','추첨','선지원후추첨','별도전형')),
  rule_note TEXT, valid_year INT, source_name TEXT, source_url TEXT, collected_at DATE
);
CREATE TABLE school_zone_school (zone_id TEXT REFERENCES school_zone, school_id TEXT REFERENCES school, relation TEXT, PRIMARY KEY (zone_id, school_id));
-- 같은 학교군 아파트 조회:  SELECT a.* FROM apt_master a JOIN school_zone z ON ST_Covers(z.geom, a.location) WHERE z.zone_id = :zone;

CREATE TABLE school_admission (                -- 진학 실적: 빈 값(NULL)은 미공개이며 0이 아니다
  school_id TEXT, admission_year INT, graduate_count INT, medical_count INT, sky_count INT, inseoul_count INT,
  count_type TEXT CHECK (count_type IN ('합격건수','등록인원')), student_scope TEXT CHECK (student_scope IN ('재학생만','재학생+졸업생')),
  duplicate_included TEXT CHECK (duplicate_included IN ('포함','제외','알수없음')),
  source_type TEXT CHECK (source_type IN ('학교발표','공식공시','언론','기타')), source_url TEXT,
  verified_status TEXT CHECK (verified_status IN ('확인완료','미확인')), verified_at DATE, note TEXT,
  PRIMARY KEY (school_id, admission_year)
);
CREATE TABLE collection_run (run_id SERIAL PRIMARY KEY, started_at TIMESTAMPTZ, source TEXT, ok BOOLEAN, rows_in INT, rows_changed INT, detail JSONB);  -- 수집 이력·품질 리포트
