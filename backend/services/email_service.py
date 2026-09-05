import smtplib
import logging
from email.message import EmailMessage
from config import settings

logger = logging.getLogger(__name__)


def send_admin_notification(user_name: str, action: str, sermon: dict) -> None:
    if not settings.SUPABASE_OWNER_EMAIL:
        return
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return

    message = EmailMessage()
    message["Subject"] = f"Sermon {action} by {user_name}"
    message["From"] = settings.SMTP_USER
    message["To"] = settings.SUPABASE_OWNER_EMAIL
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
    message.set_content("\n".join(body_lines))

    try:
        smtp_class = smtplib.SMTP_SSL if settings.SMTP_PORT == 465 else smtplib.SMTP
        with smtp_class(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            if settings.SMTP_PORT != 465:
                smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        logger.warning(
            "Could not send admin notification email for %s: %s",
            action,
            exc,
        )
