from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User
from app.schemas.user import UserCreate, UserLogin, UserUpdate, UserResponse, TokenResponse
from app.services.email_service import send_welcome_email
from app.middleware.auth import get_current_user
from app.config import settings
from app.utils.logger import logger
import asyncio

router = APIRouter(prefix="/api/auth", tags=["Auth"])


# ── Password helpers (bypass passlib to avoid bcrypt 4.x / Python 3.12 bug) ──

def hash_password(plain: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ── JWT helper ────────────────────────────────────────────────────────────────

def generate_token(user_id: str) -> str:
    """Generate a signed JWT token."""
    expires = settings.jwt_expires_in or "7d"
    unit = expires[-1]
    value = int(expires[:-1])
    delta = {
        "d": timedelta(days=value),
        "h": timedelta(hours=value),
        "m": timedelta(minutes=value),
    }.get(unit, timedelta(days=7))
    payload = {"id": user_id, "exp": datetime.utcnow() + delta}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=user_data.email,
        password=hash_password(user_data.password),   # ← uses bcrypt directly
        first_name=user_data.first_name,
        last_name=user_data.last_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = generate_token(user.id)

    # Send welcome email without blocking the response
    asyncio.create_task(send_welcome_email(user.email, user.first_name))

    return TokenResponse(
        message="Account created successfully",
        data={
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,
            },
            "token": token,
        },
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate a user and return a JWT token."""
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password):  # ← uses bcrypt directly
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user.last_login = datetime.utcnow()
    db.commit()

    token = generate_token(user.id)

    return TokenResponse(
        message="Login successful",
        data={
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,
            },
            "token": token,
        },
    )


@router.get("/profile", response_model=dict)
async def get_profile(user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return {
        "status": "success",
        "data": {
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,
                "is_active": user.is_active,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "created_at": user.created_at.isoformat(),
            }
        },
    }


@router.put("/profile", response_model=dict)
async def update_profile(
    update: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the currently authenticated user's profile."""
    if update.first_name is not None:
        user.first_name = update.first_name
    if update.last_name is not None:
        user.last_name = update.last_name
    db.commit()
    db.refresh(user)

    return {
        "status": "success",
        "message": "Profile updated",
        "data": {
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,
            }
        },
    }