from fastapi import APIRouter, Form, UploadFile, File
from pydantic import EmailStr
from utils import read_json, write_json, is_valid_mobile
from logger_config import get_logger
import os, shutil, re

router = APIRouter(prefix="/users", tags=["Users"])
logger = get_logger("UsersAPI")
USER_FILE = "users.json"

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
    logger.info("User registration started: %s", email)
    try:
        users = read_json(USER_FILE)
        
        if not is_valid_mobile(mobile):
            logger.warning("Invalid mobile: %s", mobile)
            return {"status": "error", "message": "Invalid mobile number"}
        
        for user in users:
            if user["email"] == email:
                logger.warning("User already exists: %s", email)
                return {"status": "error", "message": "User already exists"}
        
        if password != confirm_password:
            logger.warning("Password mismatch: %s", email)
            return {"status": "error", "message": "Passwords do not match"}
        
        password_pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
        if not re.match(password_pattern, password):
            logger.warning("Weak password attempt: %s", email)
            return {"status": "error", "message": "Weak password"}
        
        os.makedirs("uploads/profile_pictures", exist_ok=True)
        file_path = f"uploads/profile_pictures/{email}_{profile_picture.filename}"
        with open(file_path, "wb") as f:
            shutil.copyfileobj(profile_picture.file, f)
        
        new_user = {
            "id": len(users) + 1,
            "name": name,
            "email": email,
            "mobile": mobile,
            "address": address,
            "password": password,
            "profile_picture": file_path
        }
        users.append(new_user)
        write_json(USER_FILE, users)
        logger.info("User registered successfully: %s", email)
        return {"status": "success", "user": new_user}
    except Exception as e:
        logger.error("User registration failed for %s: %s", email, str(e), exc_info=True)
        return {"status": "error", "message": f"Internal error: {str(e)}"}

@router.get("/")
def get_users():
    logger.info("Fetching all users")
    try:
        users = read_json(USER_FILE)
        logger.info("Retrieved %d users", len(users))
        return {"status": "success", "users": users}
    except Exception as e:
        logger.error("Failed to fetch users: %s", str(e), exc_info=True)
        return {"status": "error", "message": f"Internal error: {str(e)}"}
