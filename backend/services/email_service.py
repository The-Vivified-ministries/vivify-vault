import logging

import requests

from config import settings

logger = logging.getLogger(__name__)


def send_admin_notification(user_name: str, action: str, sermon: dict) -> None:
    if not settings.SUPABASE_OWNER_EMAIL:
        return

    body_lines = [
        f"User: {user_name}",
        f"Action: {action}",
        "",
        "Sermon details:",
        f"Title: {sermon.get('title', '')}",
        f"Year: {sermon.get('year', '')}",
        f"Categories: {', '.join(sermon.get('categories', []))}",
        f"Subcategories: {', '.join(sermon.get('subcategories', []))}",
        f"Description: {sermon.get('description', '')}",
        f"Spotify link: {sermon.get('spotify_link', '')}",
        f"Apple Music link: {sermon.get('apple_music_link', '')}",
    ]
    subject = f"Sermon {action} by {user_name}"
    body = "\n".join(body_lines)

    if not settings.RESEND_API_KEY or not settings.RESEND_FROM_EMAIL:
        return

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.RESEND_FROM_EMAIL,
                "to": [settings.SUPABASE_OWNER_EMAIL],
                "subject": subject,
                "text": body,
            },
            timeout=15,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.warning("Could not send admin notification email for %s: %s", action, exc)
