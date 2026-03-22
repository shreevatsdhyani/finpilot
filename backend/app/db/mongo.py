"""MongoDB client & helpers."""

from __future__ import annotations

from datetime import datetime, timezone

from pymongo import MongoClient
from pymongo.errors import PyMongoError
from pymongo.database import Database

from app.core.config import settings
from app.core.security import hash_password

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        try:
            _client = MongoClient(
                settings.MONGO_URI,
                serverSelectionTimeoutMS=settings.MONGO_SERVER_SELECTION_TIMEOUT_MS,
            )
            # Validate connection early so route handlers don't block repeatedly.
            _client.admin.command("ping")
        except PyMongoError as exc:
            if not settings.MONGO_MOCK_FALLBACK:
                raise
            try:
                import mongomock

                _client = mongomock.MongoClient()
                print(f"[WARN] MongoDB unavailable, using in-memory mongomock: {exc}")
            except Exception:
                # Re-raise original connection error if fallback cannot be initialized.
                raise exc
    return _client


def get_db() -> Database:
    return get_client()[settings.MONGO_DB]


def seed_auth_access_credentials(db: Database) -> None:
    """Seed approved registration credentials from env if provided.

    Format: AUTH_ACCESS_CREDENTIALS="id1:pass1,id2:pass2"
    """
    users_coll = db["users"]
    access_coll = db["auth_access_credentials"]

    users_coll.create_index("email", unique=True)
    access_coll.create_index("access_id", unique=True)

    raw = settings.AUTH_ACCESS_CREDENTIALS.strip()
    if not raw:
        return

    for pair in raw.split(","):
        item = pair.strip()
        if not item or ":" not in item:
            continue
        access_id, access_password = item.split(":", 1)
        access_id = access_id.strip()
        access_password = access_password.strip()
        if not access_id or not access_password:
            continue

        existing = access_coll.find_one({"access_id": access_id})
        if existing:
            continue

        access_coll.insert_one(
            {
                "access_id": access_id,
                "password_hash": hash_password(access_password),
                "is_used": False,
                "used_by": None,
                "used_at": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )


def seed_policies(db: Database) -> None:
    """Insert a curated corpus of Indian financial policies if the collection is empty."""
    coll = db["policies"]
    if coll.count_documents({}) > 0:
        return

    now = datetime.now(timezone.utc).isoformat()
    policies = [
        # ─── Tax ───────────────────────────────────────
        {
            "title": "Section 80C – Deductions on Investments",
            "summary": "Up to ₹1.5 lakh per year can be deducted from taxable income via specified instruments like PPF, ELSS, and EPF.",
            "body": "Under Section 80C of the Income Tax Act, 1961, individual taxpayers and HUFs can claim deductions up to ₹1,50,000 per financial year. Eligible instruments include Public Provident Fund (PPF), Equity-Linked Savings Schemes (ELSS), Employee Provident Fund (EPF), National Savings Certificates (NSC), 5-year fixed deposits, Sukanya Samriddhi Yojana, and life insurance premiums. The deduction is available from the gross total income before computing tax liability. This is one of the most popular tax-saving provisions and should be maximised before considering taxable investments.",
            "category": "tax",
            "tags": ["80C", "tax saving", "PPF", "ELSS", "EPF", "deductions"],
            "region": "India",
            "source_url": "https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx",
            "source_name": "Income Tax Department of India",
            "published_at": "2024-04-01",
            "effective_from": "2024-04-01",
            "last_updated": now,
            "version": 1,
        },
        {
            "title": "New Tax Regime – Default from FY 2023-24",
            "summary": "The new tax regime with lower slab rates is now the default. Taxpayers must explicitly opt for the old regime if they want deductions.",
            "body": "From FY 2023-24 onwards, the new tax regime under Section 115BAC is the default regime for individual taxpayers. The slabs are: up to ₹3 lakh – nil; ₹3-6 lakh – 5%; ₹6-9 lakh – 10%; ₹9-12 lakh – 15%; ₹12-15 lakh – 20%; above ₹15 lakh – 30%. A standard deduction of ₹50,000 is allowed for salaried individuals. However, most deductions under 80C, 80D, HRA exemption, etc., are not available under this regime. Taxpayers with significant deductions and exemptions should compare both regimes before filing. The old regime must be explicitly elected.",
            "category": "tax",
            "tags": ["new regime", "115BAC", "tax slabs", "FY2023-24"],
            "region": "India",
            "source_url": "https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx",
            "source_name": "Income Tax Department of India",
            "published_at": "2023-04-01",
            "effective_from": "2023-04-01",
            "last_updated": now,
            "version": 1,
        },
        {
            "title": "Section 80D – Health Insurance Premium Deduction",
            "summary": "Deductions up to ₹25,000 (₹50,000 for senior citizens) on health insurance premiums paid for self, spouse, children, and parents.",
            "body": "Under Section 80D, a deduction of up to ₹25,000 is available for health insurance premiums paid for self, spouse, and dependent children. An additional ₹25,000 (₹50,000 if a senior citizen) is available for parents' health insurance. Preventive health check-up expenses up to ₹5,000 are also included within this limit. This deduction is available under both old and new (post-amendment) tax regimes, making it universally beneficial. It is strongly recommended to maintain adequate family health cover.",
            "category": "tax",
            "tags": ["80D", "health insurance", "mediclaim", "deductions", "senior citizen"],
            "region": "India",
            "source_url": "https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx",
            "source_name": "Income Tax Department of India",
            "published_at": "2024-04-01",
            "effective_from": "2024-04-01",
            "last_updated": now,
            "version": 1,
        },
        # ─── Rates ─────────────────────────────────────
        {
            "title": "RBI Repo Rate – Current Monetary Policy",
            "summary": "The RBI repo rate is the rate at which RBI lends to commercial banks. Changes affect home loan EMIs, FD rates, and overall borrowing costs.",
            "body": "The Reserve Bank of India's Monetary Policy Committee (MPC) sets the repo rate to control inflation and liquidity. As of recent policy meetings, the repo rate influences: home loan interest rates (most are linked to RLLR/EBLR), fixed deposit returns, and personal loan pricing. A rate cut typically leads to lower EMIs for new and existing floating-rate borrowers and lower FD returns. Conversely, a hike increases borrowing costs but improves deposit income. Salaried individuals should monitor rate changes to time refinancing decisions and lock-in FD rates strategically.",
            "category": "rates",
            "tags": ["RBI", "repo rate", "MPC", "interest rate", "home loan", "EMI"],
            "region": "India",
            "source_url": "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx",
            "source_name": "Reserve Bank of India",
            "published_at": "2025-02-07",
            "effective_from": "2025-02-07",
            "last_updated": now,
            "version": 1,
        },
        {
            "title": "PPF Interest Rate – Small Savings Scheme",
            "summary": "PPF currently earns a government-declared interest rate, compounded annually, with a 15-year lock-in and EEE tax status.",
            "body": "The Public Provident Fund rate is set quarterly by the Ministry of Finance based on government security yields. PPF enjoys Exempt-Exempt-Exempt (EEE) status: contributions qualify under 80C, interest earned is tax-free, and maturity proceeds are tax-free. The current minimum annual deposit is ₹500 and maximum is ₹1.5 lakh. PPF has a 15-year maturity with partial withdrawal allowed from the 7th year. It remains one of the safest long-term savings instruments for risk-averse investors and is ideal for retirement planning alongside NPS.",
            "category": "rates",
            "tags": ["PPF", "small savings", "interest rate", "EEE", "15 year"],
            "region": "India",
            "source_url": "https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=89",
            "source_name": "National Savings Institute",
            "published_at": "2025-01-01",
            "effective_from": "2025-01-01",
            "last_updated": now,
            "version": 1,
        },
        # ─── Insurance ─────────────────────────────────
        {
            "title": "Term Life Insurance – Adequate Cover Guideline",
            "summary": "Ensure term life cover equals at least 10-15x annual income to protect dependents against income loss.",
            "body": "Term life insurance provides a death benefit to nominees if the policyholder dies during the policy term. Financial planners recommend a cover of at least 10-15 times annual income, factoring in outstanding liabilities (home loan, car loan), children's education costs, and spouse's retirement needs. Pure term plans are the most cost-effective form of life insurance. Premiums are lowest when purchased young and healthy. The premium paid qualifies for deduction under Section 80C. Avoid mixing insurance with investment (avoid endowment/ULIP unless specifically needed). Riders like critical illness and accidental death add value at marginal cost.",
            "category": "insurance",
            "tags": ["term insurance", "life cover", "dependents", "80C", "premium"],
            "region": "India",
            "source_url": "https://www.irdai.gov.in/",
            "source_name": "IRDAI",
            "published_at": "2024-01-15",
            "effective_from": "2024-01-15",
            "last_updated": now,
            "version": 1,
        },
        {
            "title": "Health Insurance – Family Floater vs Individual",
            "summary": "A family floater plan covers the entire family under one sum insured. Individual plans offer dedicated cover per person.",
            "body": "Health insurance is essential to protect against medical inflation (10-14% per year in India). A family floater plan is cost-effective for young families: one sum insured is shared by all members. However, as members age or family size grows, individual plans with dedicated sum insured become more prudent. Key features to compare: co-payment clauses, room rent limits, sub-limits on specific treatments, waiting periods for pre-existing diseases, network hospital list, and claim settlement ratio. Super top-up plans at ₹5-10 lakh cover are an affordable way to boost coverage. Always maintain continuous cover to avoid fresh waiting periods.",
            "category": "insurance",
            "tags": ["health insurance", "floater", "mediclaim", "cashless", "super top-up"],
            "region": "India",
            "source_url": "https://www.irdai.gov.in/",
            "source_name": "IRDAI",
            "published_at": "2024-06-01",
            "effective_from": "2024-06-01",
            "last_updated": now,
            "version": 1,
        },
        # ─── Investing ─────────────────────────────────
        {
            "title": "SIP in Equity Mutual Funds – Systematic Investment",
            "summary": "SIP allows disciplined monthly investing in mutual funds, averaging purchase cost over market cycles.",
            "body": "A Systematic Investment Plan (SIP) lets investors put a fixed amount into a mutual fund scheme every month. This approach: (a) removes the need to time the market, (b) leverages rupee cost averaging — buying more units when prices fall and fewer when prices rise, and (c) builds discipline. For long-term wealth creation (7+ years), equity mutual funds via SIP have historically delivered 12-15% CAGR. ELSS funds combine tax saving under 80C with market-linked returns. Before starting, assess your risk profile, set clear goals (retirement, education, house), and choose between large-cap (lower risk), mid/small-cap (higher risk, higher return potential), and hybrid funds.",
            "category": "investing",
            "tags": ["SIP", "mutual funds", "equity", "ELSS", "wealth creation", "rupee cost averaging"],
            "region": "India",
            "source_url": "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=1",
            "source_name": "SEBI",
            "published_at": "2024-08-01",
            "effective_from": "2024-08-01",
            "last_updated": now,
            "version": 1,
        },
        {
            "title": "NPS – National Pension System for Retirement",
            "summary": "NPS offers an additional ₹50,000 deduction under 80CCD(1B) beyond the ₹1.5L limit of 80C. Ideal for long-term retirement corpus.",
            "body": "The National Pension System is a government-backed, market-linked retirement scheme. Contributions up to ₹1.5 lakh qualify under 80C/80CCD(1), and an additional ₹50,000 is deductible under 80CCD(1B), making total deduction potential ₹2 lakh per year. NPS allows allocation across equity (up to 75%), corporate bonds, and government securities. At maturity (age 60), 60% of the corpus is tax-free, and 40% must be used to buy an annuity. The annuity provides lifelong pension income. NPS Tier-I is locked until 60 (partial withdrawal allowed after 3 years for specific reasons). NPS Tier-II is flexible but doesn't offer tax benefits.",
            "category": "investing",
            "tags": ["NPS", "pension", "retirement", "80CCD", "annuity", "long-term"],
            "region": "India",
            "source_url": "https://www.npscra.nsdl.co.in/",
            "source_name": "NPS Trust / PFRDA",
            "published_at": "2024-04-01",
            "effective_from": "2024-04-01",
            "last_updated": now,
            "version": 1,
        },
        {
            "title": "Diversification – Don't Put All Eggs in One Basket",
            "summary": "Spread investments across equity, debt, gold, and real estate to reduce portfolio risk without sacrificing returns.",
            "body": "Diversification is the most fundamental investment principle. It reduces unsystematic risk — the risk specific to one company, sector, or asset class. A well-diversified Indian portfolio might include: (1) Equity mutual funds (large + mid cap) for growth, (2) Debt funds or FDs for stability, (3) Gold (Sovereign Gold Bonds for tax-efficient exposure), (4) Real estate (or REITs for liquid exposure), and (5) International equity for geographic diversification. The exact allocation depends on age, risk tolerance, and goal timelines. A common rule of thumb: equity allocation = 100 minus your age. Rebalance annually to maintain target allocation.",
            "category": "investing",
            "tags": ["diversification", "asset allocation", "risk management", "rebalancing", "portfolio"],
            "region": "India",
            "source_url": "https://www.sebi.gov.in/",
            "source_name": "SEBI",
            "published_at": "2024-01-01",
            "effective_from": "2024-01-01",
            "last_updated": now,
            "version": 1,
        },
        # ─── Credit ────────────────────────────────────
        {
            "title": "Credit Score – CIBIL Score Importance",
            "summary": "A CIBIL score of 750+ is essential for loan approvals at competitive interest rates. Check free once a year.",
            "body": "Your CIBIL score (TransUnion) ranges from 300 to 900 and is the primary factor used by Indian banks and NBFCs to evaluate creditworthiness. A score of 750+ is generally considered good and qualifies you for premium interest rates on home loans, personal loans, and credit cards. Key factors: (1) Payment history (35%) – Never miss an EMI/credit card due date, (2) Credit utilisation (30%) – Keep credit card usage below 30% of limit, (3) Credit mix (10%) – Having both secured and unsecured credit helps, (4) Credit age (15%) – Keep oldest credit card active, (5) Hard inquiries (10%) – Don't apply for multiple loans simultaneously. Check your score free once a year at cibil.com.",
            "category": "credit",
            "tags": ["CIBIL", "credit score", "loan approval", "credit card", "EMI"],
            "region": "India",
            "source_url": "https://www.cibil.com/",
            "source_name": "TransUnion CIBIL",
            "published_at": "2024-03-01",
            "effective_from": "2024-03-01",
            "last_updated": now,
            "version": 1,
        },
        {
            "title": "Debt Repayment Strategy – High Interest First",
            "summary": "Prioritise paying off high-interest debt (credit cards at 24-42% APR) before investing surplus income.",
            "body": "High-interest debt erodes wealth faster than most investments can build it. Indian credit cards charge 24-42% annualised interest on unpaid balances, while personal loans range from 10-24%. Strategy: (1) List all debts by interest rate, (2) Pay minimum on all, throw extra cash at highest rate first (Avalanche method), (3) Once highest is paid off, roll that payment into the next, (4) Consider balance transfer to a lower-rate card if available, (5) Once all high-interest debt is cleared, redirect the entire amount to SIPs and emergency fund. Never invest in equity while carrying credit card debt — guaranteed 30%+ return from paying it off beats any market return.",
            "category": "credit",
            "tags": ["debt", "repayment", "credit card", "avalanche method", "interest"],
            "region": "India",
            "source_url": "https://www.rbi.org.in/",
            "source_name": "RBI Financial Education",
            "published_at": "2024-01-15",
            "effective_from": "2024-01-15",
            "last_updated": now,
            "version": 1,
        },
        # ─── Savings / Emergency Fund ──────────────────
        {
            "title": "Emergency Fund – 6 Months of Expenses",
            "summary": "Maintain 6 months of essential expenses in a liquid savings/sweep account before investing in volatile assets.",
            "body": "An emergency fund is the foundation of sound financial planning. It protects against job loss, medical emergencies, car repairs, or unexpected expenses without forcing you to break long-term investments or take debt. The recommended size is 6 months of essential monthly expenses (rent, EMIs, groceries, insurance premiums, utilities). Where to park: (1) High-interest savings account with sweep facility, (2) Liquid mutual fund (redeemable in T+1 day), (3) Short-duration FD (avoid lock-in). Do NOT keep emergency money in equity, gold, or real estate. Build this fund first — before starting SIPs or making large purchases.",
            "category": "savings",
            "tags": ["emergency fund", "liquid fund", "savings", "sweep account", "6 months"],
            "region": "India",
            "source_url": "https://www.rbi.org.in/financialeducation/",
            "source_name": "RBI Financial Literacy",
            "published_at": "2024-01-01",
            "effective_from": "2024-01-01",
            "last_updated": now,
            "version": 1,
        },
        {
            "title": "Sovereign Gold Bonds – Tax-Efficient Gold Exposure",
            "summary": "SGBs issued by RBI offer gold returns + 2.5% annual interest, with no capital gains tax if held to maturity (8 years).",
            "body": "Sovereign Gold Bonds (SGBs) are government securities denominated in grams of gold, issued by RBI on behalf of the Government of India. Benefits: (1) You earn 2.5% per annum interest on the issue price (paid semi-annually), (2) Capital gains on redemption at maturity (8 years) are completely tax-exempt, (3) No storage/making charges like physical gold, (4) Can be traded on stock exchanges for liquidity, (5) Can be used as collateral for loans. SGBs are ideal for the gold allocation (5-10%) in your portfolio. They are issued in tranches; you can also buy from the secondary market on NSE/BSE.",
            "category": "investing",
            "tags": ["SGB", "gold", "sovereign", "RBI", "tax-free", "interest"],
            "region": "India",
            "source_url": "https://www.rbi.org.in/Scripts/FAQView.aspx?Id=109",
            "source_name": "Reserve Bank of India",
            "published_at": "2024-10-01",
            "effective_from": "2024-10-01",
            "last_updated": now,
            "version": 1,
        },
        {
            "title": "Home Loan Tax Benefits – 80C and Section 24",
            "summary": "Home loan principal repayments qualify under 80C (₹1.5L) and interest up to ₹2L is deductible under Section 24(b).",
            "body": "Home loan borrowers enjoy dual tax benefits under the old regime: (1) Principal repayment up to ₹1.5 lakh per year deductible under Section 80C (shared limit with PPF, ELSS, etc.), (2) Interest paid up to ₹2 lakh per year on a self-occupied property is deductible under Section 24(b). For let-out properties, the entire interest is deductible with no upper limit. Additional deduction of ₹1.5 lakh under Section 80EEA was available for affordable housing (expired for new loans post-2022). These benefits significantly reduce the effective cost of a home loan. Pre-payment of home loans should be balanced against the tax benefit being lost vs. interest saved.",
            "category": "tax",
            "tags": ["home loan", "80C", "section 24", "interest deduction", "principal"],
            "region": "India",
            "source_url": "https://incometaxindia.gov.in/",
            "source_name": "Income Tax Department of India",
            "published_at": "2024-04-01",
            "effective_from": "2024-04-01",
            "last_updated": now,
            "version": 1,
        },
    ]

    coll.insert_many(policies)
    coll.create_index([("category", 1)])
    coll.create_index([("tags", 1)])
    coll.create_index([("title", "text"), ("summary", "text"), ("body", "text")])


def seed_news(db: Database) -> None:
    """Insert sample news items if the collection is empty."""
    coll = db["news"]
    if coll.count_documents({}) == 0:
        coll.insert_many(
            [
                {
                    "title": "RBI holds repo rate steady at 6.5 %",
                    "summary": "The Reserve Bank of India maintained the repo rate, signalling stable monetary policy.",
                    "url": "https://example.com/rbi-rate",
                    "category": "macro",
                },
                {
                    "title": "Equity markets hit all-time high",
                    "summary": "Benchmark indices surged 2 % on strong FII inflows.",
                    "url": "https://example.com/markets-high",
                    "category": "markets",
                },
            ]
        )
