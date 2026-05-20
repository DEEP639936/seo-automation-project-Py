"""Claude API Service - AI Content Optimization.
Generates SEO suggestions, improved content, meta tags.
Includes mock fallback for development without API keys.
"""
import json
import re
import httpx
from typing import Dict, Any
from app.config import settings
from app.utils.logger import logger

CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
USE_MOCK = settings.use_mock_data or not settings.claude_api_key


async def generate_seo_content(prompt: str, max_tokens: int = 2000) -> Dict[str, Any]:
    """Generate SEO-optimized content using Claude API."""
    if USE_MOCK:
        logger.info("Using mock AI content generation")
        return generate_mock_content(prompt)

    system_prompt = "You are an expert SEO content strategist."
    full_prompt = system_prompt + " " + prompt + "\n\nProvide concise, actionable SEO recommendations. Format as JSON where applicable."

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                CLAUDE_API_URL,
                json={
                    "model": settings.claude_model or "claude-3-sonnet-20240229",
                    "max_tokens": max_tokens,
                    "messages": [
                        {
                            "role": "user",
                            "content": full_prompt,
                        }
                    ],
                },
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": settings.claude_api_key,
                    "anthropic-version": "2023-06-01",
                },
            )
            response.raise_for_status()
            data = response.json()

            return {
                "success": True,
                "content": data["content"][0]["text"],
                "model": data.get("model"),
                "usage": data.get("usage"),
                "mock": False,
            }
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        return generate_mock_content(prompt)


async def generate_page_suggestions(page_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate SEO suggestions for a specific page."""
    prompt = (
        "Analyze this webpage and provide SEO optimization suggestions:\n\n"
        + f"URL: {page_data.get('url', '')}\n"
        + f"Current Title: {page_data.get('title') or 'Missing'}\n"
        + f"Current Meta Description: {page_data.get('meta_description') or 'Missing'}\n"
        + f"Current H1: {page_data.get('h1') or 'Missing'}\n"
        + f"Word Count: {page_data.get('word_count', 0)}\n"
        + f"Issues: {json.dumps(page_data.get('issues', []))}\n\n"
        + "Provide:\n"
        + "1. Optimized title tag (50-60 chars)\n"
        + "2. Optimized meta description (150-160 chars)\n"
        + "3. Suggested H1 heading\n"
        + "4. Content improvement suggestions (3-5 bullet points)\n"
        + "5. Keyword recommendations\n\n"
        + "Return as JSON with keys: title, metaDescription, h1, contentSuggestions, keywords"
    )

    result = await generate_seo_content(prompt, 1500)

    if result.get("success") and not result.get("mock"):
        try:
            json_match = re.search(r"\{[\s\S]*\}", result["content"])
            if json_match:
                result["parsed"] = json.loads(json_match.group(0))
        except Exception:
            result["parsed"] = None

    return result


async def generate_article(topic: str, keywords: list, tone: str = "professional") -> Dict[str, Any]:
    """Generate full article/blog content."""
    prompt = (
        f'Write an SEO-optimized article about "{topic}".\n'
        + f"Target keywords: {', '.join(keywords)}\n"
        + f"Tone: {tone}\n"
        + "Requirements:\n"
        + "- Minimum 800 words\n"
        + "- Include H2 and H3 subheadings\n"
        + "- Natural keyword integration\n"
        + "- Engaging introduction and conclusion\n"
        + "- SEO best practices throughout\n\n"
        + "Return the article with clear markdown formatting."
    )

    return await generate_seo_content(prompt, 4000)


def generate_mock_content(prompt: str) -> Dict[str, Any]:
    """Mock content generator for development/demo."""
    is_page_optimization = "Optimized title tag" in prompt
    is_article = "article" in prompt.lower()

    if is_page_optimization:
        return {
            "success": True,
            "mock": True,
            "content": json.dumps({
                "title": "Best SEO Practices for 2024 | Complete Guide",
                "metaDescription": "Discover the top SEO strategies and best practices for 2024. Learn how to improve rankings, drive traffic, and optimize your website effectively.",
                "h1": "Complete SEO Guide: Strategies for Higher Rankings",
                "contentSuggestions": [
                    "Add more internal links to related articles",
                    "Include structured data (Schema.org) markup",
                    "Improve image alt text descriptions",
                    "Add FAQ section at the bottom of the page",
                    "Increase content depth with case studies",
                ],
                "keywords": ["seo best practices", "seo guide 2024", "website optimization", "ranking factors"],
            }),
            "parsed": {
                "title": "Best SEO Practices for 2024 | Complete Guide",
                "metaDescription": "Discover the top SEO strategies and best practices for 2024. Learn how to improve rankings, drive traffic, and optimize your website effectively.",
                "h1": "Complete SEO Guide: Strategies for Higher Rankings",
                "contentSuggestions": [
                    "Add more internal links to related articles",
                    "Include structured data (Schema.org) markup",
                    "Improve image alt text descriptions",
                    "Add FAQ section at the bottom of the page",
                    "Increase content depth with case studies",
                ],
                "keywords": ["seo best practices", "seo guide 2024", "website optimization", "ranking factors"],
            },
        }

    if is_article:
        return {
            "success": True,
            "mock": True,
            "content": """# The Ultimate Guide to SEO in 2024

## Introduction

Search Engine Optimization (SEO) remains one of the most effective digital marketing strategies. In 2024, staying ahead requires understanding the latest algorithm updates and user behavior trends.

## Why SEO Matters

Organic search drives 53% of all website traffic. Unlike paid advertising, SEO provides long-term, sustainable results that compound over time.

## Key Ranking Factors

### Content Quality
Google's helpful content update emphasizes people-first content. Focus on expertise, authority, and trustworthiness (E-E-A-T).

### Technical SEO
Page speed, mobile-friendliness, and Core Web Vitals are critical technical foundations.

### Backlinks
Quality over quantity remains the rule for link building in 2024.

## Conclusion

SEO success requires patience, consistency, and adaptation. Start with technical fundamentals, then build quality content that serves your audience.""",
            "parsed": None,
        }

    return {
        "success": True,
        "mock": True,
        "content": "Mock AI response: SEO optimization suggestions generated successfully.",
        "parsed": None,
    }
