from fastapi import APIRouter, Form, File, UploadFile
from utils import read_json, write_json
from logger_config import get_logger
import os

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])
logger = get_logger("RestaurantsAPI")

REST_FILE = "restaurants.json"

UPLOAD_DIR = "uploads/restaurants"
os.makedirs(UPLOAD_DIR, exist_ok=True)

SECTIONS = ["tiffins", "starters", "main_course", "soft_drinks", "desserts"]

@router.post("/add")
def add_restaurant(
    name: str = Form(...),
    address: str = Form(...),
    contact: str = Form(...),
    opening_time: str = Form(...),
    closing_time: str = Form(...),
    restaurant_pic: UploadFile = File(...)
):
    restaurants = read_json(REST_FILE)

    for restaurant in restaurants:
        if restaurant["name"].lower() == name.lower():
            return {"status": "error", "message": "Restaurant already exists"}

    new_restaurant = {
        "id": len(restaurants) + 1,
        "name": name,
        "address": address,
        "contact": contact,
        "restaurant_pic": restaurant_pic.filename,
        "opening_time": opening_time,
        "closing_time": closing_time,
        "section_timings": {
            "tiffins": {"start": "07:00", "end": "11:00"},
            "starters": {"start": "12:00", "end": "22:00"},
            "main_course": {"start": "12:00", "end": "23:00"},
            "soft_drinks": {"start": "07:00", "end": "23:00"},
            "desserts": {"start": "07:00", "end": "23:00"}
        },
        "menu": {section: [] for section in SECTIONS}
    }

    restaurants.append(new_restaurant)
    write_json(REST_FILE, restaurants)

    return {"status": "success", "restaurant": new_restaurant}


@router.post("/{restaurant_id}/menu/add")
def add_menu_item(
    restaurant_id: int,
    item_name: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    menu_item_pic: UploadFile = File(...)
):
    restaurants = read_json(REST_FILE)
    category = category.lower()

    for restaurant in restaurants:
        if restaurant["id"] == restaurant_id:

            if category not in restaurant["menu"]:
                return {"status": "error", "message": "Invalid section"}

            new_item = {
                "item_id": len(restaurant["menu"][category]) + 1,
                "name": item_name,
                "price": price
            }

            restaurant["menu"][category].append(new_item)
            write_json(REST_FILE, restaurants)

            return {"status": "success", "menu_item": new_item}

    return {"status": "error", "message": "Restaurant not found"}


@router.get("/{restaurant_id}/menu")
def get_menu(restaurant_id: int):
    restaurants = read_json(REST_FILE)

    for restaurant in restaurants:
        if restaurant["id"] == restaurant_id:
            return {"status": "success", "menu": restaurant["menu"]}

    return {"status": "error", "message": "Restaurant not found"}


@router.get("/")
def get_all_restaurants():
    return {"status": "success", "restaurants": read_json(REST_FILE)}


@router.delete("/{restaurant_id}")
def delete_restaurant(restaurant_id: int):
    restaurants = read_json(REST_FILE)
    updated = [r for r in restaurants if r["id"] != restaurant_id]

    if len(updated) == len(restaurants):
        return {"status": "error", "message": "Restaurant not found"}

    write_json(REST_FILE, updated)
    return {"status": "success", "message": "Restaurant deleted"}
from fastapi import APIRouter, Form
from utils import read_json, write_json
from logger_config import get_logger
from fastapi import File, UploadFile
import os

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])
logger = get_logger("RestaurantsAPI")
REST_FILE = "restaurants.json"

UPLOAD_DIR = "uploads/restaurants"
os.makedirs(UPLOAD_DIR, exist_ok=True)
UPLOAD_DIR = "uploads/menu_items"
os.makedirs(UPLOAD_DIR, exist_ok=True)

SECTIONS = ["tiffins", "starters", "main_course", "soft_drinks", "desserts"]

