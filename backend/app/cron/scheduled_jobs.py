"""Scheduled Jobs - APScheduler-based automation."""
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Website, Audit, Report, User, Keyword
from app.services.crawler_service import crawl_website
from app.services.seo_api_service import get_rankings
from app.services.email_service import send_report_email
from app.services.pdf_service import generate_pdf
from app.utils.logger import logger
from app.config import settings
import asyncio

scheduler = AsyncIOScheduler()
ENABLE_CRON = settings.enable_cron_jobs

if not ENABLE_CRON:
    logger.info("Cron jobs are disabled. Set ENABLE_CRON_JOBS=true to enable.")


async def run_scheduled_crawl(website: Website):
    """Run a scheduled crawl for a website."""
    db = SessionLocal()
    try:
        audit = Audit(website_id=website.id, status="running")
        db.add(audit)
        db.commit()
        db.refresh(audit)

        crawl_data = await crawl_website(website.url)

        audit.status = "completed"
        audit.pages_crawled = crawl_data.get("pages_crawled", 0)
        audit.total_pages = crawl_data.get("total_pages", 0)
        audit.seo_score = crawl_data.get("seo_score", 0)
        audit.issues_found = crawl_data.get("issues", {}).get("critical", 0) + crawl_data.get("issues", {}).get("warnings", 0)
        audit.critical_issues = crawl_data.get("issues", {}).get("critical", 0)
        audit.warnings = crawl_data.get("issues", {}).get("warnings", 0)
        audit.passed_checks = crawl_data.get("issues", {}).get("passed", 0)
        audit.page_results = crawl_data.get("pages", [])
        audit.summary = crawl_data.get("summary", {})
        audit.completed_at = datetime.utcnow()
        db.commit()

        website.seo_score = crawl_data.get("seo_score", 0)
        website.last_crawled_at = datetime.utcnow()
        db.commit()

        logger.info(f"Scheduled crawl completed for {website.url}")
    except Exception as e:
        logger.error(f"Scheduled crawl failed for {website.url}: {e}")
        if audit:
            audit.status = "failed"
            audit.summary = {"error": str(e)}
            db.commit()
    finally:
        db.close()


async def scheduled_crawl_job():
    """Daily website crawl job - runs at 2 AM."""
    if not ENABLE_CRON:
        return
    logger.info("Running scheduled daily crawls...")
    db = SessionLocal()
    try:
        websites = db.query(Website).filter(Website.status == "active").all()
        for website in websites:
            if website.settings and website.settings.get("crawl_frequency") == "daily":
                await run_scheduled_crawl(website)
    except Exception as e:
        logger.error(f"Scheduled crawl job error: {e}")
    finally:
        db.close()


async def scheduled_ranking_update():
    """Daily ranking update - runs at 3 AM."""
    if not ENABLE_CRON:
        return
    logger.info("Running scheduled ranking updates...")
    db = SessionLocal()
    try:
        websites = db.query(Website).filter(Website.status == "active").all()
        for website in websites:
            keywords = db.query(Keyword).filter(Keyword.website_id == website.id).all()
            if not keywords:
                continue

            keyword_list = [k.keyword for k in keywords]
            from urllib.parse import urlparse
            domain = urlparse(website.url).hostname
            result = await get_rankings(domain, keyword_list)

            for ranking in result.get("data", []):
                keyword = next((k for k in keywords if k.keyword == ranking["keyword"]), None)
                if keyword:
                    history = keyword.history or []
                    history.append({"position": ranking["position"], "date": datetime.utcnow().isoformat()})
                    if len(history) > 30:
                        history.pop(0)

                    keyword.current_position = ranking["position"]
                    keyword.previous_position = keyword.current_position or ranking.get("previous_position")
                    keyword.position_change = (keyword.current_position or 0) - ranking["position"]
                    keyword.url_ranked = ranking.get("url", "")
                    keyword.last_checked = datetime.utcnow()
                    keyword.history = history

            db.commit()
            logger.info(f"Ranking update completed for {website.url}")
    except Exception as e:
        logger.error(f"Scheduled ranking job error: {e}")
    finally:
        db.close()


async def scheduled_report_generation():
    """Weekly report generation - runs every Monday at 8 AM."""
    if not ENABLE_CRON:
        return
    logger.info("Running scheduled weekly reports...")
    db = SessionLocal()
    try:
        reports = db.query(Report).filter(
            Report.scheduled == True,
            Report.frequency == "weekly",
            Report.status == "completed",
        ).all()

        for report in reports:
            try:
                website = db.query(Website).filter(Website.id == report.website_id).first()
                if not website:
                    continue

                new_report = Report(
                    website_id=report.website_id,
                    user_id=report.user_id,
                    type=report.type,
                    title=f"{report.title} - Weekly Update",
                    frequency="weekly",
                    scheduled=True,
                    status="generating",
                )
                db.add(new_report)
                db.commit()
                db.refresh(new_report)

                # Build report data
                report_data = {
                    "title": new_report.title,
                    "website_name": website.name,
                    "website_url": website.url,
                    "type": report.type.value if report.type else "full_seo",
                    "generated_at": datetime.utcnow().isoformat(),
                }

                latest_audit = db.query(Audit).filter(Audit.website_id == website.id).order_by(Audit.created_at.desc()).first()
                if latest_audit:
                    report_data["seo_score"] = latest_audit.seo_score
                    report_data["pages_crawled"] = latest_audit.pages_crawled
                    report_data["critical_issues"] = latest_audit.critical_issues
                    report_data["warnings"] = latest_audit.warnings

                pdf_result = await generate_pdf(report_data, report.type.value if report.type else "full_seo")

                if pdf_result.get("success"):
                    new_report.status = "completed"
                    new_report.file_path = pdf_result.get("filePath")
                    new_report.file_size = pdf_result.get("fileSize")
                    new_report.content = report_data
                    db.commit()

                    user = db.query(User).filter(User.id == report.user_id).first()
                    if user and website.settings and website.settings.get("email_notifications"):
                        await send_report_email(user.email, report_data, pdf_result.get("filePath"))
                        new_report.sent_at = datetime.utcnow()
                        db.commit()

                    logger.info(f"Weekly report generated for {website.name}")
                else:
                    raise Exception(pdf_result.get("error", "PDF generation failed"))
            except Exception as e:
                logger.error(f"Weekly report failed: {e}")
    except Exception as e:
        logger.error(f"Scheduled report job error: {e}")
    finally:
        db.close()


def start_scheduler():
    """Start all scheduled jobs."""
    if not ENABLE_CRON:
        return

    # Daily crawl at 2:00 AM
    scheduler.add_job(
        scheduled_crawl_job,
        trigger=CronTrigger(hour=2, minute=0),
        id="daily_crawl",
        replace_existing=True,
    )

    # Daily ranking update at 3:00 AM
    scheduler.add_job(
        scheduled_ranking_update,
        trigger=CronTrigger(hour=3, minute=0),
        id="daily_ranking",
        replace_existing=True,
    )

    # Weekly report on Monday at 8:00 AM
    scheduler.add_job(
        scheduled_report_generation,
        trigger=CronTrigger(day_of_week="mon", hour=8, minute=0),
        id="weekly_report",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Scheduler started with cron jobs")


def shutdown_scheduler():
    """Shutdown the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shut down")
