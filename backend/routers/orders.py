from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from database.models import Order, OrderItem, Menu, OrderStatus
from sqlmodel import Session,select
from typing import List, Optional
import json
import os
import shutil
from sqlalchemy.orm import selectinload

from database.database import get_session
from database.models import Order, OrderItem

router = APIRouter(prefix="/orders", tags=["Orders"])


# Database imports
from database.database import get_session
from database.models import Order, OrderStatus
from crud.orders_crud import (
    create_order as db_create_order,
    get_order_with_details,
    get_user_orders as db_get_user_orders,
    update_order_status,
    generate_order_bill
)
from crud.delivery_crud import assign_delivery_partner
from logger_config import get_logger

router = APIRouter(prefix="/orders", tags=["Orders"])
logger = get_logger("OrdersAPI")

UPLOAD_DIRECTORY = "uploads/orders"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

@router.post("/create")
def create_order(
    user_id: int = Form(...),
    restaurant_id: int = Form(...),
    items: str = Form(...),  # JSON string: '[{"menu_id": 1, "quantity": 2}]'
    attachment: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    """Requirement: Create order and save payment attachment"""
    try:
        items_data = json.loads(items)
        
        # Handle attachment
        file_path = None
        if attachment:
            file_path = os.path.join(UPLOAD_DIRECTORY, f"u{user_id}_r{restaurant_id}_{attachment.filename}")
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(attachment.file, buffer)

        # Call your CRUD function
        order = db_create_order(
            session=session,
            user_id=user_id,
            restaurant_id=restaurant_id,
            items=items_data,
            payment_image=file_path
        )

        if not order:
            return {"status": "error", "message": "Order creation failed. Check item availability or IDs."}

        return {"status": "success", "order_id": order.id, "total_amount": order.total_amount}

    except Exception as e:
        logger.error(f"Order creation failed: {str(e)}")
        return {"status": "error", "message": "Internal server error"}

@router.get("/user/{user_id}/orders")
def get_user_orders(
    user_id: int,
    session: Session = Depends(get_session)
):
    BASE_URL = "http://127.0.0.1:8000"

    stmt = (
        select(Order)
        .where(Order.user_id == user_id)
        .options(
            selectinload(Order.restaurant),
            selectinload(Order.items).selectinload(OrderItem.menu)
        )
        .order_by(Order.created_at.desc())
    )

    orders = session.exec(stmt).all()

    response = []
    for o in orders:

    # ✅ ORDER IMAGE
        order_image = None
        if o.items and o.items[0].menu and o.items[0].menu.menu_item_pic:
            order_image = f"{BASE_URL}/{o.items[0].menu.menu_item_pic}"

        response.append({
            "order_id": o.id,
            "status": o.status,
            "total_amount": o.total_amount,

            "created_at": o.created_at.isoformat(),
            "date": o.created_at.isoformat(),

            "order_image": order_image,

            "restaurant": {
                "id": o.restaurant.id,
                "name": o.restaurant.name,
                "address": o.restaurant.address
            },

            "items": [
                {
                    "menu_id": item.menu.id,
                    "menu_item_name": item.menu.name,
                    "quantity": item.quantity,
                    "menu_item_pic": (
                        f"{BASE_URL}/{item.menu.menu_item_pic}"
                        if item.menu.menu_item_pic
                        else None
                    )
                }
                for item in o.items
            ]
        })


        



    return {
        "status": "success",
        "orders": response
    }


@router.get("/{order_id}/bill")
def get_bill(order_id: int, session: Session = Depends(get_session)):
    """Requirement: Generate detailed bill """
    
    bill_data = generate_order_bill(session, order_id)
    
    if not bill_data:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "status": "success",
        "bill": bill_data
    }

@router.get("/restaurant/{restaurant_id}")
def get_restaurant_orders(
    restaurant_id: int,
    session: Session = Depends(get_session)
):
    BASE_URL = "http://127.0.0.1:8000"

    stmt = (
        select(Order)
        .where(Order.restaurant_id == restaurant_id)
        .options(
            selectinload(Order.user),
            selectinload(Order.items).selectinload(OrderItem.menu)
        )
        .order_by(Order.created_at.desc())
    )

    orders = session.exec(stmt).all()

    formatted_orders = []
    for o in orders:

    # ✅ ORDER IMAGE
        order_image = None
        if o.items and o.items[0].menu and o.items[0].menu.menu_item_pic:
            order_image = f"{BASE_URL}/{o.items[0].menu.menu_item_pic}"

        formatted_orders.append({
            "order_id": o.id,
            "status": o.status,
            "total_amount": o.total_amount,

            "created_at": o.created_at.isoformat(),
            "date": o.created_at.isoformat(),   # ✅ ADDED

            "order_image": order_image,         # ✅ ADDED

            "user": {
                "id": o.user_id,
                "name": o.user.name if o.user else "Guest"
            },

            "items": [
                {
                    "menu_id": item.menu.id,
                    "menu_item_name": item.menu.name,
                    "quantity": item.quantity,
                    "menu_item_pic": (
                        f"{BASE_URL}/{item.menu.menu_item_pic}"
                        if item.menu.menu_item_pic
                        else None
                    )
                }
                for item in o.items
            ]
        })

    return {"status": "success", "orders": formatted_orders}


@router.put("/{order_id}/status")
def update_status(order_id: int, status: str, session: Session = Depends(get_session)):
    """Updates order status: PLACED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED"""
    order = update_order_status(session, order_id, status.upper())
    if not order:
        return {"status": "error", "message": "Order not found"}
    return {"status": "success", "new_status": order.status}

@router.post("/{order_id}/assign/{partner_id}")
def assign_partner(order_id: int, partner_id: int, session: Session = Depends(get_session)):
    """Requirement: Assign delivery partner and update status"""
    order = assign_delivery_partner(session, order_id, partner_id)
    if not order:
        return {"status": "error", "message": "Assignment failed. Partner might be unavailable."}
    return {"status": "success", "delivery_partner": order.delivery_partner.name}