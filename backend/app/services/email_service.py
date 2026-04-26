from __future__ import annotations

import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_email_verification_email(*, to_email: str, verification_token: str) -> None:
    if not settings.email_enabled:
        return

    verification_url = (
        f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    )

    subject = "Confirmă adresa de email"

    html_content = f"""
    <html>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
                <tr>
                  <td align="center">
                    <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;">
                      Confirmă adresa de email
                    </h1>

                    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">
                      Contul tău a fost creat. Pentru a continua procesul, apasă pe butonul de mai jos și confirmă adresa de email.
                    </p>

                    <a
                      href="{verification_url}"
                      style="display:inline-block;padding:14px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;"
                    >
                      Confirmă emailul
                    </a>

                    <p style="margin:28px 0 8px;font-size:14px;line-height:1.6;color:#6b7280;">
                      Dacă butonul nu funcționează, copiază și deschide acest link:
                    </p>

                    <p style="margin:0 0 24px;font-size:13px;line-height:1.7;color:#2563eb;word-break:break-all;">
                      {verification_url}
                    </p>

                    <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">
                      Dacă nu ai făcut tu această cerere, poți ignora acest email.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
                {settings.SMTP_FROM_NAME}
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = (
        f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        if settings.SMTP_FROM_EMAIL
        else settings.SMTP_FROM_NAME
    )
    message["To"] = to_email
    message.set_content(
        f"Confirmă emailul accesând linkul: {verification_url}"
    )
    message.add_alternative(html_content, subtype="html")

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()

        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

        server.send_message(message)

def send_password_reset_email(*, to_email: str, reset_token: str) -> None:
    if not settings.email_enabled:
        return

    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={reset_token}"

    subject = "Resetare parolă"

    html_content = f"""
    <html>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
                <tr>
                  <td align="center">
                    <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;">
                      Resetare parolă
                    </h1>

                    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;">
                      Ai solicitat resetarea parolei. Apasă pe butonul de mai jos pentru a seta o parolă nouă.
                    </p>

                    <a
                      href="{reset_url}"
                      style="display:inline-block;padding:14px 24px;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;"
                    >
                      Resetează parola
                    </a>

                    <p style="margin:28px 0 8px;font-size:14px;line-height:1.6;color:#6b7280;">
                      Dacă butonul nu funcționează, copiază și deschide acest link:
                    </p>

                    <p style="margin:0 0 24px;font-size:13px;line-height:1.7;color:#2563eb;word-break:break-all;">
                      {reset_url}
                    </p>

                    <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">
                      Dacă nu ai cerut resetarea parolei, poți ignora acest email.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
                {settings.SMTP_FROM_NAME}
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = (
        f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        if settings.SMTP_FROM_EMAIL
        else settings.SMTP_FROM_NAME
    )
    message["To"] = to_email
    message.set_content(f"Resetează parola accesând linkul: {reset_url}")
    message.add_alternative(html_content, subtype="html")

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()

        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

        server.send_message(message)