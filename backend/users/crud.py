import uuid
from schemas.schemas import UserCreate, UserRead, User
from .oauth import get_password_hash
from database import user as user_repo
from motor.motor_asyncio import AsyncIOMotorClient
from users.exceptions import UserAlreadyExistsError

import logging

log = logging.getLogger(__name__)


async def create_user(user: UserCreate) -> UserRead:

    existing = await user_repo.get_user_by_email(user.email)
    log.warning("existing_email check: %s", existing)
    if existing:
        raise UserAlreadyExistsError(f"Email {user.email} already in use")

    existing = await user_repo.get_user_by_username(user.username)
    log.warning("existing_username check: %s", existing)
    if existing:
        raise UserAlreadyExistsError(f"Username {user.username} already in use")

    hashed_password = get_password_hash(user.password)
    new_user = User(
        _id=str(uuid.uuid4()),
        username=user.username,
        email=user.email,
        is_active=True,
        password_hash=hashed_password,
    )

    user_dict = new_user.model_dump(by_alias=True)
    inserted_id = await user_repo.create_user(user_dict)
    log.warning("inserted_id: %s", inserted_id)

    if not inserted_id:
        raise UserAlreadyExistsError("User already exists or database error")

    return UserRead(
        _id=inserted_id,
        username=new_user.username,
        email=new_user.email,
        is_active=new_user.is_active,
    )
