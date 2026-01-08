from fastapi import APIRouter, Form, File, UploadFile,Depends
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
from sqlmodel import Session

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])
logger = get_logger("RestaurantsAPI")

RESTAURANT_UPLOAD_DIR = "uploads/restaurants"
os.makedirs(RESTAURANT_UPLOAD_DIR, exist_ok=True)

@router.post("/register")
def register_restaurant(
    name: str = Form(...),
    email: EmailStr = Form(...),
    address: str = Form(...),
    mobile: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(None),
    restaurant_pic: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    logger.info("Restaurant registration started for %s", email)

    try:
     
      
        if restaurant_pic:

            pic_path = f"{RESTAURANT_UPLOAD_DIR}/{email}_{restaurant_pic.filename}"
            with open(pic_path, "wb") as f:
                f.write(restaurant_pic.file.read())

        restaurant = create_restaurant(
            session=session,
            data={
                "name": name,
                "email": email,
                "password": password,
                "address": address,
                "mobile": mobile,
                "restaurant_pic": pic_path if restaurant_pic else None
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
    password: str = Form(...),
    session: Session = Depends(get_session)

):
    logger.info("Restaurant login attempt: %s", email)

    success, restaurant = verify_restaurant(
        session,
        email=email,
        password=password
    )

    print(f"restaurant user {restaurant}")

    if not success:
        return {"status": "error", "message": "Invalid email or password"}

    return {
        "status": "success",
        "message": "Login successful",
        "role":"restaurant",
        "restaurant": restaurant

    }

@router.put("/{restaurant_id}/update")
def update_restaurant(
    restaurant_id: int,
    address: str = Form(None),
    mobile: str = Form(None),
    password: str = Form(None),
    restaurant_pic: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    logger.info("Update restaurant request: %s", restaurant_id)

    try:
        update_data = {}

        if address:
            update_data["address"] = address
        if mobile:
            update_data["mobile"] = mobile
        if password:
            update_data["password"] = password

        if restaurant_pic:
            pic_path = f"{RESTAURANT_UPLOAD_DIR}/{restaurant_id}_{restaurant_pic.filename}"
            with open(pic_path, "wb") as f:
                f.write(restaurant_pic.file.read())
            update_data["restaurant_pic"] = pic_path

        restaurant = update_restaurant_db(
            session=session,
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
def get_single_restaurant(restaurant_id: int, session: Session = Depends(get_session)):
    restaurant = get_restaurant(
        session=session,
        restaurant_id=restaurant_id
    )

    if not restaurant:
        return {"status": "error", "message": "Restaurant not found"}

    return {"status": "success", "restaurant": restaurant}

@router.get("/")
def fetch_all_restaurants(session: Session = Depends(get_session)):
    restaurants = get_all_restaurants(session)
    return {"status": "success", "restaurants": restaurants}

@router.delete("/{restaurant_id}")
def delete_restaurant(restaurant_id: int, session: Session = Depends(get_session)):
    success = delete_restaurant_db(
        session=session,
        restaurant_id=restaurant_id
    )

    if not success:
        return {"status": "error", "message": "Restaurant not found"}

    return {"status": "success", "message": "Restaurant deleted"}