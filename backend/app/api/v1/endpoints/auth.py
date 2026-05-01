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
    forgot_password_rate_limiter,
    reset_password_rate_limiter,
)
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.models.registration_request import RegistrationRequest
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.auth import (
    ForgotPasswordRequestSchema,
    PasswordResetResponseSchema,
    ResetPasswordRequestSchema,
)
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
from app.services.email_service import (
    send_email_verification_email,
    send_password_reset_email,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _raise_conflict(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


def _hash_reset_token(token: str) -> str:
    return get_password_hash(token)


def _verify_reset_token(token: str, token_hash: str) -> bool:
    return verify_password(token, token_hash)


def _detect_conflict_field(payload, item) -> str:
    if payload.email and getattr(item, "email", None) == payload.email:
        return "email"
    if payload.username and getattr(item, "username", None) == payload.username:
        return "username"
    if payload.unique_code and getattr(item, "unique_code", None) == payload.unique_code:
        return "unique_code"
    return "date"


# ---------------- REGISTER ----------------

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
            detail="Conturile de administrator nu pot fi create prin înregistrare publică.",
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
            field = _detect_conflict_field(payload, existing_user)

            if existing_user.status != UserStatus.APPROVED.value:
                _raise_conflict(
                    f"Există deja un cont cu acest {field}, dar încă nu este aprobat de administrator."
                )

            _raise_conflict(
                f"Există deja un cont activ cu acest {field}."
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
            field = _detect_conflict_field(payload, existing_request)

            if existing_request.status == RegistrationRequestStatus.PENDING.value:
                if existing_request.email_verified_at is None:
                    _raise_conflict(
                        f"Există deja o cerere de înregistrare cu acest {field}, dar emailul nu este confirmat. Cere retrimiterea emailului de confirmare."
                    )

                _raise_conflict(
                    f"Există deja o cerere de înregistrare cu acest {field}. Emailul este confirmat, dar contul așteaptă aprobarea administratorului."
                )

            _raise_conflict(
                f"Există deja o cerere de înregistrare cu acest {field}."
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


# ---------------- RESEND VERIFICATION ----------------

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
            detail="Nu există nicio cerere de înregistrare pentru acest email.",
        )

    if registration_request.status != RegistrationRequestStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doar cererile în așteptare pot primi un nou email de confirmare.",
        )

    if registration_request.email_verified_at is not None:
        return ResendVerificationEmailResponseSchema(
            success=True,
            message="Emailul este deja confirmat. Contul așteaptă aprobarea administratorului.",
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
        message="Emailul de confirmare a fost retrimis cu succes.",
    )


# ---------------- VERIFY EMAIL ----------------

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
            detail="Linkul de confirmare este invalid.",
        )

    if registration_request.email_verified_at is not None:
        return VerifyEmailResponseSchema(
            success=True,
            message="Emailul este deja confirmat.",
        )

    now = datetime.now(timezone.utc)

    if (
        registration_request.email_verification_expires_at is not None
        and registration_request.email_verification_expires_at < now
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Linkul de confirmare a expirat. Cere retrimiterea emailului de confirmare.",
        )

    registration_request.email_verified_at = now
    registration_request.email_verification_token = None

    db.add(registration_request)
    await db.commit()

    return VerifyEmailResponseSchema(
        success=True,
        message="Email confirmat cu succes. Contul așteaptă aprobarea administratorului.",
    )


# ---------------- FORGOT PASSWORD ----------------

@router.post("/forgot-password", response_model=PasswordResetResponseSchema)
async def forgot_password(
    payload: ForgotPasswordRequestSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> PasswordResetResponseSchema:
    forgot_password_rate_limiter.hit(
        build_rate_limit_key(request, payload.email)
    )

    generic_message = (
        "Dacă există un cont pentru acest email, a fost trimis un email de resetare parolă."
    )

    user = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()

    if user is None or not user.is_active:
        return PasswordResetResponseSchema(message=generic_message)

    reset_token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)

    user.password_reset_token_hash = _hash_reset_token(reset_token)
    user.password_reset_expires_at = now + timedelta(hours=1)

    db.add(user)
    await db.commit()

    if user.email:
        send_password_reset_email(
            to_email=user.email,
            reset_token=reset_token,
        )

    return PasswordResetResponseSchema(message=generic_message)


# ---------------- RESET PASSWORD ----------------

@router.post("/reset-password", response_model=PasswordResetResponseSchema)
async def reset_password(
    payload: ResetPasswordRequestSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> PasswordResetResponseSchema:
    reset_password_rate_limiter.hit(
        build_rate_limit_key(request, payload.token[:12])
    )

    now = datetime.now(timezone.utc)

    if len(payload.password.strip()) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parola trebuie să aibă cel puțin 8 caractere.",
        )

    users = (
        await db.execute(
            select(User).where(
                User.password_reset_token_hash.is_not(None),
                User.password_reset_expires_at.is_not(None),
                User.password_reset_expires_at >= now,
            )
        )
    ).scalars().all()

    matched_user: User | None = None

    for user in users:
        if not user.password_reset_token_hash:
            continue

        if _verify_reset_token(payload.token, user.password_reset_token_hash):
            matched_user = user
            break

    if matched_user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tokenul de resetare este invalid sau expirat.",
        )

    matched_user.password_hash = get_password_hash(payload.password)
    matched_user.password_reset_token_hash = None
    matched_user.password_reset_expires_at = None

    db.add(matched_user)
    await db.commit()

    return PasswordResetResponseSchema(
        message="Parola a fost resetată cu succes.",
    )


# ---------------- LOGIN ----------------

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
            detail="Username sau parolă greșită.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Contul este inactiv.",
        )

    if user.status != UserStatus.APPROVED.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Contul nu este aprobat de administrator. Status curent: {user.status}",
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


# ---------------- ME ----------------

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
    next_email = payload.email if payload.email is not None else current_user.email
    next_username = (
        payload.username if payload.username is not None else current_user.username
    )

    email_changed = next_email != current_user.email
    username_changed = next_username != current_user.username

    filters = []

    if email_changed and next_email:
        filters.append(User.email == next_email)

    if username_changed and next_username:
        filters.append(User.username == next_username)

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
            _raise_conflict("Email sau username deja folosit.")

    current_user.email = next_email
    current_user.username = next_username

    if payload.password:
        if not payload.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parola curentă este obligatorie.",
            )

        if not verify_password(payload.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parola curentă este greșită.",
            )

        current_user.password_hash = get_password_hash(payload.password)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return current_user