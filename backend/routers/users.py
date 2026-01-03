from fastapi import APIRouter, Form, UploadFile, File
from pydantic import EmailStr
from utils import read_json, write_json, is_valid_mobile
from crud.users_crud import create_user, get_user, verify_user
from logger_config import get_logger
import os, shutil, re
from database.database import get_session

router = APIRouter(prefix="/users", tags=["Users"])
logger = get_logger("UsersAPI")

USER_FILE = "users.json"

UPLOAD_DIR = "uploads/profile_pictures"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/register")
def register_user(
    name: str = Form(...),
    email: EmailStr = Form(...),
    mobile: str = Form(...),
    address: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    profile_picture: UploadFile = File(...)
):
    logger.info("Registration started for %s", email)

    users = read_json(USER_FILE)

    if not is_valid_mobile(mobile):
        return {"status": "error", "message": "Invalid mobile number"}

    for user in users:
        if user["email"] == email:
            return {"status": "error", "message": "User already registered"}

    if password != confirm_password:
        return {"status": "error", "message": "Passwords do not match"}

    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$"
    if not re.match(pattern, password):
        return {"status": "error", "message": "Weak password"}

    file_path = f"{UPLOAD_DIR}/{email}_{profile_picture.filename}"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(profile_picture.file, f)

    user_data = {
        "name": name,
        "email": email,
        "mobile": mobile,
        "address": address,
        "password": password,
        "profile_picture": file_path
    }

    user =  create_user(session=get_session(), data=user_data)


    # users.append(user_data)
    # write_json(USER_FILE, users)

    logger.info(f"User registered successfully {user}")

    return {
        "status": "success",
        "message": "User registered successfully",
        "user_id": user
    }


@router.post("/login")
def login_user(
    email: EmailStr = Form(...),
    password: str = Form(...)
):
    logger.info("Login attempt for %s", email)
    user_exist, user = verify_user(email, password)
    if user_exist:
        return {
            'status': 'success',
            'message': 'user login succesful',
            'user': user

        }

    else:

        return {
            "status": "error",
            "message": "Invalid email or password"
        }


@router.get("/")
def get_users():
    logger.info("Fetching all users")
    try:
        users = read_json(USER_FILE)
        return {"status": "success", "users": users}
    except Exception as e:
        logger.error("Failed to fetch users: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}
