from groq import Groq
from config import settings

_client: Groq | None = None
_runtime_enabled: bool = settings.GROQ_ENABLED_DEFAULT


def is_enabled() -> bool:
    return _runtime_enabled


def set_enabled(value: bool) -> None:
    global _runtime_enabled
    _runtime_enabled = value


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def generate_recommendation(query: str, sermons: list[dict]) -> str:
    """sermons: list of {title, categories, description, link}."""
    if not is_enabled() or not settings.GROQ_API_KEY:
        return _template_response(sermons)

    context = "\n\n".join(
        f"Title: {s['title']}\nCategories: {', '.join(s['categories'])}\n"
        f"Description: {s['description']}"
        for s in sermons
    )

    system_prompt = (
        "You are a helpful assistant for a church's sermon catalogue. "
        "You are given a user's question and a list of sermons retrieved "
        "as likely matches. Recommend the most relevant sermon(s) from "
        "ONLY the list provided — never invent a sermon, title, or link "
        "that isn't in the list. Be warm and concise. If none of the "
        "sermons genuinely seem relevant, say so honestly rather than "
        "forcing a recommendation."
    )
    user_prompt = f"User question: {query}\n\nRetrieved sermons:\n{context}"

    try:
        client = _get_client()
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=300,
        )
        return completion.choices[0].message.content.strip()
    except Exception:
        return _template_response(sermons)


def _template_response(sermons: list[dict]) -> str:
    if not sermons:
        return "I couldn't find a sermon that matches — try rephrasing your question."
    lines = ["Here's what I found that might help:"]
    for s in sermons[:5]:  # Limit to top 5 results
        # List only the title and categories to avoid overwhelming the user with too much text
        lines.append(f"- \"{s['title']}\" ({', '.join(s['categories'])})")
    return "\n".join(lines)
