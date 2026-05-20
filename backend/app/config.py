"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings."""

    # Server
    port: int = Field(default=5000, alias="PORT")
    node_env: str = Field(default="development", alias="NODE_ENV")
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")

    # JWT
    jwt_secret: str = Field(default="change-me", alias="JWT_SECRET")
    jwt_expires_in: str = Field(default="7d", alias="JWT_EXPIRES_IN")

    # Claude API
    claude_api_key: str | None = Field(default=None, alias="CLAUDE_API_KEY")
    claude_model: str = Field(default="claude-3-sonnet-20240229", alias="CLAUDE_MODEL")

    # SEMrush API
    semrush_api_key: str | None = Field(default=None, alias="SEMRUSH_API_KEY")

    # Email
    smtp_host: str | None = Field(default=None, alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_user: str | None = Field(default=None, alias="SMTP_USER")
    smtp_pass: str | None = Field(default=None, alias="SMTP_PASS")
    email_from: str = Field(default="SEO Automation", alias="EMAIL_FROM")

    # Crawler
    crawl_max_pages: int = Field(default=50, alias="CRAWL_MAX_PAGES")
    crawl_concurrency: int = Field(default=5, alias="CRAWL_CONCURRENCY")

    # Scheduler
    enable_cron_jobs: bool = Field(default=False, alias="ENABLE_CRON_JOBS")

    # Mock data
    use_mock_data: bool = Field(default=True, alias="USE_MOCK_DATA")

    # Local demo login
    demo_user_email: str = Field(default="demo@example.com", alias="DEMO_USER_EMAIL")
    demo_user_password: str = Field(default="Password123!", alias="DEMO_USER_PASSWORD")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
