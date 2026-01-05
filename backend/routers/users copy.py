from fastapi import APIRouter, Form, UploadFile, File, Depends  # Added Depends
from pydantic import EmailStr
from crud.users_crud import create_user, verify_user
from logger_config import get_logger
import os, shutil, re
from utils import read_json, write_json, is_valid_mobile
from database.database import get_session
from sqlmodel import Session  # Added Session type

router = APIRouter(prefix="/users", tags=["Users"])
logger = get_logger("UsersAPI")

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
    role: str = Form(...),
    profile_picture: UploadFile = File(None),
    session: Session = Depends(get_session) # Use dependency injection
):
    logger.info("Registration started for %s with role: %s", email, role)

    if not is_valid_mobile(mobile):
        return {"status": "error", "message": "Invalid mobile number"}

    if password != confirm_password:
        return {"status": "error", "message": "Passwords do not match"}

    # Password validation pattern
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$"
    if not re.match(pattern, password):
        return {"status": "error", "message": "Weak password"}

    # File saving logic
    file_path = None
    if profile_picture and profile_picture.filename:
        file_path = f"{UPLOAD_DIR}/{email}_{profile_picture.filename}"
        with open(file_path, "wb") as f:
            shutil.copyfileobj(profile_picture.file, f)

    user_data = {
        "name": name,
        "email": email,
        "mobile": mobile,
        "address": address,
        "password": password,
        "role": role,
        "profile_picture": file_path
    }

    # Pass the session from Depends to create_user
    user = create_user(session=session, data=user_data)

    if user == "exists":
        return {"status": "error", "message": "User already registered with this email"}

    logger.info(f"User registered successfully: {email} as {role}")

    return {
        "status": "success", 
        "message": "User registered successfully", 
        "user_id": user.id if hasattr(user, 'id') else user
    }

@router.post("/login")
def login_user(
    email: EmailStr = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    session: Session = Depends(get_session) # Use dependency injection
):
    logger.info("Login attempt for %s as role:%s", email, role)
    
    # Pass the session to verify_user
    user_exist, user = verify_user(session=session, email=email, password=password, role=role)
    
    if user_exist:
        return {
            'status': 'success',
            'message': 'Login successful',
            'user': user,
            'role': role
        }
    else:
        return {
            "status": "error",
            "message": f"Account not found in {role} records."
        }