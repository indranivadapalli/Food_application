from fastapi import APIRouter, Form, File, UploadFile
from pydantic import EmailStr
from crud.restaurant_crud import (
    create_restaurant,
    verify_restaurant,
    update_restaurant as update_restaurant_db,
    delete_restaurant as delete_restaurant_db,
    get_restaurant,
    get_all_restaurants
)
from logger_config import get_logger
from database.database import get_session
import os

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])
logger = get_logger("RestaurantsAPI")

RESTAURANT_UPLOAD_DIR = "uploads/restaurants"
os.makedirs(RESTAURANT_UPLOAD_DIR, exist_ok=True)

@router.post("/register")
def register_restaurant(
    name: str = Form(...),
    email: EmailStr = Form(...),
    address: str = Form(...),
    contact: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    restaurant_pic: UploadFile = File(...)
):
    logger.info("Restaurant registration started for %s", email)

    try:
        if password != confirm_password:
            return {"status": "error", "message": "Passwords do not match"}

        pic_path = f"{RESTAURANT_UPLOAD_DIR}/{email}_{restaurant_pic.filename}"
        with open(pic_path, "wb") as f:
            f.write(restaurant_pic.file.read())

        restaurant = create_restaurant(
            session=get_session(),
            data={
                "name": name,
                "email": email,
                "password": password,
                "address": address,
                "contact": contact,
                "restaurant_pic": pic_path
            }
        )

        return {
            "status": "success",
            "message": "Restaurant registered successfully",
            "restaurant_id": restaurant.id
        }

    except Exception as e:
        logger.error("Registration failed: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}

@router.post("/login")
def login_restaurant(
    email: EmailStr = Form(...),
    password: str = Form(...)
):
    logger.info("Restaurant login attempt: %s", email)

    success, restaurant = verify_restaurant(
        session=get_session(),
        email=email,
        password=password
    )

    if not success:
        return {"status": "error", "message": "Invalid email or password"}

    return {
        "status": "success",
        "message": "Login successful",
        "restaurant": restaurant
    }

@router.put("/{restaurant_id}/update")
def update_restaurant(
    restaurant_id: int,
    address: str = Form(None),
    contact: str = Form(None),
    password: str = Form(None),
    restaurant_pic: UploadFile = File(None)
):
    logger.info("Update restaurant request: %s", restaurant_id)

    try:
        update_data = {}

        if address:
            update_data["address"] = address
        if contact:
            update_data["contact"] = contact
        if password:
            update_data["password"] = password

        if restaurant_pic:
            pic_path = f"{RESTAURANT_UPLOAD_DIR}/{restaurant_id}_{restaurant_pic.filename}"
            with open(pic_path, "wb") as f:
                f.write(restaurant_pic.file.read())
            update_data["restaurant_pic"] = pic_path

        restaurant = update_restaurant_db(
            session=get_session(),
            restaurant_id=restaurant_id,
            data=update_data
        )

        if not restaurant:
            return {"status": "error", "message": "Restaurant not found"}

        return {"status": "success", "message": "Restaurant updated successfully"}

    except Exception as e:
        logger.error("Update failed: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}

@router.get("/{restaurant_id}")
def get_single_restaurant(restaurant_id: int):
    restaurant = get_restaurant(
        session=get_session(),
        restaurant_id=restaurant_id
    )

    if not restaurant:
        return {"status": "error", "message": "Restaurant not found"}

    return {"status": "success", "restaurant": restaurant}

@router.get("/")
def fetch_all_restaurants():
    restaurants = get_all_restaurants(session=get_session())
    return {"status": "success", "restaurants": restaurants}

@router.delete("/{restaurant_id}")
def delete_restaurant(restaurant_id: int):
    success = delete_restaurant_db(
        session=get_session(),
        restaurant_id=restaurant_id
    )

    if not success:
        return {"status": "error", "message": "Restaurant not found"}

    return {"status": "success", "message": "Restaurant deleted"}