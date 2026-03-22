"""OCR service — salary slip data extraction.

TODO (for developer):
  1. Install Tesseract: pip install pytesseract
     (also install Tesseract binary: https://github.com/tesseract-ocr/tesseract)
  2. OR use cloud OCR: pip install google-cloud-vision / boto3 (for AWS Textract)
  3. Implement extract_salary_data_real() with actual OCR
  4. Add post-processing regex patterns for Indian payslips
  5. Add confidence scores per extracted field

Current behaviour: returns mock data for development. The mock is clearly labeled.
"""

from __future__ import annotations

from datetime import datetime, timezone
import re


def extract_salary_data(filename: str, file_bytes: bytes) -> dict:
    """Extract salary data from a file.

    Tries real OCR first; falls back to mock if OCR is not available.
    """
    try:
        return extract_salary_data_real(filename, file_bytes)
    except NotImplementedError:
        return extract_salary_data_mock(filename)


def extract_salary_data_real(filename: str, file_bytes: bytes) -> dict:
    """Real OCR extraction from a salary slip.

    TODO: Implement with Tesseract or cloud OCR API.

    Example with pytesseract:
        import pytesseract
        from PIL import Image
        import io

        if filename.lower().endswith('.pdf'):
            # Use pdf2image to convert PDF pages to images first
            from pdf2image import convert_from_bytes
            images = convert_from_bytes(file_bytes)
            text = " ".join(pytesseract.image_to_string(img) for img in images)
        else:
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image)

        return parse_salary_text(text)

    Example with Google Cloud Vision:
        from google.cloud import vision
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=file_bytes)
        response = client.text_detection(image=image)
        text = response.text_annotations[0].description
        return parse_salary_text(text)
    """
    raise NotImplementedError("Real OCR not configured. Using mock extraction.")


def parse_salary_text(raw_text: str) -> dict:
    """Parse raw OCR text to extract salary components.

    Uses regex patterns common in Indian payslips.
    Returns structured dict with extracted values + confidence.
    """
    def find_amount(pattern: str, text: str) -> float | None:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1).replace(",", ""))
            except (ValueError, IndexError):
                return None
        return None

    gross = find_amount(r"gross\s*(?:salary|pay|earnings?)[\s:₹]*([0-9,]+\.?\d*)", raw_text)
    net = find_amount(r"net\s*(?:salary|pay|take[\s-]*home)[\s:₹]*([0-9,]+\.?\d*)", raw_text)
    basic = find_amount(r"basic(?:\s*salary)?[\s:₹]*([0-9,]+\.?\d*)", raw_text)
    hra = find_amount(r"(?:hra|house\s*rent)[\s:₹]*([0-9,]+\.?\d*)", raw_text)
    deductions = find_amount(r"(?:total\s*)?deductions?[\s:₹]*([0-9,]+\.?\d*)", raw_text)
    tax = find_amount(r"(?:income\s*)?tax[\s:₹]*([0-9,]+\.?\d*)", raw_text)
    pf = find_amount(r"(?:pf|provident\s*fund|epf)[\s:₹]*([0-9,]+\.?\d*)", raw_text)

    return {
        "month": datetime.now(timezone.utc).strftime("%Y-%m"),
        "gross_salary": gross,
        "net_salary": net,
        "deductions": deductions,
        "tax_monthly": tax,
        "pf_or_deductions": pf,
        "components": {
            "basic": basic,
            "hra": hra,
        },
        "raw_text_preview": raw_text[:500],
        "source": "ocr",
    }


def extract_salary_data_mock(filename: str) -> dict:
    """Mock OCR extraction for development — returns realistic sample data."""
    return {
        "employee_name": "Jane Doe",
        "employer": "Acme Corp",
        "month": datetime.now(timezone.utc).strftime("%Y-%m"),
        "gross_salary": 85000.00,
        "deductions": 12000.00,
        "net_salary": 73000.00,
        "tax_monthly": 6000.00,
        "pf_or_deductions": 6000.00,
        "components": {
            "basic": 42500.00,
            "hra": 17000.00,
            "special_allowance": 25500.00,
        },
        "source": "mock",
    }
