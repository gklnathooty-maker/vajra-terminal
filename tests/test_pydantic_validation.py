import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.lib.goks.schemas import (
    StrictLot,
    StrictSettings,
    StrictDeskBackup,
    StrictChartBody,
    validate_and_sanitize_lot,
    validate_and_sanitize_backup,
    validate_and_sanitize_chart,
)


class TestPydanticValidation(unittest.TestCase):
    def test_valid_lot_sanitization(self):
        raw = {
            "id": "lot-1",
            "symbol": "   hdfcbank.ns   ",
            "qty": 20,
            "cost": 1745.0,
            "date": "2026-02-01",
        }
        clean = validate_and_sanitize_lot(raw)
        self.assertEqual(clean["symbol"], "HDFCBANK.NS")
        self.assertEqual(clean["qty"], 20.0)
        self.assertEqual(clean["cost"], 1745.0)

    def test_reject_extra_and_negative_lot(self):
        bad = {
            "id": "lot-1",
            "symbol": "TCS.NS",
            "qty": -10,  # Negative qty forbidden
            "cost": 4120,
            "date": "2026-02-01",
            "injected_field": "exploit",  # Extra fields forbidden
        }
        with self.assertRaises(ValueError):
            validate_and_sanitize_lot(bad)

    def test_strict_settings_boundaries(self):
        # maxWeight must be <= 1.0 and > 0
        with self.assertRaises(Exception):
            StrictSettings(maxWeight=1.5)

        with self.assertRaises(Exception):
            StrictSettings(rf=-0.05)

        good_settings = StrictSettings(maxWeight=0.25, rf=0.07)
        self.assertEqual(good_settings.maxWeight, 0.25)
        self.assertEqual(good_settings.rf, 0.07)

    def test_valid_desk_backup(self):
        backup = {
            "app": "goks-chart",
            "version": 1,
            "exportedAt": "2026-11-11T12:00:00Z",
            "desk": {
                "section": "portfolio",
                "symbol": "RELIANCE.NS",
                "lots": [
                    {"id": "l-1", "symbol": "RELIANCE.NS", "qty": 10, "cost": 2800.0, "date": "2026-01-10"}
                ],
                "portfolioCash": 50000.0,
                "dividends": [],
                "alerts": [],
                "watches": [{"id": "w-1", "name": "Main", "symbols": ["TCS.NS"]}],
                "paper": [],
                "paperCash": 1000000.0,
                "assumptions": {},
                "screens": [],
                "settings": {
                    "rf": 0.065,
                    "brokeragePct": 0.03,
                    "slippagePct": 0.05,
                    "sellChargePct": 0.1,
                    "breadthMin": 0.55,
                    "above200Min": 0.5,
                    "maxWeight": 0.2
                }
            }
        }
        clean = validate_and_sanitize_backup(backup)
        self.assertEqual(clean["app"], "goks-chart")
        self.assertEqual(len(clean["desk"]["lots"]), 1)
        self.assertEqual(clean["desk"]["lots"][0]["symbol"], "RELIANCE.NS")

    def test_reject_corrupt_desk_backup(self):
        corrupt = {
            "app": "fake-app",
            "version": 999,
            "exportedAt": "2026-11-11",
            "desk": {}
        }
        with self.assertRaises(ValueError):
            validate_and_sanitize_backup(corrupt)


if __name__ == "__main__":
    unittest.main()
