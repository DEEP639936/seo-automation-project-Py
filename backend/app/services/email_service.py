"""Email Service - SMTP email delivery using aiosmtplib."""
import os
from email.message import EmailMessage
from typing import Optional
from app.config import settings
from app.utils.logger import logger


async def send_email(to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
    """Send an email via SMTP."""
    if not all([settings.smtp_host, settings.smtp_user, settings.smtp_pass]):
        logger.warning("SMTP not configured. Email not sent.")
        return False

    try:
        import aiosmtplib
    except ImportError:
        logger.warning("aiosmtplib not installed. Email not sent.")
        return False

    message = EmailMessage()
    message["From"] = f"{settings.email_from} <{settings.smtp_user}>"
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)
    if html_body:
        message.add_alternative(html_body, subtype="html")

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            start_tls=True,
            username=settings.smtp_user,
            password=settings.smtp_pass,
        )
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


async def send_welcome_email(email: str, first_name: Optional[str] = None) -> bool:
    """Send a welcome email to a new user."""
    name = first_name or "there"
    subject = "Welcome to SEO Automation!"
    body = f"""Hi {name},

Welcome to SEO Automation System! Your account has been created successfully.

Get started by:
1. Adding your first website
2. Running an SEO audit
3. Tracking your keywords

If you have any questions, feel free to reach out.

Best regards,
SEO Automation Team"""
    return await send_email(email, subject, body)


async def send_report_email(to_email: str, report_data: dict, file_path: Optional[str] = None) -> bool:
    """Send a report email with optional attachment."""
    subject = f"SEO Report: {report_data.get('title', 'Update')}"
    body = f"""Hi,

Your scheduled SEO report is ready.

Report: {report_data.get('title', 'SEO Report')}
SEO Score: {report_data.get('seo_score', 'N/A')}
Issues Found: {report_data.get('issues_found', 'N/A')}
Keywords Tracked: {report_data.get('keywords_tracked', 'N/A')}

View the full report in your dashboard.

Best regards,
SEO Automation Team"""
    return await send_email(to_email, subject, body)
