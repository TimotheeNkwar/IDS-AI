import uuid
from schemas.schemas import _UserBase, UserCreate, UserRead, User
from .oauth import get_password_hash
from database import user as user_repo
from motor.motor_asyncio import AsyncIOMotorClient

import logging


async def create_user(user: UserCreate) -> UserRead:

    hashed_password = get_password_hash(user.password)

    new_user = User(
        _id=str(uuid.uuid4()),
        username=user.username,
        email=user.email,
        is_active=True,
        password_hash=hashed_password,
    )

    user_dict = new_user.model_dump(by_alias=True)

    logging.getLogger(__name__).warning(
        "user_dict type=%s val=%s", type(user_dict), user_dict
    )

    inserted_id = await user_repo.create_user(user_dict)

    if not inserted_id:
        raise Exception("User creation failed")

    return UserRead(
        _id=inserted_id,
        username=new_user.username,
        email=new_user.email,
        is_active=new_user.is_active,
    )
