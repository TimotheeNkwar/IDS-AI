from fastapi import APIRouter, Depends, HTTPException
from typing import List

from fastapi.security import OAuth2PasswordRequestForm
from database import user

from schemas.schemas import Token, Token, UserCreate, UserLogin, UserRead
from users.crud import create_user as crud_create_user
from database.user import (
    list_users,
    get_user_by_id,
    get_user_by_email,
    get_user_by_username,
)
from users.oauth import create_access_token, verify_password
from bson import ObjectId

from database.models import User as DBUser
from bson import ObjectId
import logging

router = APIRouter()
log = logging.getLogger(__name__)


@router.post("/", response_model=UserRead)
async def create_user_endpoint(user_create: UserCreate) -> UserRead:
    return await crud_create_user(user_create)


@router.post("/login", response_model=Token)
async def login_endpoint(form_data: OAuth2PasswordRequestForm = Depends()):
    db_user = await get_user_by_email(form_data.username)  # username = email ici
    if not db_user or not verify_password(form_data.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": db_user["id"]})
    return Token(access_token=access_token, token_type="bearer")
