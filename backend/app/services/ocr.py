"""OCR service stub — returns mocked salary extraction."""

from __future__ import annotations

from datetime import datetime, timezone


def extract_salary_data(filename: str, _file_bytes: bytes) -> dict:
    """Simulate OCR extraction from a salary slip.

    In production this would call an OCR engine (Tesseract / cloud API).
    """
    return {
        "employee_name": "Jane Doe",
        "employer": "Acme Corp",
        "month": datetime.now(timezone.utc).strftime("%Y-%m"),
        "gross_salary": 85000.00,
        "deductions": 12000.00,
        "net_salary": 73000.00,
        "components": {
            "basic": 42500.00,
            "hra": 17000.00,
            "special_allowance": 25500.00,
        },
    }
