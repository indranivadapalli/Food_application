from fastapi import APIRouter, Form, UploadFile, File
from utils import read_json, write_json, is_valid_mobile
from logger_config import get_logger
import os
import shutil

router = APIRouter(prefix="/delivery", tags=["Delivery"])
logger = get_logger("DeliveryAPI")

DEL_FILE = "delivery_persons.json"

UPLOAD_DIR = "uploads/delivery_profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/add")
def add_delivery_person(
    name: str = Form(...),
    mobile: str = Form(...),
    vehicle: str = Form(...),
    password: str = Form(...),
    delivery_person_profile: UploadFile = File(...)
):
    logger.info("Adding delivery person: %s", name)

    if not is_valid_mobile(mobile):
        return {"status": "error", "message": "Invalid mobile number"}

    persons = read_json(DEL_FILE)

    for person in persons:
        if person["mobile"] == mobile:
            return {"status": "error", "message": "Delivery partner already exists"}

    file_path = f"{UPLOAD_DIR}/{mobile}_{delivery_person_profile.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(delivery_person_profile.file, buffer)

    data = {
        "name": name,
        "mobile": mobile,
        "vehicle": vehicle,
        "password": password,
        "profile_picture": file_path
    }

    persons.append(data)
    write_json(DEL_FILE, persons)

    logger.info("Delivery person added successfully: %s", mobile)

    return {
        "status": "success",
        "delivery_partner_id": data["id"]
    }


@router.post("/login")
def delivery_login(
    mobile: str = Form(...),
    password: str = Form(...)
):
    logger.info("Delivery login attempt: %s", mobile)

    persons = read_json(DEL_FILE)

    for person in persons:
        if person["mobile"] == mobile and person["password"] == password:
            logger.info("Delivery login successful: %s", mobile)
            return {
                "status": "success",
                "message": "Login successful",
                "delivery_partner": {
                    "id": person["id"],
                    "name": person["name"],
                    "mobile": person["mobile"],
                    "vehicle": person["vehicle"],
                    "profile_picture": person["profile_picture"]
                }
            }

    logger.warning("Invalid delivery login for %s", mobile)
    return {
        "status": "error",
        "message": "Invalid mobile or password"
    }


@router.get("/")
def get_all_delivery_persons():
    logger.info("Fetching all delivery persons")
    try:
        persons = read_json(DEL_FILE)

        if not persons:
            return {
                "status": "success",
                "delivery_persons": [],
                "message": "No delivery persons available"
            }

        return {
            "status": "success",
            "count": len(persons),
            "delivery_persons": persons
        }

    except Exception as e:
        logger.error("Failed to fetch delivery persons: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal server error"}
