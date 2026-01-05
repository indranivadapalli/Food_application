from fastapi import APIRouter, Form, UploadFile, File
from pydantic import EmailStr
from utils import read_json, write_json, is_valid_mobile
from crud.users_crud import create_user, get_user, verify_user,get_all_users,update_user,delete_user
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
<<<<<<< HEAD
    profile_picture: UploadFile | None = File(None)
):
    logger.info("Registration started for %s", email)

    if not is_valid_mobile(mobile):
        return {"status": "error", "message": "Invalid mobile number"}

=======
    role: str = Form(...),
    profile_picture: UploadFile = File(None)
):
    logger.info("Registration started for %s", email)

    

    if not is_valid_mobile(mobile):
        return {"status": "error", "message": "Invalid mobile number"}

    
>>>>>>> 9e1394df1b33f8d5754e75fcb1da7bac626c5879
    if password != confirm_password:
        return {"status": "error", "message": "Passwords do not match"}

    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$"
    if not re.match(pattern, password):
        return {"status": "error", "message": "Weak password"}
<<<<<<< HEAD

    file_path = None
    if profile_picture:
=======
    file_path = None
    if profile_picture and profile_picture.filename:
>>>>>>> 9e1394df1b33f8d5754e75fcb1da7bac626c5879
        file_path = f"{UPLOAD_DIR}/{email}_{profile_picture.filename}"
        with open(file_path, "wb") as f:
            shutil.copyfileobj(profile_picture.file, f)

    user_data = {
        "name": name,
        "email": email,
        "mobile": mobile,
        "address": address,
        "password": password,
        "role":role,
        "profile_picture": file_path
    }

<<<<<<< HEAD
    session = get_session()
    user = create_user(session=session, data=user_data)

    logger.info("User registered successfully %s", user.id)
=======
    user = create_user(session=get_session(), data=user_data)

    if user == "exists":
        return {"status": "error", "message": "User already registered with this email"}

    return {"status": "success", "message": "User registered successfully", "user_id": user.id}
    # users.append(user_data)
    # write_json(USER_FILE, users)

    logger.info(f"User registered successfully {user}")
>>>>>>> 9e1394df1b33f8d5754e75fcb1da7bac626c5879

    return {
        "status": "success",
        "message": "User registered successfully",
<<<<<<< HEAD
        "user_id": user.id
=======
        "user_id": user.id if hasattr(user, 'id') else user
>>>>>>> 9e1394df1b33f8d5754e75fcb1da7bac626c5879
    }


@router.post("/login")
def login_user(
    email: EmailStr = Form(...),
    password: str = Form(...),
    role: str = Form(...)
):
<<<<<<< HEAD
    logger.info("Login attempt for %s", email)
    user_exist, user = verify_user(session=get_session(), email=email, password=password)
=======
    logger.info("Login attempt for %s as role:%s", email,role)
    user_exist, user = verify_user(session=get_session(), email=email, password=password,role=role)
>>>>>>> 9e1394df1b33f8d5754e75fcb1da7bac626c5879
    if user_exist:
        return {
            'status': 'success',
            'message': 'user login succesful',
            'user': user,
            'role':role
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
