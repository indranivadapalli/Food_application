from fastapi import APIRouter, Form, UploadFile, File, Depends
from pydantic import EmailStr
from utils import read_json, write_json, is_valid_mobile
from crud.users_crud import (
    check_user_exists,
    create_user,
    get_user,
    verify_user,
    get_all_users,
    update_user,
    delete_user
)
from logger_config import get_logger
import os, shutil, re
from database.database import get_session
from sqlmodel import Session

router = APIRouter(prefix="/users", tags=["Users"])
logger = get_logger("UsersAPI")

UPLOAD_DIR = "uploads/profile_pictures"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/register")
def register_user(
    name: str = Form(...),
    email: EmailStr = Form(...),
    mobile: str = Form(...),
    address: str = Form(None),
    password: str = Form(...),
    confirm_password: str = Form(None),
    role: str = Form(...),
    profile_picture: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    logger.info("User registration started | email=%s | role=%s", email, role)

    try:
        if not is_valid_mobile(mobile):
            logger.error("Invalid mobile number | email=%s", email)
            return {"status": "error", "message": "Invalid mobile number"}

        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$"
        if not re.match(pattern, password):
            logger.error("Weak password | email=%s", email)
            return {"status": "error", "message": "Weak password"}

        file_path = None
        if profile_picture and profile_picture.filename:
            file_path = f"{UPLOAD_DIR}/{email}_{profile_picture.filename}"
            with open(file_path, "wb") as f:
                shutil.copyfileobj(profile_picture.file, f)
            logger.info("Profile picture saved | email=%s", email)

        user_data = {
            "name": name,
            "email": email,
            "mobile": mobile,
            "address": address,
            "password": password,
            "profile_picture": file_path
        }

        if check_user_exists(session, email, role):
            logger.info("User already exists | email=%s | role=%s", email, role)
            return {"status": "error", "message": "User already registered with this email"}

        user = create_user(session=session, data=user_data, role=role)

        logger.info("User registered successfully | user_id=%s", user.id)

        return {
            "status": "success",
            "message": "User registered successfully",
            "user": user
        }

    except Exception as e:
        logger.error("User registration failed | error=%s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}

@router.post("/login")
def login_user(
    email: EmailStr = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    session: Session = Depends(get_session)
):
    logger.info("Login attempt | email=%s | role=%s", email, role)

    try:
        user_exist, user = verify_user(
            session=session,
            email=email,
            password=password,
            role=role
        )

        if user_exist:
            logger.info("Login successful | user_id=%s", user.id)
            return {
                "status": "success",
                "message": "Login successful",
                "user": user,
                "role": role
            }

        logger.info("Login failed | email=%s | role=%s", email, role)
        return {
            "status": "error",
            "message": f"Account not found in {role} records."
        }

    except Exception as e:
        logger.error("Login error | email=%s | error=%s", email, str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}

@router.put("/update/{user_id}")
def update_user_api(
    user_id: int,
    name: str = Form(None),
    mobile: str = Form(None),
    address: str = Form(None),
    password: str = Form(None),
    profile_picture: UploadFile | None = File(None),
    session: Session = Depends(get_session)
):
    logger.info("User update started | user_id=%s", user_id)

    try:
        update_data = {}

        if name:
            update_data["name"] = name

        if mobile:
            if not is_valid_mobile(mobile):
                logger.error("Invalid mobile | user_id=%s", user_id)
                return {"status": "error", "message": "Invalid mobile number"}
            update_data["mobile"] = mobile

        if address:
            update_data["address"] = address

        if password:
            pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$"
            if not re.match(pattern, password):
                logger.error("Weak password | user_id=%s", user_id)
                return {"status": "error", "message": "Weak password"}
            update_data["password"] = password

        if profile_picture:
            file_path = f"{UPLOAD_DIR}/{user_id}_{profile_picture.filename}"
            with open(file_path, "wb") as f:
                shutil.copyfileobj(profile_picture.file, f)
            update_data["profile_picture"] = file_path
            logger.info("Profile picture updated | user_id=%s", user_id)

        user = update_user(session=session, user_id=user_id, data=update_data)

        if not user:
            logger.info("User not found | user_id=%s", user_id)
            return {"status": "error", "message": "User not found"}

        logger.info("User updated successfully | user_id=%s", user_id)

        return {
            "status": "success",
            "message": "User updated successfully",
            "user": user
        }

    except Exception as e:
        logger.error(
            "User update failed | user_id=%s | error=%s",
            user_id,
            str(e),
            exc_info=True
        )
        return {"status": "error", "message": "Internal error"}

@router.get("/")
def get_users():
    logger.info("Fetching all users")

    try:
        session = get_session()
        users = get_all_users(session)

        logger.info("Users fetched successfully | count=%s", len(users))

        return {
            "status": "success",
            "users": [
                {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "mobile": user.mobile,
                    "address": user.address,
                    "profile_picture": user.profile_picture
                }
                for user in users
            ]
        }

    except Exception as e:
        logger.error("Failed to fetch users | error=%s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}
@router.delete("/delete/{user_id}")
def delete_user_api(user_id: int):
    logger.info("Delete user request | user_id=%s", user_id)

    try:
        session = get_session()
        deleted = delete_user(session=session, user_id=user_id)

        if not deleted:
            logger.info("User not found for delete | user_id=%s", user_id)
            return {"status": "error", "message": "User not found"}

        logger.info("User deleted successfully | user_id=%s", user_id)

        return {
            "status": "success",
            "message": "User deleted successfully"
        }

    except Exception as e:
        logger.error(
            "Delete user failed | user_id=%s | error=%s",
            user_id,
            str(e),
            exc_info=True
        )
        return {"status": "error", "message": "Internal error"}
