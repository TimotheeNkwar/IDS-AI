from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
import database

from schemas.schemas import Token, UserCreate, UserRead
from users.crud import create_user as crud_create_user
from users.exceptions import UserAlreadyExistsError
from database.user import get_user_by_email
from users.oauth import create_access_token, get_current_user, verify_password
import logging

user_router = APIRouter()
log = logging.getLogger(__name__)


@user_router.post("/", response_model=UserRead)
async def create_user_endpoint(user_create: UserCreate) -> UserRead:
    try:
        return await crud_create_user(user_create)
    except UserAlreadyExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@user_router.get("/me", response_model=UserRead)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    user = await database.user_col.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return UserRead.model_validate(user)


@user_router.post("/login", response_model=Token)
async def login_endpoint(form_data: OAuth2PasswordRequestForm = Depends()):
    db_user = await get_user_by_email(form_data.username)
    if not db_user or not verify_password(form_data.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": db_user["id"]})
    return Token(access_token=access_token, token_type="bearer")