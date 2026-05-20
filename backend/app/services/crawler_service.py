"""SEO Crawler Service - Playwright-based Website Auditor.
Crawls websites, analyzes on-page SEO, detects issues.
Includes mock fallback for demo/development.
"""
import asyncio
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Any
from app.config import settings
from app.utils.logger import logger

USE_MOCK = settings.use_mock_data
MAX_PAGES = settings.crawl_max_pages


async def crawl_website(website_url: str, max_pages: int = MAX_PAGES) -> Dict[str, Any]:
    """Main crawl function - crawl a website and return SEO audit data."""
    if USE_MOCK:
        logger.info(f"Using mock crawler for {website_url}")
        return generate_mock_crawl_data(website_url)

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.warning("Playwright not installed. Falling back to mock data.")
        return generate_mock_crawl_data(website_url)

    results = {
        "url": website_url,
        "pages_crawled": 0,
        "total_pages": 0,
        "pages": [],
        "issues": {"critical": 0, "warnings": 0, "passed": 0},
        "summary": {
            "missing_titles": 0,
            "missing_meta_descriptions": 0,
            "missing_h1": 0,
            "missing_alt_text": 0,
            "broken_links": 0,
            "slow_pages": 0,
            "missing_canonical": 0,
            "noindex_pages": 0,
        },
        "seo_score": 0,
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            base_url = urlparse(website_url)
            visited = set()
            to_visit = [website_url]

            while to_visit and results["pages_crawled"] < max_pages:
                current_url = to_visit.pop(0)
                if current_url in visited:
                    continue
                visited.add(current_url)

                try:
                    page_data = await analyze_page(browser, current_url, base_url)
                    results["pages"].append(page_data)
                    results["pages_crawled"] += 1

                    # Update summary counts
                    if not page_data.get("title"):
                        results["summary"]["missing_titles"] += 1
                    if not page_data.get("meta_description"):
                        results["summary"]["missing_meta_descriptions"] += 1
                    if not page_data.get("h1"):
                        results["summary"]["missing_h1"] += 1
                    if page_data.get("missing_alt_text", 0) > 0:
                        results["summary"]["missing_alt_text"] += page_data["missing_alt_text"]
                    if page_data.get("broken_links", 0) > 0:
                        results["summary"]["broken_links"] += page_data["broken_links"]
                    if page_data.get("load_time", 0) > 3000:
                        results["summary"]["slow_pages"] += 1
                    if not page_data.get("canonical"):
                        results["summary"]["missing_canonical"] += 1
                    if page_data.get("is_noindex"):
                        results["summary"]["noindex_pages"] += 1

                    # Add internal links to queue
                    for link in page_data.get("internal_links", []):
                        if link not in visited and len(to_visit) < max_pages:
                            to_visit.append(link)

                except Exception as e:
                    logger.error(f"Error crawling {current_url}: {e}")
                    results["pages"].append({
                        "url": current_url,
                        "error": str(e),
                        "status": "error",
                        "issues": [],
                    })

            results["total_pages"] = len(visited)
            results["issues"]["critical"] = (
                results["summary"]["missing_titles"] + results["summary"]["broken_links"]
            )
            results["issues"]["warnings"] = (
                results["summary"]["missing_meta_descriptions"]
                + results["summary"]["missing_alt_text"]
                + results["summary"]["slow_pages"]
            )
            results["issues"]["passed"] = max(
                0, results["pages_crawled"] * 5 - results["issues"]["critical"] - results["issues"]["warnings"]
            )

            # Calculate SEO score (0-100)
            total_checks = results["pages_crawled"] * 5
            passed_checks = max(0, results["issues"]["passed"])
            results["seo_score"] = (
                round((passed_checks / total_checks) * 100) if total_checks > 0 else 0
            )
        finally:
            await browser.close()

    return results


async def analyze_page(browser, url: str, base_url) -> Dict[str, Any]:
    """Analyze a single page with Playwright."""
    page = await browser.new_page()
    try:
        start_time = asyncio.get_event_loop().time()
        response = await page.goto(url, wait_until="networkidle", timeout=30000)
        load_time = int((asyncio.get_event_loop().time() - start_time) * 1000)

        page_data = await page.evaluate("""
            () => {
                const title = document.title || '';
                const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
                const h1 = document.querySelector('h1')?.textContent?.trim() || '';
                const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
                const robots = document.querySelector('meta[name="robots"]')?.content || '';
                const lang = document.documentElement.lang || '';

                const images = Array.from(document.querySelectorAll('img'));
                const missingAltText = images.filter(img => !img.alt).length;
                const totalImages = images.length;

                const headings = {
                    h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
                    h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()),
                    h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim()),
                };

                const links = Array.from(document.querySelectorAll('a[href]'));
                const internalLinks = [];
                const externalLinks = [];
                const origin = window.location.origin;

                links.forEach(link => {
                    const href = link.href;
                    if (href.startsWith(origin)) {
                        internalLinks.push(href);
                    } else if (href.startsWith('http')) {
                        externalLinks.push(href);
                    }
                });

                const wordCount = document.body.innerText.split(/[ \t\n\r]+/).length;
                const hasSchema = document.querySelectorAll('script[type="application/ld+json"]').length > 0;
                const hasOpenGraph = document.querySelector('meta[property="og:title"]') !== null;

                return {
                    title, metaDescription: metaDesc, h1, canonical, robots, lang,
                    missingAltText, totalImages, headings, internalLinks, externalLinks,
                    wordCount, hasSchema, hasOpenGraph
                };
            }
        """)

        # Check for broken links (sample a few)
        broken_links = 0
        links_to_check = page_data.get("internal_links", [])[:10]
        for link in links_to_check:
            try:
                link_page = await browser.new_page()
                link_response = await link_page.goto(link, timeout=10000)
                if not link_response or link_response.status >= 400:
                    broken_links += 1
                await link_page.close()
            except Exception:
                broken_links += 1

        page_data["url"] = url
        page_data["status"] = response.status if response else 0
        page_data["load_time"] = load_time
        page_data["broken_links"] = broken_links
        page_data["is_noindex"] = "noindex" in (page_data.get("robots") or "")
        page_data["issues"] = generate_page_issues(page_data)

        return page_data
    finally:
        await page.close()


def generate_page_issues(page_data: Dict[str, Any]) -> List[Dict[str, str]]:
    """Generate issue list for a page."""
    issues = []
    title = page_data.get("title", "")
    meta_desc = page_data.get("meta_description", "")
    h1 = page_data.get("h1", "")
    load_time = page_data.get("load_time", 0)
    broken_links = page_data.get("broken_links", 0)
    missing_alt = page_data.get("missing_alt_text", 0)
    canonical = page_data.get("canonical", "")
    has_schema = page_data.get("has_schema", False)
    word_count = page_data.get("word_count", 0)

    if not title:
        issues.append({"type": "critical", "category": "title", "message": "Missing title tag"})
    elif len(title) < 30 or len(title) > 60:
        issues.append({
            "type": "warning",
            "category": "title",
            "message": f"Title length ({len(title)}) outside optimal range (30-60 chars)",
        })

    if not meta_desc:
        issues.append({"type": "warning", "category": "meta", "message": "Missing meta description"})
    elif len(meta_desc) < 120 or len(meta_desc) > 160:
        issues.append({
            "type": "warning",
            "category": "meta",
            "message": f"Meta description length ({len(meta_desc)}) outside optimal range (120-160 chars)",
        })

    if not h1:
        issues.append({"type": "critical", "category": "headings", "message": "Missing H1 tag"})

    if missing_alt > 0:
        issues.append({
            "type": "warning",
            "category": "images",
            "message": f"{missing_alt} images missing alt text",
        })

    if load_time > 3000:
        issues.append({
            "type": "warning",
            "category": "performance",
            "message": f"Slow load time ({load_time}ms)",
        })

    if broken_links > 0:
        issues.append({
            "type": "critical",
            "category": "links",
            "message": f"{broken_links} broken links found",
        })

    if not canonical:
        issues.append({"type": "warning", "category": "canonical", "message": "Missing canonical tag"})

    if not has_schema:
        issues.append({
            "type": "warning",
            "category": "structured_data",
            "message": "No structured data (Schema.org) found",
        })

    if word_count < 300:
        issues.append({
            "type": "warning",
            "category": "content",
            "message": f"Low word count ({word_count} words)",
        })

    return issues


def generate_mock_crawl_data(website_url: str) -> Dict[str, Any]:
    """Mock crawl data generator."""
    pages = [
        {
            "url": website_url,
            "status": 200,
            "load_time": 1200,
            "title": "Homepage - Example Company",
            "meta_description": "Welcome to Example Company. We provide excellent services.",
            "h1": "Welcome to Example Company",
            "canonical": f"{website_url}/",
            "robots": "index, follow",
            "lang": "en",
            "missing_alt_text": 2,
            "total_images": 8,
            "headings": {
                "h1": ["Welcome to Example Company"],
                "h2": ["Our Services", "About Us"],
                "h3": ["Service 1", "Service 2"],
            },
            "internal_links": [f"{website_url}/about", f"{website_url}/services", f"{website_url}/contact"],
            "external_links": ["https://facebook.com", "https://twitter.com"],
            "word_count": 450,
            "has_schema": True,
            "has_open_graph": True,
            "broken_links": 0,
            "is_noindex": False,
            "issues": [
                {"type": "warning", "category": "images", "message": "2 images missing alt text"},
                {"type": "warning", "category": "content", "message": "Low word count (450 words)"},
            ],
        },
        {
            "url": f"{website_url}/about",
            "status": 200,
            "load_time": 2100,
            "title": "About Us",
            "meta_description": "",
            "h1": "About Our Company",
            "canonical": "",
            "robots": "index, follow",
            "lang": "en",
            "missing_alt_text": 5,
            "total_images": 6,
            "headings": {
                "h1": ["About Our Company"],
                "h2": ["Our Team", "History"],
                "h3": [],
            },
            "internal_links": [website_url, f"{website_url}/services"],
            "external_links": [],
            "word_count": 280,
            "has_schema": False,
            "has_open_graph": False,
            "broken_links": 1,
            "is_noindex": False,
            "issues": [
                {"type": "warning", "category": "meta", "message": "Missing meta description"},
                {"type": "warning", "category": "images", "message": "5 images missing alt text"},
                {"type": "critical", "category": "links", "message": "1 broken links found"},
                {"type": "warning", "category": "canonical", "message": "Missing canonical tag"},
                {"type": "warning", "category": "structured_data", "message": "No structured data (Schema.org) found"},
                {"type": "warning", "category": "content", "message": "Low word count (280 words)"},
            ],
        },
        {
            "url": f"{website_url}/services",
            "status": 200,
            "load_time": 1500,
            "title": "Our Services | Example Company - Best Services in the Industry and More",
            "meta_description": "We offer a wide range of services including web design, development, SEO, marketing, consulting, and much more for businesses of all sizes.",
            "h1": "",
            "canonical": f"{website_url}/services",
            "robots": "index, follow",
            "lang": "en",
            "missing_alt_text": 0,
            "total_images": 4,
            "headings": {
                "h1": [],
                "h2": ["Web Design", "Development", "SEO"],
                "h3": [],
            },
            "internal_links": [website_url, f"{website_url}/about", f"{website_url}/contact"],
            "external_links": [],
            "word_count": 620,
            "has_schema": True,
            "has_open_graph": True,
            "broken_links": 0,
            "is_noindex": False,
            "issues": [
                {"type": "warning", "category": "title", "message": "Title length (72) outside optimal range (30-60 chars)"},
                {"type": "critical", "category": "headings", "message": "Missing H1 tag"},
            ],
        },
        {
            "url": f"{website_url}/contact",
            "status": 404,
            "load_time": 800,
            "title": "404 Not Found",
            "meta_description": "",
            "h1": "Page Not Found",
            "canonical": "",
            "robots": "noindex, follow",
            "lang": "en",
            "missing_alt_text": 1,
            "total_images": 2,
            "headings": {
                "h1": ["Page Not Found"],
                "h2": [],
                "h3": [],
            },
            "internal_links": [website_url],
            "external_links": [],
            "word_count": 50,
            "has_schema": False,
            "has_open_graph": False,
            "broken_links": 0,
            "is_noindex": True,
            "issues": [
                {"type": "critical", "category": "status", "message": "Page returns 404 status"},
                {"type": "warning", "category": "meta", "message": "Missing meta description"},
                {"type": "warning", "category": "canonical", "message": "Missing canonical tag"},
            ],
        },
    ]

    summary = {
        "missing_titles": sum(1 for p in pages if not p["title"]),
        "missing_meta_descriptions": sum(1 for p in pages if not p["meta_description"]),
        "missing_h1": sum(1 for p in pages if not p["h1"]),
        "missing_alt_text": sum(p["missing_alt_text"] for p in pages),
        "broken_links": sum(p["broken_links"] for p in pages),
        "slow_pages": sum(1 for p in pages if p["load_time"] > 3000),
        "missing_canonical": sum(1 for p in pages if not p["canonical"]),
        "noindex_pages": sum(1 for p in pages if p["is_noindex"]),
    }

    critical = sum(len([i for i in p["issues"] if i["type"] == "critical"]) for p in pages)
    warnings = sum(len([i for i in p["issues"] if i["type"] == "warning"]) for p in pages)
    passed = len(pages) * 5 - critical - warnings

    return {
        "url": website_url,
        "pages_crawled": len(pages),
        "total_pages": len(pages),
        "pages": pages,
        "issues": {"critical": critical, "warnings": warnings, "passed": passed},
        "summary": summary,
        "seo_score": max(0, round((passed / (len(pages) * 5)) * 100)),
    }
