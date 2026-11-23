import unittest
from datetime import date
from normalize import bucket, is_jeonse, stats, norm_name, to_manwon

class T(unittest.TestCase):
    def test_bucket(self):
        self.assertEqual(bucket(59.97), 59); self.assertEqual(bucket(60.5), None)   # 흔한 59.9x㎡ 는 59형에 포함
        self.assertEqual(bucket(84.98), 84); self.assertEqual(bucket(85.5), None)
        self.assertEqual(bucket(101.4), 101); self.assertEqual(bucket(70), None)
    def test_rent(self):
        self.assertTrue(is_jeonse(50000, 0)); self.assertFalse(is_jeonse(5000, 120)); self.assertFalse(is_jeonse(0, 0))
    def test_stats(self):
        rows = [{"date": "2026-10-01", "area": 59.0, "amount": 240000}, {"date": "2026-02-01", "area": 58.2, "amount": 230000},
                {"date": "2025-01-01", "area": 59.0, "amount": 100000}, {"date": "2026-10-05", "area": 84.0, "amount": 400000}]
        s = stats(rows, 59, date(2026, 11, 22))
        self.assertEqual((s["min"], s["max"], s["count"], s["last"]), (23.0, 24.0, 2, "2026-10-01"))
        self.assertIsNone(stats(rows, 101, date(2026, 11, 22)))
    def test_names(self):
        self.assertEqual(norm_name("래미안 대치팰리스(1단지)"), norm_name("래미안대치팰리스아파트"))
        self.assertEqual(to_manwon("245,000"), 245000)

if __name__ == "__main__": unittest.main()
