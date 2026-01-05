from fastapi import APIRouter, Form, UploadFile, File, Depends, HTTPException
from sqlmodel import Session
from database.database import get_session
from crud.delivery_crud import (
    check_delivery_partner_exists,
    create_delivery_partner,
    verify_delivery_partner,
    get_all_delivery_partners,
    get_delivery_partner
)
from logger_config import get_logger
import os
import shutil

router = APIRouter(prefix="/delivery", tags=["Delivery"])
logger = get_logger("DeliveryAPI")

UPLOAD_DIR = "uploads/delivery_profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/register")
async def register_delivery_partner(
    name: str = Form(...),
    email: str = Form(...),
    mobile: str = Form(...),
    password: str = Form(...),
    address: str = Form(default="N/A"),  # Provide default
    vehicle: str = Form(default="Bike"),  # Provide default
    delivery_person_profile: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    logger.info("Registering delivery partner: %s", email)

    try:
        # Check if delivery partner already exists
        if check_delivery_partner_exists(session, email):
            logger.warning("Delivery partner already exists: %s", email)
            return {
                "status": "error", 
                "message": "Delivery partner with this email already exists"
            }

        # Handle file upload if provided and has actual content
        file_path = None
        if delivery_person_profile and delivery_person_profile.filename:
            # Check if file has actual content (not empty Blob)
            content = await delivery_person_profile.read()
            if len(content) > 0:
                # Save the file
                file_path = f"{UPLOAD_DIR}/{email.replace('@', '_').replace('.', '_')}_{delivery_person_profile.filename}"
                with open(file_path, "wb") as buffer:
                    buffer.write(content)
                logger.info("Profile picture saved: %s", file_path)
            else:
                logger.info("Empty file received, skipping upload")

        # Prepare data for creation with correct field name
        data = {
            "name": name,
            "email": email,
            "mobile": mobile,
            "vehicle": vehicle if vehicle else "Bike",
            "password": password,
            "address": address if address else "N/A",
            "delivery_person_profile": file_path  # Use correct field name
        }

        # Create delivery partner
        partner = create_delivery_partner(session, data)
        logger.info("Delivery partner registered successfully: %s", email)

        return {
            "status": "success",
            "message": "Delivery partner registered successfully",
            "delivery_partner_id": partner.id,
            "delivery_partner": {
                "id": partner.id,
                "name": partner.name,
                "email": partner.email,
                "mobile": partner.mobile,
                "vehicle": partner.vehicle,
                "address": partner.address,
                "profile_picture": partner.delivery_person_profile,
                "is_available": partner.is_available
            }
        }
    except Exception as e:
        logger.error("Failed to register delivery partner: %s", str(e), exc_info=True)
        return {
            "status": "error", 
            "message": f"Failed to register delivery partner: {str(e)}"
        }


@router.post("/add")
async def add_delivery_person(
    name: str = Form(...),
    email: str = Form(...),
    mobile: str = Form(...),
    vehicle: str = Form(default="Bike"),
    password: str = Form(...),
    address: str = Form(default="N/A"),
    delivery_person_profile: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    """Alias for /register endpoint"""
    return await register_delivery_partner(
        name, email, mobile, password, address, vehicle, 
        delivery_person_profile, session
    )


@router.post("/login")
async def delivery_login(
    email: str = Form(...),
    password: str = Form(...),
    session: Session = Depends(get_session)
):
    logger.info("Delivery login attempt: %s", email)

    try:
        # Verify delivery partner credentials
        is_valid, partner = verify_delivery_partner(session, email, password)

        if is_valid:
            logger.info("Delivery login successful: %s", email)
            return {
                "status": "success",
                "message": "Login successful",
                "delivery_partner": {
                    "id": partner.id,
                    "name": partner.name,
                    "email": partner.email,
                    "mobile": partner.mobile,
                    "vehicle": partner.vehicle,
                    "address": partner.address,
                    "profile_picture": partner.delivery_person_profile,
                    "is_available": partner.is_available
                }
            }
        else:
            logger.warning("Invalid delivery login for %s", email)
            return {
                "status": "error",
                "message": "Invalid email or password"
            }
    except Exception as e:
        logger.error("Login error: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Login failed"}


@router.get("/")
async def get_all_delivery_persons(session: Session = Depends(get_session)):
    logger.info("Fetching all delivery persons")
    try:
        partners = get_all_delivery_partners(session)

        if not partners:
            return {
                "status": "success",
                "delivery_persons": [],
                "message": "No delivery persons available"
            }

        # Format response
        delivery_persons_list = [
            {
                "id": partner.id,
                "name": partner.name,
                "email": partner.email,
                "mobile": partner.mobile,
                "vehicle": partner.vehicle,
                "address": partner.address,
                "profile_picture": partner.delivery_person_profile,
                "is_available": partner.is_available,
                "created_at": partner.created_at.isoformat() if hasattr(partner, 'created_at') else None
            }
            for partner in partners
        ]

        return {
            "status": "success",
            "count": len(delivery_persons_list),
            "delivery_persons": delivery_persons_list
        }

    except Exception as e:
        logger.error("Failed to fetch delivery persons: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal server error"}


@router.get("/{partner_id}")
async def get_delivery_person(
    partner_id: int,
    session: Session = Depends(get_session)
):
    logger.info("Fetching delivery person: %s", partner_id)
    try:
        partner = get_delivery_partner(session, partner_id)

        if not partner:
            return {
                "status": "error",
                "message": "Delivery partner not found"
            }

        return {
            "status": "success",
            "delivery_partner": {
                "id": partner.id,
                "name": partner.name,
                "email": partner.email,
                "mobile": partner.mobile,
                "vehicle": partner.vehicle,
                "address": partner.address,
                "profile_picture": partner.delivery_person_profile,
                "is_available": partner.is_available
            }
        }

    except Exception as e:
        logger.error("Failed to fetch delivery person: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal server error"}