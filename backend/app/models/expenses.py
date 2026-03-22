"""Expense & Goal schemas — market-research-grade parameters."""

from __future__ import annotations

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════════════
# EXPENSES
# ═══════════════════════════════════════════════════════════════════════

EXPENSE_CATEGORIES = [
    "Housing",
    "Utilities",
    "Food & Groceries",
    "Transportation",
    "Healthcare",
    "Education",
    "Insurance",
    "Debt Payments",
    "Personal Care",
    "Entertainment",
    "Household",
    "Family & Dependents",
    "Travel & Vacation",
    "Miscellaneous",
]

EXPENSE_FREQUENCIES = ["monthly", "quarterly", "semi-annual", "annual"]


class ExpenseIn(BaseModel):
    category: str  # One of EXPENSE_CATEGORIES
    amount: float  # Amount per occurrence
    frequency: str = "monthly"  # monthly | quarterly | semi-annual | annual
    is_essential: bool = True  # Need vs Want — used for risk analysis
    is_fixed: bool = True  # Fixed vs Variable — forecast accuracy
    description: str = ""
    date: str | None = None  # ISO date string


class ExpenseOut(BaseModel):
    id: str
    user_id: str
    category: str
    amount: float
    frequency: str = "monthly"
    is_essential: bool = True
    is_fixed: bool = True
    monthly_amount: float = 0.0  # Computed: normalized to monthly
    description: str = ""
    date: str | None = None


class ExpenseBulkIn(BaseModel):
    """Create multiple baseline expenses at once."""
    expenses: list[ExpenseIn]


# ═══════════════════════════════════════════════════════════════════════
# GOALS
# ═══════════════════════════════════════════════════════════════════════

GOAL_CATEGORIES = [
    "Emergency Fund",
    "Debt Payoff",
    "Vacation / Travel",
    "Gadget / Purchase",
    "Car Purchase",
    "Home Down Payment",
    "Wedding",
    "Education",
    "Child's Education",
    "Retirement",
    "Wealth Building",
    "Custom",
]

GOAL_PRIORITIES = ["critical", "high", "medium", "low"]
GOAL_RISK_LEVELS = ["conservative", "moderate", "aggressive"]
GOAL_FLEXIBILITY = ["fixed_deadline", "flexible"]


class GoalIn(BaseModel):
    category: str = "Custom"  # One of GOAL_CATEGORIES
    title: str
    target_amount: float
    current_savings: float = 0.0  # Already saved toward this goal
    monthly_contribution: float | None = None  # Planned monthly savings
    deadline: str | None = None  # ISO date
    priority: str = "medium"  # critical | high | medium | low
    risk_tolerance: str = "moderate"  # conservative | moderate | aggressive
    flexibility: str = "flexible"  # fixed_deadline | flexible
    notes: str = ""


class GoalOut(BaseModel):
    id: str
    user_id: str
    category: str = "Custom"
    title: str
    target_amount: float
    current_savings: float = 0.0
    monthly_contribution: float | None = None
    deadline: str | None = None
    priority: str = "medium"
    risk_tolerance: str = "moderate"
    flexibility: str = "flexible"
    notes: str = ""
    # Computed fields
    remaining_amount: float = 0.0
    months_to_deadline: int | None = None
    required_monthly: float | None = None  # Auto-computed if deadline set
