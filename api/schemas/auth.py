from pydantic import BaseModel, EmailStr
from api.models.user import UserRole
import uuid
from datetime import datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    is_native_speaker: bool = False


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    role: UserRole
    is_native_speaker: bool
    created_at: datetime

    model_config = {"from_attributes": True}
