from fastapi import APIRouter, Form, File, UploadFile
from utils import read_json, write_json
from crud.restaurants_crud  import create_restaurant
from logger_config import get_logger
from database.database import get_session
import os

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])
logger = get_logger("RestaurantsAPI")

REST_FILE = "restaurants.json"

RESTAURANT_UPLOAD_DIR = "uploads/restaurants"
MENU_UPLOAD_DIR = "uploads/menu_items"
os.makedirs(RESTAURANT_UPLOAD_DIR, exist_ok=True)
os.makedirs(MENU_UPLOAD_DIR, exist_ok=True)

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
        logger.info("Add restaurant request received: %s", name)
        restaurants = read_json(REST_FILE)

        for restaurant in restaurants:
            if restaurant["name"].lower() == name.lower():
                logger.info("Restaurant already exists: %s", name)
                return {"status": "error", "message": "Restaurant already exists"}

        section_timings = {
            "tiffins": {"start": tiffins_start, "end": tiffins_end},
            "starters": {"start": starters_start, "end": starters_end},
            "main_course": {"start": main_course_start, "end": main_course_end},
            "soft_drinks": {"start": soft_drinks_start, "end": soft_drinks_end},
            "desserts": {"start": desserts_start, "end": desserts_end}
        }

        new_restaurant = {
            "name": name,
            "address": address,
            "contact": contact,
            "restaurant_pic": restaurant_pic.filename,
            "menu": {section: [] for section in SECTIONS},
            "section_timings": section_timings
        }

       # restaurants.append(new_restaurant)
        restaurant=create_restaurant(session=get_session,data=new_restaurant)
       # write_json(REST_FILE, restaurants)

        logger.info("Restaurant added successfully: %s (ID: %s)", name, new_restaurant["id"])
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
        logger.info("Add menu item request: Restaurant ID %s, Item %s", restaurant_id, item_name)
        restaurants = read_json(REST_FILE)
        category = category.lower()

        for restaurant in restaurants:
            if restaurant["id"] == restaurant_id:
                if category not in restaurant["menu"]:
                    logger.info("Invalid category '%s' for restaurant ID %s", category, restaurant_id)
                    return {"status": "error", "message": "Invalid section"}

                new_item = {
                    "item_id": len(restaurant["menu"][category]) + 1,
                    "name": item_name,
                    "price": price
                }

                restaurant["menu"][category].append(new_item)
                write_json(REST_FILE, restaurants)

                logger.info(
                    "Menu item added: %s (Restaurant ID %s, Category %s)",
                    item_name, restaurant_id, category
                )
                return {"status": "success", "menu_item": new_item}

        logger.info("Restaurant not found while adding menu item: ID %s", restaurant_id)
        return {"status": "error", "message": "Restaurant not found"}

    except Exception as error:
        logger.error("Add menu item failed: %s", str(error), exc_info=True)
        return {"status": "error", "message": "Internal error"}

@router.get("/{restaurant_id}/menu")
def get_menu(restaurant_id: int):
    try:
        logger.info("Get menu request for restaurant ID %s", restaurant_id)
        restaurants = read_json(REST_FILE)

        for restaurant in restaurants:
            if restaurant["id"] == restaurant_id:
                logger.info("Menu fetched successfully for restaurant ID %s", restaurant_id)
                return {
                    "status": "success",
                    "restaurant": restaurant["name"],
                    "menu": restaurant["menu"],
                    "section_timings": restaurant.get("section_timings", {})
                }

        logger.info("Restaurant not found while fetching menu: ID %s", restaurant_id)
        return {"status": "error", "message": "Restaurant not found"}

    except Exception as error:
        logger.error("Get menu failed: %s", str(error), exc_info=True)
        return {"status": "error", "message": "Internal error"}

@router.get("/")
def get_all_restaurants():
    try:
        logger.info("Fetch all restaurants request")
        restaurants = read_json(REST_FILE)
        logger.info("Total restaurants fetched: %s", len(restaurants))
        return {"status": "success", "restaurants": restaurants}

    except Exception as error:
        logger.error("Fetch restaurants failed: %s", str(error), exc_info=True)
        return {"status": "error", "message": "Internal error"}

@router.delete("/{restaurant_id}")
def delete_restaurant(restaurant_id: int):
    try:
        logger.info("Delete restaurant request: ID %s", restaurant_id)
        restaurants = read_json(REST_FILE)
        updated_restaurants = [
            restaurant for restaurant in restaurants if restaurant["id"] != restaurant_id
        ]

        if len(updated_restaurants) == len(restaurants):
            logger.info("Restaurant not found for deletion: ID %s", restaurant_id)
            return {"status": "error", "message": "Restaurant not found"}

        write_json(REST_FILE, updated_restaurants)
        logger.info("Restaurant deleted successfully: ID %s", restaurant_id)
        return {"status": "success", "message": "Restaurant deleted"}

    except Exception as error:
        logger.error("Delete restaurant failed: %s", str(error), exc_info=True)
        return {"status": "error", "message": "Internal error"}
