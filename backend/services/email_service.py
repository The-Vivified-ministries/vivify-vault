import smtplib
from email.message import EmailMessage
from config import settings


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

    with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
        smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        smtp.send_message(message)
