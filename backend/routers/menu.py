from fastapi import APIRouter, Form, File, UploadFile, Depends,Query
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime
import os

from database.models import Menu, Category,Restaurant  # Using your existing models
from database.database import get_session
from logger_config import get_logger
from crud.menu_crud import search_dashboard_menu

router = APIRouter(prefix="/menu", tags=["Menu"])
logger = get_logger("MenuAPI")

MENU_UPLOAD_DIR = "uploads/menu_items"
os.makedirs(MENU_UPLOAD_DIR, exist_ok=True)

@router.post("/{restaurant_id}/add")
def add_menu_item(
    restaurant_id: int,
    item_name: str = Form(...),
    price: float = Form(...),
    category_id: int = Form(...),
    is_available: bool = Form(True),
    menu_item_pic: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    """Add a new menu item to a restaurant under a specific category"""
    logger.info("Adding menu item '%s' to restaurant %d", item_name, restaurant_id)

    try:
        # Verify category exists and belongs to restaurant
        category = session.get(Category, category_id)
        if not category or category.restaurant_id != restaurant_id:
            return {"status": "error", "message": "Invalid category for this restaurant"}

        # Handle image upload
        pic_path = None
        if menu_item_pic:
            pic_path = f"{MENU_UPLOAD_DIR}/{restaurant_id}_{category_id}_{menu_item_pic.filename}"
            with open(pic_path, "wb") as f:
                f.write(menu_item_pic.file.read())

        # Create menu item using your Menu model
        menu_item = Menu(
            name=item_name,
            price=price,
            category_id=category_id,
            restaurant_id=restaurant_id,
            is_available=is_available,
            menu_item_pic=pic_path
        )

        session.add(menu_item)
        session.commit()
        session.refresh(menu_item)

        return {
            "status": "success",
            "message": "Menu item added successfully",
            "menu_item": {
                "id": menu_item.id,
                "name": menu_item.name,
                "price": menu_item.price,
                "category_id": menu_item.category_id,
                "is_available": menu_item.is_available
            }
        }

    except Exception as e:
        logger.error("Add menu item failed: %s", str(e), exc_info=True)
        session.rollback()
        return {"status": "error", "message": "Failed to add menu item"}


@router.put("/{menu_item_id}/update")
def update_menu_item(
    menu_item_id: int,
    item_name: str = Form(None),
    price: float = Form(None),
    is_available: bool = Form(None),
    menu_item_pic: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    """Update an existing menu item"""
    logger.info("Updating menu item ID %d", menu_item_id)

    try:
        menu_item = session.get(Menu, menu_item_id)
        
        if not menu_item:
            return {"status": "error", "message": "Menu item not found"}

        # Update fields if provided
        if item_name is not None:
            menu_item.name = item_name
        if price is not None:
            menu_item.price = price
        if is_available is not None:
            menu_item.is_available = is_available

        # Handle image update
        if menu_item_pic:
            pic_path = f"{MENU_UPLOAD_DIR}/{menu_item.restaurant_id}_{menu_item.category_id}_{menu_item_pic.filename}"
            with open(pic_path, "wb") as f:
                f.write(menu_item_pic.file.read())
            menu_item.menu_item_pic = pic_path

        session.add(menu_item)
        session.commit()
        session.refresh(menu_item)

        return {
<<<<<<< HEAD
            "status": "success",
            "message": "Menu item updated successfully",
            "menu_item": {
                "id": menu_item.id,
                "name": menu_item.name,
                "price": menu_item.price,
                "is_available": menu_item.is_available
            }
        }
=======
    "status": "success",
    "message": "Menu item added successfully",
    "menu_item": {
        "id": menu_item.id,
        "name": menu_item.name,
        "price": menu_item.price,
        "category_id": menu_item.category_id,
        "is_available": menu_item.is_available,
        "menu_item_pic": menu_item.menu_item_pic
    }
}
>>>>>>> c0b78f9c726451a1391062785d87c687e6ef1e0b

    except Exception as e:
        logger.error("Update menu item failed: %s", str(e), exc_info=True)
        session.rollback()
        return {"status": "error", "message": "Failed to update menu item"}


@router.delete("/{menu_item_id}")
def delete_menu_item(
    menu_item_id: int,
    session: Session = Depends(get_session)
):
    """Delete a menu item"""
    logger.info("Deleting menu item ID %d", menu_item_id)

    try:
        menu_item = session.get(Menu, menu_item_id)
        
        if not menu_item:
            return {"status": "error", "message": "Menu item not found"}

        # Delete image file if exists
        if menu_item.menu_item_pic and os.path.exists(menu_item.menu_item_pic):
            os.remove(menu_item.menu_item_pic)

        session.delete(menu_item)
        session.commit()

        return {
            "status": "success",
            "message": "Menu item deleted successfully"
        }

    except Exception as e:
        logger.error("Delete menu item failed: %s", str(e), exc_info=True)
        session.rollback()
        return {"status": "error", "message": "Failed to delete menu item"}


@router.get("/{restaurant_id}")
def get_restaurant_menu(
    restaurant_id: int,
    category_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """Get all menu items for a restaurant, optionally filtered by category"""
    logger.info("Fetching menu for restaurant %d", restaurant_id)

    try:
        # Build query
        query = select(Menu).where(Menu.restaurant_id == restaurant_id)
        
        if category_id:
            query = query.where(Menu.category_id == category_id)

        menu_items = session.exec(query).all()

        # Get categories for this restaurant
        categories = session.exec(
            select(Category).where(Category.restaurant_id == restaurant_id)
        ).all()

        # Organize menu items by category
        menu_by_category = {}
        for category in categories:
            category_items = [
                {
<<<<<<< HEAD
                    "id": item.id,
                    "name": item.name,
                    "price": item.price,
                    "is_available": item.is_available,
                    "menu_item_pic": item.menu_item_pic
                }
=======
            "id": item.id,
            "name": item.name,
            "price": item.price,
            "is_available": item.is_available,
            "menu_item_pic": item.menu_item_pic
        }
>>>>>>> c0b78f9c726451a1391062785d87c687e6ef1e0b
                for item in menu_items if item.category_id == category.id
            ]
            
            if category_items:  # Only include categories with items
                menu_by_category[category.name] = {
                    "category_id": category.id,
                    "start_time": str(category.start_time) if category.start_time else None,
                    "end_time": str(category.end_time) if category.end_time else None,
                    "items": category_items
                }

        return {
            "status": "success",
            "restaurant_id": restaurant_id,
            "menu": menu_by_category
        }

    except Exception as e:
        logger.error("Get menu failed: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Failed to fetch menu"}


@router.get("/item/{menu_item_id}")
def get_menu_item(
    menu_item_id: int,
    session: Session = Depends(get_session)
):
    """Get details of a specific menu item"""
    logger.info("Fetching menu item ID %d", menu_item_id)

    try:
        menu_item = session.get(Menu, menu_item_id)
        
        if not menu_item:
            return {"status": "error", "message": "Menu item not found"}

        # Get category info
        category = session.get(Category, menu_item.category_id)

        return {
            "status": "success",
            "menu_item": {
                "id": menu_item.id,
                "name": menu_item.name,
                "price": menu_item.price,
                "is_available": menu_item.is_available,
                "menu_item_pic": menu_item.menu_item_pic,
<<<<<<< HEAD
=======

>>>>>>> c0b78f9c726451a1391062785d87c687e6ef1e0b
                "category": {
                    "id": category.id,
                    "name": category.name,
                    "start_time": str(category.start_time) if category.start_time else None,
                    "end_time": str(category.end_time) if category.end_time else None
                } if category else None,
                "restaurant_id": menu_item.restaurant_id
            }
        }

    except Exception as e:
        logger.error("Get menu item failed: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Failed to fetch menu item"}


@router.patch("/{menu_item_id}/availability")
def toggle_availability(
    menu_item_id: int,
    is_available: bool = Form(...),
    session: Session = Depends(get_session)
):
    """Toggle menu item availability (for when items are out of stock)"""
    logger.info("Toggling availability for menu item ID %d", menu_item_id)

    try:
        menu_item = session.get(Menu, menu_item_id)
        
        if not menu_item:
            return {"status": "error", "message": "Menu item not found"}

        menu_item.is_available = is_available
        session.add(menu_item)
        session.commit()

        return {
            "status": "success",
            "message": f"Menu item {'enabled' if is_available else 'disabled'}",
            "is_available": is_available
        }

    except Exception as e:
        logger.error("Toggle availability failed: %s", str(e), exc_info=True)
        session.rollback()
        return {"status": "error", "message": "Failed to update availability"}


@router.get("/{restaurant_id}/category/{category_id}/items")
def get_items_by_category(
    restaurant_id: int,
    category_id: int,
    session: Session = Depends(get_session)
):
    """Get all menu items for a specific category (for dropdown functionality)"""
    logger.info("Fetching items for restaurant %d, category %d", restaurant_id, category_id)

    try:
        # Verify category belongs to restaurant
        category = session.get(Category, category_id)
        if not category or category.restaurant_id != restaurant_id:
            return {"status": "error", "message": "Invalid category for this restaurant"}

        # Get menu items
        items = session.exec(
            select(Menu).where(
                Menu.restaurant_id == restaurant_id,
                Menu.category_id == category_id
            )
        ).all()

        return {
            "status": "success",
            "category": {
                "id": category.id,
                "name": category.name,
                "start_time": str(category.start_time) if category.start_time else None,
                "end_time": str(category.end_time) if category.end_time else None
            },
            "items": [
                {
                    "id": item.id,
                    "name": item.name,
                    "price": item.price,
                    "is_available": item.is_available,
                    "menu_item_pic": item.menu_item_pic
                }
                for item in items
            ]
        }

    except Exception as e:
        logger.error("Get items by category failed: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Failed to fetch category items"}
    
@router.get("/dashboard/search")
def search_item_restaurant(
    word_search: str | None = Query(default=None),
    session: Session = Depends(get_session)
):
    logger.info(f"Dashboard search keyword: {word_search}")


    if not word_search:
        restaurants = session.exec(select(Restaurant)).all()

        restaurant_response = []
        for r in restaurants:
            restaurant_response.append({
                "restaurant_id": r.id,
                "name": r.name,
                "address": r.address,
                "restaurant_pic": r.restaurant_pic
            })

        return {
            "status": "success",
            "search": None,
            "restaurants": restaurant_response,
            "menu_items": [],
            "restaurant_count": len(restaurant_response),
            "menu_item_count": 0
        }


    restaurants = session.exec(
        select(Restaurant).where(
            Restaurant.name.ilike(f"%{word_search}%")
        )
    ).all()

    restaurant_response = []
    for r in restaurants:
        restaurant_response.append({
            "restaurant_id": r.id,
            "name": r.name,
            "address": r.address,
            "restaurant_pic": r.restaurant_pic
        })

    menus = search_dashboard_menu(session, word_search)

    menu_response = []
    for item in menus:
        menu_response.append({
            "menu_id": item.id,
            "name": item.name,
            "price": item.price,
            "is_available": item.is_available,
            "menu_item_pic": item.menu_item_pic,
<<<<<<< HEAD
=======

>>>>>>> c0b78f9c726451a1391062785d87c687e6ef1e0b
            "restaurant": {
                "id": item.restaurant.id,
                "name": item.restaurant.name,
                "address": item.restaurant.address
            },
            "category": {
                "id": item.category.id,
                "name": item.category.name,
                "start_time": str(item.category.start_time),
                "end_time": str(item.category.end_time)
            }
        })

    return {
        "status": "success",
        "search": word_search,
        "restaurants": restaurant_response,
        "menu_items": menu_response,
        "restaurant_count": len(restaurant_response),
        "menu_item_count": len(menu_response)
    }
