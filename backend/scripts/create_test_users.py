import asyncio
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.models.user import User
from app.db.session import get_session_local


PASSWORD = "Parola123!"


async def upsert_user(db, *, username, full_name, email, code, role, shift_number=None):
    now = datetime.now(timezone.utc)

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(username=username)
        db.add(user)

    user.full_name = full_name
    user.email = email
    user.unique_code = code
    user.shift_number = shift_number
    user.password_hash = get_password_hash(PASSWORD)
    user.role = role
    user.status = "approved"
    user.is_active = True
    user.approved_at = user.approved_at or now
    user.updated_at = now


async def main():
    session_local = get_session_local()

    async with session_local() as db:
        for i in range(1, 4):
            await upsert_user(
                db,
                username=f"mechanic{i}",
                full_name=f"Mechanic Test {i}",
                email=f"mechanic{i}@test.com",
                code=f"MECH{i:03}",
                role="mechanic",
            )

        for i in range(1, 11):
            old_username = f"mechanic{i + 3}"
            new_username = f"employee{i}"

            result = await db.execute(select(User).where(User.username == old_username))
            old_user = result.scalar_one_or_none()

            if old_user is not None:
                old_user.username = new_username
                user = old_user
            else:
                result = await db.execute(select(User).where(User.username == new_username))
                user = result.scalar_one_or_none()

                if user is None:
                    user = User(username=new_username)
                    db.add(user)

            user.full_name = f"Employee Test {i}"
            user.email = f"employee{i}@test.com"
            user.unique_code = f"EMP{i:03}"
            user.shift_number = str(i)
            user.password_hash = get_password_hash(PASSWORD)
            user.role = "employee"
            user.status = "approved"
            user.is_active = True
            user.updated_at = datetime.now(timezone.utc)
            user.approved_at = user.approved_at or datetime.now(timezone.utc)

        await db.commit()

    print("OK: 3 mechanics + 10 employees created/updated")


if __name__ == "__main__":
    asyncio.run(main())
