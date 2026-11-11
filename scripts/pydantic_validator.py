#!/usr/bin/env python3
"""
CLI utility to strictly validate and sanitize JSON files using Pydantic v2.
Usage:
  python scripts/pydantic_validator.py backup <file.json>
  python scripts/pydantic_validator.py chart <file.json>
  python scripts/pydantic_validator.py lot <file.json>
"""

import sys
import json
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.lib.goks.schemas import (
    validate_and_sanitize_backup,
    validate_and_sanitize_chart,
    validate_and_sanitize_lot,
)


def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/pydantic_validator.py <backup|chart|lot> <path/to/file.json>")
        sys.exit(1)

    schema_type = sys.argv[1].lower()
    file_path = Path(sys.argv[2])

    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    try:
        content = file_path.read_text(encoding="utf-8")
        if schema_type == "backup":
            sanitized = validate_and_sanitize_backup(content)
            print("✓ SUCCESS: Valid and sanitized GOKS Desk Backup JSON.")
        elif schema_type == "chart":
            sanitized = validate_and_sanitize_chart(content)
            print("✓ SUCCESS: Valid and sanitized Market Chart JSON.")
        elif schema_type == "lot":
            sanitized = validate_and_sanitize_lot(content)
            print("✓ SUCCESS: Valid and sanitized Portfolio Lot JSON.")
        else:
            print(f"Error: Unknown schema type '{schema_type}'. Choose 'backup', 'chart', or 'lot'.")
            sys.exit(1)

        print(f"Cleaned fields summary: {list(sanitized.keys())}")
        sys.exit(0)

    except Exception as exc:
        print(f"✗ VALIDATION FAILED: {exc}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()

