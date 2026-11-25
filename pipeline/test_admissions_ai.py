import json, os, tempfile, unittest
import admissions_ai as a
class T(unittest.TestCase):
    def test_plan_skips_have(self):
        p = a.plan_queries([{"id": "h", "name": "휘문고"}], [2025, 2026], {("h", 2026): {"MED", "SNU", "SKY", "INSEOUL"}})
        self.assertEqual(len(p), 1); self.assertEqual(p[0]["year"], 2025); self.assertIn("휘문고 2025학년도 대입 실적", p[0]["queries"])
    def test_parse_drops_hallucination(self):
        src = "2026학년도 의대는 139건, 서울대 50건이다(중복 포함)."
        resp = json.dumps([{"category": "MED", "count": 139, "evidence": "2026학년도 의대는 139건"}, {"category": "SNU", "count": 99, "evidence": "서울대 99건이 합격했다고 한다"}])
        ok, bad = a.parse_rows(resp, src)
        self.assertEqual([x["category"] for x in ok], ["MED"]); self.assertEqual(len(bad), 1)
    def test_parse_bad_category(self):
        ok, bad = a.parse_rows(json.dumps([{"category": "XX", "count": 1, "evidence": "e"}]), None); self.assertEqual(ok, []); self.assertEqual(len(bad), 1)
    def test_usage_and_limit(self):
        with tempfile.TemporaryDirectory() as d:
            u = a.Usage(os.path.join(d, "u.json")); u.add("gemini", 1, 100, 20); u.add("gemini", 1, 50, 10); u.save()
            self.assertEqual(a.Usage(os.path.join(d, "u.json")).today("gemini"), 2)
            os.environ["AI_PROVIDER"] = "gemini"; os.environ["AI_MAX_CALLS"] = "2"
            with self.assertRaises(RuntimeError): a.ask_ai("p", usage=u)
    def test_row_campus_unknown_is_unclear(self):
        r = a.to_raw_row({"category": "YONSEI", "count": 68, "evidence": "연세대 68건", "campus_scope": "알수없음"}, {"id": "h", "name": "휘문고등학교"}, 2026, "localnaeil", "https://x", "텍스트", "o")
        self.assertEqual(r["range_check"], "불명확")
if __name__ == "__main__": unittest.main()
