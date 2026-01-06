from fastapi import APIRouter, Form, Depends
from datetime import time
from sqlmodel import select, Session
from database.models import Category
from database.database import get_session
from logger_config import get_logger

router = APIRouter(prefix="/category", tags=["Category"])
logger = get_logger("CategoryAPI")


@router.post("/{restaurant_id}/categories/add")
def add_category_timing(
    restaurant_id: int,
    name: str = Form(...),
    start_time: str = Form(...),  # "07:00" or "11:00"
    end_time: str = Form(...),     # "15:00" or "23:00"
    session: Session = Depends(get_session)
):
    """Add a new category with timing for a restaurant"""
    logger.info("Add category timing: %s for restaurant %s", name, restaurant_id)

    try:
        # Parse time strings to time objects
        # Handle formats like "11:00", "11", "11:30"
        if ":" not in start_time:
            start_time = f"{start_time}:00"
        if ":" not in end_time:
            end_time = f"{end_time}:00"
        
        logger.info(f"Parsed times - Start: {start_time}, End: {end_time}")
            
        start_time_obj = time.fromisoformat(start_time)
        end_time_obj = time.fromisoformat(end_time)
        
        logger.info(f"Time objects created - Start: {start_time_obj}, End: {end_time_obj}")

        # Check if category name already exists for this restaurant
        existing = session.exec(
            select(Category).where(
                Category.restaurant_id == restaurant_id,
                Category.name == name.lower()
            )
        ).first()
        
        if existing:
            return {
                "status": "error",
                "message": f"Category '{name}' already exists for this restaurant"
            }

        # Create category
        category = Category(
            name=name.lower(),
            start_time=start_time_obj,
            end_time=end_time_obj,
            restaurant_id=restaurant_id
        )

        session.add(category)
        session.commit()
        session.refresh(category)

        return {
            "status": "success",
            "message": "Category timing added",
            "category": {
                "id": category.id,
                "name": category.name,
                "start_time": str(category.start_time),
                "end_time": str(category.end_time)
            }
        }

    except ValueError as ve:
        logger.error("Invalid time format: %s", str(ve), exc_info=True)
        return {
            "status": "error", 
            "message": f"Invalid time format. Use HH:MM format (e.g., 11:00, 15:30)"
        }
    except Exception as e:
        logger.error("Add category timing failed: %s", str(e), exc_info=True)
        session.rollback()
        return {"status": "error", "message": f"Internal error: {str(e)}"}


@router.put("/categories/{category_id}/update")
def update_category_timing(
    category_id: int,
    name: str = Form(None),
    start_time: str = Form(None),
    end_time: str = Form(None),
    session: Session = Depends(get_session)
):
    """Update category timing"""
    logger.info("Update category timing ID %s", category_id)

    try:
        category = session.get(Category, category_id)

        if not category:
            return {"status": "error", "message": "Category not found"}

        # Update name if provided
        if name is not None:
            category.name = name.lower()

        # Update times if provided
        if start_time is not None:
            if ":" not in start_time:
                start_time = f"{start_time}:00"
            category.start_time = time.fromisoformat(start_time)

        if end_time is not None:
            if ":" not in end_time:
                end_time = f"{end_time}:00"
            category.end_time = time.fromisoformat(end_time)

        session.add(category)
        session.commit()
        session.refresh(category)

        return {
            "status": "success",
            "message": "Category timing updated",
            "category": {
                "id": category.id,
                "name": category.name,
                "start_time": str(category.start_time),
                "end_time": str(category.end_time)
            }
        }

    except ValueError as ve:
        logger.error("Invalid time format: %s", str(ve), exc_info=True)
        return {
            "status": "error", 
            "message": "Invalid time format. Use HH:MM format (e.g., 11:00, 15:30)"
        }
    except Exception as e:
        logger.error("Update category timing failed: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    session: Session = Depends(get_session)
):
    """Delete a category"""
    logger.info("Delete category ID %s", category_id)

    try:
        category = session.get(Category, category_id)

        if not category:
            return {"status": "error", "message": "Category not found"}

        session.delete(category)
        session.commit()

        return {
            "status": "success",
            "message": "Category deleted successfully"
        }

    except Exception as e:
        logger.error("Delete category failed: %s", str(e), exc_info=True)
        session.rollback()
        return {"status": "error", "message": "Failed to delete category"}


@router.get("/{restaurant_id}/categories")
def get_category_timings(
    restaurant_id: int,
    session: Session = Depends(get_session)
):
    """Get all category timings for a restaurant"""
    logger.info("Fetch category timings for restaurant %s", restaurant_id)

    try:
        categories = session.exec(
            select(Category).where(Category.restaurant_id == restaurant_id)
        ).all()

        return {
            "status": "success",
            "categories": [
                {
                    "id": c.id,
                    "name": c.name,
                    "start_time": str(c.start_time),
                    "end_time": str(c.end_time)
                }
                for c in categories
            ]
        }

    except Exception as e:
        logger.error("Fetch category timings failed: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}


@router.get("/categories/{category_id}")
def get_single_category(
    category_id: int,
    session: Session = Depends(get_session)
):
    """Get details of a specific category"""
    logger.info("Fetch category ID %s", category_id)

    try:
        category = session.get(Category, category_id)

        if not category:
            return {"status": "error", "message": "Category not found"}

        return {
            "status": "success",
            "category": {
                "id": category.id,
                "name": category.name,
                "start_time": str(category.start_time),
                "end_time": str(category.end_time),
                "restaurant_id": category.restaurant_id
            }
        }

    except Exception as e:
        logger.error("Fetch category failed: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}