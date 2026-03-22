"""News routes — NewsData.io free plan.

Free plan supported parameters:
  - q           : keyword search (AND/OR/NOT, max 100 chars)
  - country     : up to 5 ISO country codes
  - category    : one or more categories
  - domainurl   : up to 5 domain whitelists
  - language    : language code
  - size        : results per page, 1–10
  - page        : pagination token (nextPage from previous response)

NOT supported on free plan (excluded):
  - timeframe, from_date, to_date  → require paid plan
  - size > 10                      → paid plan allows up to 50
  - full content, ai_tag, sentiment, ai_region → paid plan only
"""

from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.models.news import NewsFetchRequest, NewsFetchResponse

router = APIRouter(prefix="/v1/news", tags=["news"])


def _fetch_newsdata(
    q: str | None,
    country: str | None,
    category: str | None,
    domain: str | None,
    language: str,
    size: int,
    page: str | None,
) -> NewsFetchResponse:
    if not settings.NEWSDATA_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="NEWSDATA_API_KEY is not configured",
        )

    # --- resolve country ---
    # Strip "global" — no country param = worldwide on NewsData.
    effective_country: str | None = None
    raw_country = country or settings.NEWSDATA_DEFAULT_COUNTRIES
    if raw_country:
        tokens = [t.strip().lower() for t in raw_country.split(",") if t.strip()]
        filtered = [t for t in tokens if t != "global"]
        effective_country = ",".join(filtered[:5]) if filtered else None  # cap at 5

    # --- resolve domain whitelist ---
    # Free plan: up to 5 domains.
    effective_domain: str | None = None
    raw_domain = domain or settings.NEWSDATA_DEFAULT_DOMAINS
    if raw_domain:
        tokens = [t.strip().lower() for t in raw_domain.split(",") if t.strip()]
        effective_domain = ",".join(tokens[:5])

    # --- resolve category ---
    effective_category: str | None = category or settings.NEWSDATA_DEFAULT_CATEGORY or None

    # --- enforce free plan size cap ---
    effective_size = min(size, 10)

    # --- build params ---
    params: dict[str, str] = {
        "apikey": settings.NEWSDATA_API_KEY,
        "language": language,
        "size": str(effective_size),
    }

    if q:
        params["q"] = q
    if effective_country:
        params["country"] = effective_country
    if effective_category:
        params["category"] = effective_category
    if effective_domain:
        params["domainurl"] = effective_domain
    if page:
        params["page"] = page

    url = f"{settings.NEWSDATA_API_BASE_URL}?{urlencode(params)}"

    try:
        with urlopen(url, timeout=15) as response:
            status_code = response.getcode()
            body = response.read().decode("utf-8")
            payload = json.loads(body)
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="ignore") if exc.fp else str(exc)

        error_message = raw
        error_code = ""
        try:
            err_payload = json.loads(raw)
            # NewsData error shape: {"status": "error", "results": {"message": "...", "code": "..."}}
            results = err_payload.get("results", {})
            error_message = results.get("message") or raw
            error_code = results.get("code", "")
        except json.JSONDecodeError:
            pass

        if error_code == "ApiKeyInvalid" or exc.code == 401:
            raise HTTPException(
                status_code=401,
                detail=f"NewsData.io API key is invalid or inactive. Upstream: {error_message}",
            )
        if error_code == "RateLimitExceeded" or exc.code == 429:
            raise HTTPException(
                status_code=429,
                detail=(
                    "NewsData.io rate limit exceeded. "
                    "Free plan: 200 credits/day, 30 credits per 15 minutes. "
                    f"Upstream: {error_message}"
                ),
            )
        if error_code == "DomainNotFound":
            raise HTTPException(
                status_code=400,
                detail=(
                    "One or more domains not recognised by NewsData.io. "
                    f"Check spelling. Upstream: {error_message}"
                ),
            )
        if error_code == "ParameterNotAllowed":
            raise HTTPException(
                status_code=400,
                detail=(
                    f"A parameter is not allowed on the free plan. Upstream: {error_message}"
                ),
            )

        raise HTTPException(
            status_code=exc.code,
            detail=f"NewsData.io HTTP error {exc.code}: {error_message}",
        )
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"NewsData.io connection error: {exc}")
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid JSON from NewsData.io: {exc}")

    # NewsData sometimes returns status="error" with HTTP 200
    if payload.get("status") == "error":
        results = payload.get("results", {})
        error_message = results.get("message") or "Unknown error from NewsData.io"
        raise HTTPException(status_code=400, detail=f"NewsData.io error: {error_message}")

    return NewsFetchResponse(
        source="newsdata.io",
        request={
            "q": params.get("q"),
            "country": params.get("country"),
            "category": params.get("category"),
            "domainurl": params.get("domainurl"),
            "language": params.get("language"),
            "size": params.get("size"),
            "page": params.get("page"),
        },
        status_code=status_code,
        upstream=payload,
    )


@router.post("", response_model=NewsFetchResponse)
def fetch_news(body: NewsFetchRequest):
    return _fetch_newsdata(
        q=body.q,
        country=body.country,
        category=body.category,
        domain=body.domain,
        language=body.language,
        size=body.size,
        page=body.page,
    )