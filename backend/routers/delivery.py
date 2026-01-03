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
    delivery_person_profile: UploadFile = File(...)
):
    logger.info("Adding delivery person: %s", name)
    try:
        if not is_valid_mobile(mobile):
            logger.warning("Invalid mobile for delivery person: %s", mobile)
            return {"status": "error", "message": "Invalid mobile number"}

        persons = read_json(DEL_FILE)

        file_ext = os.path.splitext(delivery_person_profile.filename)[1]
        file_name = f"delivery_{len(persons) + 1}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(delivery_person_profile.file, buffer)

        person = {
            "id": len(persons) + 1,
            "name": name,
            "mobile": mobile,
            "vehicle": vehicle,
            "profile_picture": file_path
        }

        persons.append(person)
        write_json(DEL_FILE, persons)

        logger.info("Delivery person added: %s (ID: %d)", name, person["id"])
        return {"status": "success", "delivery_person": person}

    except Exception as e:
        logger.error(
            "Failed to add delivery person %s: %s",
            name,
            str(e),
            exc_info=True
        )
        return {"status": "error", "message": "Internal server error"}


@router.get("/")
def get_all_delivery_persons():
    logger.info("Fetching all delivery persons")
    try:
        persons = read_json(DEL_FILE)
        if not persons:
            logger.info("No delivery persons found")
            return {
                "status": "success",
                "delivery_persons": [],
                "message": "No delivery persons available"
            }

        logger.info("Retrieved %d delivery persons", len(persons))
        return {
            "status": "success",
            "count": len(persons),
            "delivery_persons": persons
        }

    except Exception as e:
        logger.error("Failed to fetch delivery persons: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal server error"}
