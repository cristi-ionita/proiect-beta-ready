from __future__ import annotations

from datetime import datetime, timedelta, timezone
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_active_approved_user
from app.core.config import settings
from app.core.rate_limit import (
    build_rate_limit_key,
    login_rate_limiter,
    resend_verification_rate_limiter,
)
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.models.registration_request import RegistrationRequest
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.registration_request import (
    RegistrationRequestCreateSchema,
    RegistrationRequestReadSchema,
    RegistrationRequestStatus,
    ResendVerificationEmailRequestSchema,
    ResendVerificationEmailResponseSchema,
    VerifyEmailRequestSchema,
    VerifyEmailResponseSchema,
)
from app.schemas.user import (
    LoginResponseSchema,
    UserLoginSchema,
    UserReadSchema,
    UserStatus,
    UserUpdateMeSchema,
)
from app.services.email_service import send_email_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


def _raise_conflict(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


@router.post(
    "/register",
    response_model=RegistrationRequestReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegistrationRequestCreateSchema,
    db: AsyncSession = Depends(get_db),
) -> RegistrationRequest:
    if payload.role.value == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be self-registered",
        )

    user_filters = []
    if payload.email:
        user_filters.append(User.email == payload.email)
    if payload.username:
        user_filters.append(User.username == payload.username)
    if payload.unique_code:
        user_filters.append(User.unique_code == payload.unique_code)

    if user_filters:
        existing_user = (
            await db.execute(select(User).where(or_(*user_filters)))
        ).scalar_one_or_none()

        if existing_user:
            _raise_conflict(
                "A user with the same email, username, or unique_code already exists"
            )

    request_filters = []
    if payload.email:
        request_filters.append(RegistrationRequest.email == payload.email)
    if payload.username:
        request_filters.append(RegistrationRequest.username == payload.username)
    if payload.unique_code:
        request_filters.append(RegistrationRequest.unique_code == payload.unique_code)

    if request_filters:
        existing_request = (
            await db.execute(select(RegistrationRequest).where(or_(*request_filters)))
        ).scalar_one_or_none()

        if existing_request:
            _raise_conflict(
                "A registration request with the same email, username, or unique_code already exists"
            )

    now = datetime.now(timezone.utc)
    verification_token = secrets.token_urlsafe(32)

    registration_request = RegistrationRequest(
        full_name=payload.full_name,
        email=payload.email,
        unique_code=payload.unique_code,
        username=payload.username,
        shift_number=payload.shift_number,
        password_hash=get_password_hash(payload.password),
        role=payload.role.value,
        status=RegistrationRequestStatus.PENDING.value,
        email_verification_token=verification_token,
        email_verification_sent_at=now,
        email_verification_expires_at=now
        + timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS),
        email_verified_at=None,
    )

    db.add(registration_request)
    await db.commit()
    await db.refresh(registration_request)

    if registration_request.email:
        send_email_verification_email(
            to_email=registration_request.email,
            verification_token=verification_token,
        )

    return registration_request


@router.post(
    "/resend-verification-email",
    response_model=ResendVerificationEmailResponseSchema,
)
async def resend_verification_email(
    payload: ResendVerificationEmailRequestSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ResendVerificationEmailResponseSchema:
    resend_verification_rate_limiter.hit(
        build_rate_limit_key(request, payload.email)
    )

    registration_request = (
        await db.execute(
            select(RegistrationRequest).where(
                RegistrationRequest.email == payload.email
            )
        )
    ).scalar_one_or_none()

    if registration_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration request not found for this email.",
        )

    if registration_request.status != RegistrationRequestStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending registration requests can receive a verification email.",
        )

    if registration_request.email_verified_at is not None:
        return ResendVerificationEmailResponseSchema(
            success=True,
            message="Email is already verified.",
        )

    now = datetime.now(timezone.utc)
    verification_token = secrets.token_urlsafe(32)

    registration_request.email_verification_token = verification_token
    registration_request.email_verification_sent_at = now
    registration_request.email_verification_expires_at = now + timedelta(
        hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
    )

    db.add(registration_request)
    await db.commit()

    if registration_request.email:
        send_email_verification_email(
            to_email=registration_request.email,
            verification_token=verification_token,
        )

    return ResendVerificationEmailResponseSchema(
        success=True,
        message="Verification email sent successfully.",
    )


@router.post("/verify-email", response_model=VerifyEmailResponseSchema)
async def verify_email(
    payload: VerifyEmailRequestSchema,
    db: AsyncSession = Depends(get_db),
) -> VerifyEmailResponseSchema:
    registration_request = (
        await db.execute(
            select(RegistrationRequest).where(
                RegistrationRequest.email_verification_token == payload.token
            )
        )
    ).scalar_one_or_none()

    if registration_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid verification token",
        )

    if registration_request.email_verified_at is not None:
        return VerifyEmailResponseSchema(
            success=True,
            message="Email already verified",
        )

    now = datetime.now(timezone.utc)

    if (
        registration_request.email_verification_expires_at is not None
        and registration_request.email_verification_expires_at < now
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired",
        )

    registration_request.email_verified_at = now
    registration_request.email_verification_token = None

    db.add(registration_request)
    await db.commit()

    return VerifyEmailResponseSchema(
        success=True,
        message="Email verified successfully",
    )


@router.post("/login", response_model=LoginResponseSchema)
async def login(
    payload: UserLoginSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> LoginResponseSchema:
    login_rate_limiter.hit(build_rate_limit_key(request, payload.username))

    user = (
        await db.execute(select(User).where(User.username == payload.username))
    ).scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if user.status != UserStatus.APPROVED.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is not approved. Current status: {user.status}",
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(user_id=user.id, role=user.role)

    return LoginResponseSchema(
        access_token=access_token,
        token_type="bearer",
        user=UserReadSchema.model_validate(user),
    )


@router.get("/me", response_model=UserReadSchema)
async def me(
    current_user: User = Depends(require_active_approved_user),
) -> User:
    return current_user


@router.put("/me", response_model=UserReadSchema)
async def update_me(
    payload: UserUpdateMeSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_approved_user),
) -> User:
    email_changed = payload.email != current_user.email
    username_changed = payload.username != current_user.username

    filters = []

    if email_changed and payload.email is not None:
        filters.append(User.email == payload.email)

    if username_changed and payload.username is not None:
        filters.append(User.username == payload.username)

    if filters:
        existing_user = (
            await db.execute(
                select(User).where(
                    or_(*filters),
                    User.id != current_user.id,
                )
            )
        ).scalar_one_or_none()

        if existing_user:
            _raise_conflict("Email or username already in use")

    current_user.email = payload.email
    current_user.username = payload.username

    if payload.password:
        if not payload.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required.",
            )

        if not verify_password(payload.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

        current_user.password_hash = get_password_hash(payload.password)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return current_user