"""Salary / Income schemas — comprehensive Indian payroll structure."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SalaryDocOut(BaseModel):
    id: str
    user_id: str
    filename: str
    status: str = "pending"  # pending | extracted | verified
    extracted: dict | None = None
    created_at: str | None = None


class SalaryVerifyRequest(BaseModel):
    doc_id: str
    verified_fields: dict = Field(default_factory=dict)


class AdditionalIncomeSource(BaseModel):
    """Repeatable block for non-salary income streams."""
    source_type: str  # freelance | rental | dividend | interest | other
    label: str = ""  # e.g. "Upwork freelancing", "Flat 2B rental"
    monthly_amount: float = 0.0


class SalaryManualRequest(BaseModel):
    """Comprehensive income entry — only net_take_home is required.
    All other fields enrich the profile for better forecasting."""

    # ── Core (required) ──────────────────────────────────────────────
    net_take_home: float  # The single mandatory field

    # ── Source metadata ──────────────────────────────────────────────
    income_source_type: str = "salary"  # salary | freelance | business | rental | pension | other
    employer_name: str | None = None
    pay_frequency: str = "monthly"  # monthly | bi-weekly | weekly | annual

    # ── Earnings breakdown (Indian payroll) ──────────────────────────
    ctc_annual: float | None = None  # Cost to Company per annum
    gross_monthly: float | None = None  # Before deductions
    basic: float | None = None  # Basic salary (40-50% of CTC)
    hra: float | None = None  # House Rent Allowance
    da: float | None = None  # Dearness Allowance
    special_allowance: float | None = None  # Catch-all taxable allowance
    other_allowances: float | None = None  # Conveyance, medical, LTA combined
    performance_bonus: float | None = None  # Monthly bonus amount
    variable_pay: float | None = None  # Commission / variable component

    # ── Statutory deductions ─────────────────────────────────────────
    pf_employee: float | None = None  # Employee PF contribution (12% of Basic+DA)
    professional_tax: float | None = None  # State-level, max ₹2,500/yr
    income_tax_tds: float | None = None  # TDS as per slab
    esi_contribution: float | None = None  # ESI if gross ≤ ₹21,000/month
    other_deductions: float | None = None  # Voluntary deductions

    # ── Additional income sources ────────────────────────────────────
    additional_incomes: list[AdditionalIncomeSource] = Field(default_factory=list)

    # ── Period ───────────────────────────────────────────────────────
    month: str | None = None  # YYYY-MM