@router.post("/add")
def add_restaurant(
    name: str = Form(...),
    address: str = Form(...),
    contact: str = Form(...),
    restaurant_pic: UploadFile = File(...),
    tiffins_start: str = Form("07:00"),
    tiffins_end: str = Form("11:00"),
    starters_start: str = Form("12:00"),
    starters_end: str = Form("22:00"),
    main_course_start: str = Form("12:00"),
    main_course_end: str = Form("23:00"),
    soft_drinks_start: str = Form("07:00"),
    soft_drinks_end: str = Form("23:00"),
    desserts_start: str = Form("07:00"),
    desserts_end: str = Form("23:00")
):
    try:
        restaurants = read_json(REST_FILE)
        for restaurant in restaurants:
            if restaurant["name"].lower() == name.lower():
                return {"status": "error", "message": "Restaurant already exists"}

        section_timings = {
            "tiffins": {"start": tiffins_start, "end": tiffins_end},
            "starters": {"start": starters_start, "end": starters_end},
            "main_course": {"start": main_course_start, "end": main_course_end},
            "soft_drinks": {"start": soft_drinks_start, "end": soft_drinks_end},
            "desserts": {"start": desserts_start, "end": desserts_end}
        }

        new_restaurant = {
            "id": len(restaurants) + 1,
            "name": name,
            "address": address,
            "contact": contact,
            "restaurant_pic": restaurant_pic.filename,
            "menu": {section: [] for section in SECTIONS},
            "section_timings": section_timings
        }

        restaurants.append(new_restaurant)
        write_json(REST_FILE, restaurants)
        return {"status": "success", "restaurant": new_restaurant}

    except Exception as error:
        logger.error("Add restaurant failed: %s", str(error), exc_info=True)
        return {"status": "error", "message": "Internal error"}

@router.post("/{restaurant_id}/menu/add")
def add_menu_item(
    restaurant_id: int,
    item_name: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    menu_item_pic: UploadFile = File(...)
):
    try:
        restaurants = read_json(REST_FILE)
        category = category.lower()
        for restaurant in restaurants:
            if restaurant["id"] == restaurant_id:
                if category not in restaurant["menu"]:
                    return {"status": "error", "message": "Invalid section"}
                new_item = {
                    "item_id": len(restaurant["menu"][category]) + 1,
                    "name": item_name,
                    "price": price
                }
                restaurant["menu"][category].append(new_item)
                write_json(REST_FILE, restaurants)
                return {"status": "success", "menu_item": new_item}
        return {"status": "error", "message": "Restaurant not found"}
    except Exception as error:
        logger.error("Add menu item failed: %s", str(error), exc_info=True)
        return {"status": "error", "message": "Internal error"}

@router.get("/{restaurant_id}/menu")
def get_menu(restaurant_id: int):
    try:
        restaurants = read_json(REST_FILE)
        for restaurant in restaurants:
            if restaurant["id"] == restaurant_id:
                return {
                    "status": "success",
                    "restaurant": restaurant["name"],
                    "menu": restaurant["menu"],
                    "section_timings": restaurant.get("section_timings", {})
                }
        return {"status": "error", "message": "Restaurant not found"}
    except Exception as error:
        logger.error("Get menu failed: %s", str(error), exc_info=True)
        return {"status": "error", "message": "Internal error"}

@router.get("/")
def get_all_restaurants():
    try:
        restaurants = read_json(REST_FILE)
        return {"status": "success", "restaurants": restaurants}
    except Exception as error:
        logger.error("Fetch restaurants failed: %s", str(error), exc_info=True)
        return {"status": "error", "message": "Internal error"}

@router.delete("/{restaurant_id}")
def delete_restaurant(restaurant_id: int):
    try:
        restaurants = read_json(REST_FILE)
        updated_restaurants = [restaurant for restaurant in restaurants if restaurant["id"] != restaurant_id]
        if len(updated_restaurants) == len(restaurants):
            return {"status": "error", "message": "Restaurant not found"}
        write_json(REST_FILE, updated_restaurants)
        return {"status": "success", "message": "Restaurant deleted"}
    except Exception as error:
        logger.error("Delete restaurant failed: %s", str(error), exc_info=True)
        return {"status": "error", "message": "Internal error"}
