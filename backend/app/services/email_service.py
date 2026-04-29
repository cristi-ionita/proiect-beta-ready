from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from html import escape

from app.core.config import settings

logger = logging.getLogger("app")

SMTP_TIMEOUT_SECONDS = 10


def _build_sender() -> str:
    if settings.SMTP_FROM_EMAIL:
        return f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"

    return settings.SMTP_FROM_NAME


def _send_email(
    *,
    to_email: str,
    subject: str,
    text_content: str,
    html_content: str,
) -> None:
    if not settings.email_enabled:
        logger.info("Email skipped because SMTP is not configured.")
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = _build_sender()
    message["To"] = to_email
    message.set_content(text_content)
    message.add_alternative(html_content, subtype="html")

    try:
        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=SMTP_TIMEOUT_SECONDS,
        ) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()

            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

            server.send_message(message)
    except Exception:
        logger.exception("Failed to send email to %s", to_email)
        raise


def _build_email_template(
    *,
    title: str,
    description: str,
    button_label: str,
    url: str,
    footer_note: str,
    button_color: str = "#2563eb",
) -> str:
    safe_title = escape(title)
    safe_description = escape(description)
    safe_button_label = escape(button_label)
    safe_url = escape(url, quote=True)
    safe_footer_note = escape(footer_note)
    safe_from_name = escape(settings.SMTP_FROM_NAME)

    return f"""
    <html>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
                <tr>
                  <td align="center">
                    <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;">
                      {safe_title}
                    </h1>

                    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">
                      {safe_description}
                    </p>

                    <a
                      href="{safe_url}"
                      style="display:inline-block;padding:14px 24px;background:{button_color};color:#ffffff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;"
                    >
                      {safe_button_label}
                    </a>

                    <p style="margin:28px 0 8px;font-size:14px;line-height:1.6;color:#6b7280;">
                      Dacă butonul nu funcționează, copiază și deschide acest link:
                    </p>

                    <p style="margin:0 0 24px;font-size:13px;line-height:1.7;color:#2563eb;word-break:break-all;">
                      {safe_url}
                    </p>

                    <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">
                      {safe_footer_note}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
                {safe_from_name}
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """


def send_email_verification_email(*, to_email: str, verification_token: str) -> None:
    verification_url = (
        f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    )

    subject = "Confirmă adresa de email"
    text_content = f"Confirmă emailul accesând linkul: {verification_url}"
    html_content = _build_email_template(
        title="Confirmă adresa de email",
        description=(
            "Contul tău a fost creat. Pentru a continua procesul, "
            "apasă pe butonul de mai jos și confirmă adresa de email."
        ),
        button_label="Confirmă emailul",
        url=verification_url,
        footer_note="Dacă nu ai făcut tu această cerere, poți ignora acest email.",
        button_color="#2563eb",
    )

    _send_email(
        to_email=to_email,
        subject=subject,
        text_content=text_content,
        html_content=html_content,
    )


def send_password_reset_email(*, to_email: str, reset_token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={reset_token}"

    subject = "Resetare parolă"
    text_content = f"Resetează parola accesând linkul: {reset_url}"
    html_content = _build_email_template(
        title="Resetare parolă",
        description=(
            "Ai solicitat resetarea parolei. Apasă pe butonul de mai jos "
            "pentru a seta o parolă nouă."
        ),
        button_label="Resetează parola",
        url=reset_url,
        footer_note="Dacă nu ai cerut resetarea parolei, poți ignora acest email.",
        button_color="#111827",
    )

    _send_email(
        to_email=to_email,
        subject=subject,
        text_content=text_content,
        html_content=html_content,
    )