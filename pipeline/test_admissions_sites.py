import unittest
import admissions_sites as s
PAGES = {
 "http://x.hs.kr": (b"<html><body><a href='/info/jinhak.do'>\xec\xa7\x84\xed\x95\x99 \xec\x8b\xa4\xec\xa0\x81</a><a href='/etc'>other</a><a href='http://other.com/jinhak'>\xec\xa7\x84\xed\x95\x99</a></body></html>"),
 "http://x.hs.kr/info/jinhak.do": ("<html><body>" + "2026학년도 대입 서울대 합격 12명 의대 합격 30명입니다. " * 20 + "</body></html>").encode("utf8"),
}
def fake(u):
    if u in PAGES: return "text/html; charset=utf-8", PAGES[u]
    raise IOError("404")
class T(unittest.TestCase):
    def test_discover(self):
        s.robots_ok = lambda url, cache={}: True
        out = s.discover("x.hs.kr", fetch=fake, delay=0, log=lambda *a: None)
        self.assertEqual(len(out), 1); self.assertTrue(out[0][0].endswith("/info/jinhak.do")); self.assertIn("2026학년도", out[0][1])
    def test_same_site(self): self.assertFalse(s.same_site("http://other.com/a", "http://x.hs.kr")); self.assertTrue(s.same_site("http://www.x.hs.kr/a", "http://x.hs.kr"))
if __name__ == "__main__": unittest.main()
