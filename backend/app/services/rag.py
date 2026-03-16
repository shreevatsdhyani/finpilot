"""RAG assistant stub — returns fixed sources from seeded policy corpus."""

from __future__ import annotations

from pymongo.database import Database


def answer_query(db: Database, query: str) -> tuple[str, list[dict]]:
    """Return a stubbed answer with citations from the policies collection.

    In production this would embed the query, retrieve top-k chunks via vector
    search, and pass them to an LLM.
    """
    # Simple keyword matching against seeded policies
    policies = list(db["policies"].find({}, {"_id": 0, "title": 1, "body": 1}))
    matched: list[dict] = []
    q_lower = query.lower()
    for p in policies:
        if any(word in q_lower for word in p["title"].lower().split()):
            matched.append({"title": p["title"], "snippet": p["body"]})
    if not matched and policies:
        # Return first two policies as fallback context
        matched = [{"title": p["title"], "snippet": p["body"]} for p in policies[:2]]

    answer = (
        f"Based on your financial policies, here is guidance regarding '{query}': "
        "You should maintain an emergency fund covering 6 months of expenses, "
        "prioritise high-interest debt repayment, and diversify across at least "
        "three asset classes. Please review the cited sources for details."
    )
    return answer, matched
