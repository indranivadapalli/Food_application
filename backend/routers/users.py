from fastapi import APIRouter, Form, UploadFile, File, Depends  # Added Depends
from pydantic import EmailStr
from utils import read_json, write_json, is_valid_mobile
from crud.users_crud import check_user_exists, create_user, get_user, verify_user,get_all_users,update_user,delete_user
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
    address: str = Form(None),
    password: str = Form(...),
    confirm_password: str = Form(None),
    role: str = Form(...),
    profile_picture: UploadFile = File(None),
    session: Session = Depends(get_session) # Use dependency injection
    
):
    logger.info("Registration started for %s with role: %s", email, role)
    

    if not is_valid_mobile(mobile):
        return {"status": "error", "message": "Invalid mobile number"}


    # if password != confirm_password:
    #     return {"status": "error", "message": "Passwords do not match"}

    # Password validation pattern
    # Password validation pattern
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$"
    if not re.match(pattern, password):
        return {"status": "error", "message": "Weak password"}

    # File saving logic

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
        
        "profile_picture": file_path
    }
    
    if check_user_exists(session, email, role):
        return {"status": "error", "message": "User already registered with this email"}

    # Pass the session from Depends to create_user
    user = create_user(session=session, data=user_data, role=role)


    logger.info(f"User registered successfully {user}")

    return {"status": "success", "message": "User registered successfully", "user": user}
    # users.append(user_data)
    # write_json(USER_FILE, users)



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
    
    logger.info("Login attempt for %s as role:%s", email, role)
    
    # Pass the session to verify_user
    user_exist, user = verify_user(session=session, email=email, password=password, role=role)
    
    if user_exist:
        return {
            'status': 'success',
            'message': 'Login successful',
            'message': 'Login successful',
            'user': user,
            'role': role
        }
    else:
        return {
            "status": "error",
            "message": f"Account not found in {role} records."
        }
@router.put("/update/{user_id}")
def update_user_api(
    user_id: int,
    name: str = Form(None),
    mobile: str = Form(None),
    address: str = Form(None),
    password: str = Form(None),
    profile_picture: UploadFile | None = File(None)
):
    session = get_session()

    update_data = {}

    if name:
        update_data["name"] = name

    if mobile:
        if not is_valid_mobile(mobile):
            return {"status": "error", "message": "Invalid mobile number"}
        update_data["mobile"] = mobile

    if address:
        update_data["address"] = address

    if password:
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$"
        if not re.match(pattern, password):
            return {"status": "error", "message": "Weak password"}
        update_data["password"] = password

    if profile_picture:
        file_path = f"{UPLOAD_DIR}/{user_id}_{profile_picture.filename}"
        with open(file_path, "wb") as f:
            shutil.copyfileobj(profile_picture.file, f)
        update_data["profile_picture"] = file_path

    user = update_user(session=session, user_id=user_id, data=update_data)

    if not user:
        return {"status": "error", "message": "User not found"}

    return {
        "status": "success",
        "message": "User updated successfully",
        "user": user
    }


@router.get("/")
def get_users():
    logger.info("Fetching all users from database")

    try:
        session = get_session()
        users = get_all_users(session)

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
        logger.error("Failed to fetch users: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}
@router.delete("/delete/{user_id}")

def delete_user_api(user_id: int):
    session = get_session()

    deleted = delete_user(session=session, user_id=user_id)

    if not deleted:
        return {"status": "error", "message": "User not found"}

    return {
        "status": "success",
        "message": "User deleted successfully"
    }
