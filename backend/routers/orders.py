from fastapi import APIRouter, UploadFile, File, Form
from utils import read_json, write_json, get_current_time
from logger_config import get_logger
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel
import random
import os
import shutil
import json
from datetime import datetime, timedelta

router = APIRouter(prefix="/orders", tags=["Orders"])
logger = get_logger("OrdersAPI")

ORDERS_FILE = "orders.json"
USERS_FILE = "users.json"
RESTAURANTS_FILE = "restaurants.json"
DELIVERY_PERSONS_FILE = "delivery_persons.json"

GST_PERCENTAGE = 5
DELIVERY_CHARGE = 20

UPLOAD_DIRECTORY = "uploads/orders"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)


class OrderStatus(str, Enum):
    placed = "placed"
    preparing = "preparing"
    pick_up = "pick_up"
    delivered = "delivered"


class OrderItem(BaseModel):
    item_name: str
    restaurant_name: str
    quantity: int


def normalize_section(section_name: str) -> str:
    return section_name.lower().replace(" ", "_")


def is_item_available_now(section_name: str, section_timings: dict) -> bool:
    normalized_timings = {}

    for section, timing in section_timings.items():
        normalized_timings[normalize_section(section)] = timing

    if section_name not in normalized_timings:
        logger.info("Section %s missing in timings", section_name)
        return False

    ist_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
    current_time = ist_time.time()

    start_time = datetime.strptime(
        normalized_timings[section_name]["start"], "%H:%M"
    ).time()

    end_time = datetime.strptime(
        normalized_timings[section_name]["end"], "%H:%M"
    ).time()

    return start_time <= current_time <= end_time


@router.post("/create")
def create_order(
    user_id: int = Form(...),
    items: str = Form(
        default='[{"item_name":"Tiffin Special","restaurant_name":"Novotel","quantity":1}]'
    ),
    attachment: Optional[UploadFile] = File(None)
):
    try:
        users = read_json(USERS_FILE)
        restaurants = read_json(RESTAURANTS_FILE)
        delivery_persons = read_json(DELIVERY_PERSONS_FILE)
        orders = read_json(ORDERS_FILE)

        user_found = False
        for user in users:
            if user["id"] == user_id:
                user_found = True
                break

        if not user_found:
            return {"status": "error", "message": "User not found"}

        try:
            items_data = json.loads(items)
            validated_items: List[OrderItem] = [
                OrderItem(**item) for item in items_data
            ]
        except Exception:
            return {"status": "error", "message": "Invalid items format"}

        ordered_items = []
        subtotal_amount = 0

        for order_item in validated_items:
            restaurant_found = None

            for restaurant in restaurants:
                if restaurant["name"].lower() == order_item.restaurant_name.lower():
                    restaurant_found = restaurant
                    break

            if not restaurant_found:
                return {
                    "status": "error",
                    "message": f"Restaurant {order_item.restaurant_name} not found"
                }

            item_matched = False

            for section_key, menu_items in restaurant_found["menu"].items():
                normalized_section = normalize_section(section_key)

                for menu_item in menu_items:
                    if menu_item["name"].lower() == order_item.item_name.lower():

                        if not is_item_available_now(
                            normalized_section,
                            restaurant_found.get("section_timings", {})
                        ):
                            return {
                                "status": "error",
                                "message": f"{order_item.item_name} is not available now"
                            }

                        item_total = menu_item["price"] * order_item.quantity
                        subtotal_amount += item_total

                        ordered_items.append({
                            "restaurant_name": restaurant_found["name"],
                            "section": normalized_section,
                            "item_name": menu_item["name"],
                            "price": menu_item["price"],
                            "quantity": order_item.quantity,
                            "item_total": item_total
                        })

                        item_matched = True
                        break

                if item_matched:
                    break

            if not item_matched:
                return {
                    "status": "error",
                    "message": f"{order_item.item_name} not found in {order_item.restaurant_name}"
                }

        gst_amount = (subtotal_amount * GST_PERCENTAGE) / 100
        total_amount = subtotal_amount + gst_amount + DELIVERY_CHARGE

        assigned_delivery_person = random.choice(delivery_persons)

        attachment_details = None
        if attachment:
            saved_path = os.path.join(
                UPLOAD_DIRECTORY,
                f"{len(orders) + 1}_{attachment.filename}"
            )

            with open(saved_path, "wb") as buffer:
                shutil.copyfileobj(attachment.file, buffer)

            attachment_details = {
                "file_name": attachment.filename,
                "file_path": saved_path,
                "content_type": attachment.content_type
            }

        new_order = {
            "user_id": user_id,
            "items": ordered_items,
            "subtotal": subtotal_amount,
            "gst_percent": GST_PERCENTAGE,
            "gst_amount": gst_amount,
            "delivery_fee": DELIVERY_CHARGE,
            "total_price": total_amount,
            "status": OrderStatus.placed.value,
            "placed_time": get_current_time(),
            "preparing_time": None,
            "pick_up_time": None,
            "delivered_time": None,
            "delivery_person": assigned_delivery_person,
            "attachment": attachment_details
        }

        orders.append(new_order)
        write_json(ORDERS_FILE, orders)

        logger.info("Order created successfully: %s", new_order["order_id"])
        return {"status": "success", "order": new_order}

    except Exception as error:
        logger.error("Order creation failed: %s", str(error), exc_info=True)
        return {"status": "error", "message": "Internal server error"}


@router.put("/{order_id}/status")
def update_order_status(order_id: int, new_status: OrderStatus):
    orders = read_json(ORDERS_FILE)

    for order in orders:
        if order["order_id"] == order_id:
            current_status = order["status"]

            valid_status_flow = {
                OrderStatus.placed.value: OrderStatus.preparing.value,
                OrderStatus.preparing.value: OrderStatus.pick_up.value,
                OrderStatus.pick_up.value: OrderStatus.delivered.value
            }

            if current_status not in valid_status_flow:
                return {"status": "error", "message": "Invalid current order status"}

            if valid_status_flow[current_status] != new_status.value:
                return {
                    "status": "error",
                    "message": f"Only {current_status} → {valid_status_flow[current_status]} allowed"
                }

            current_time = get_current_time()

            if new_status == OrderStatus.preparing:
                order["preparing_time"] = current_time
            elif new_status == OrderStatus.pick_up:
                order["pick_up_time"] = current_time
            elif new_status == OrderStatus.delivered:
                order["delivered_time"] = current_time

            order["status"] = new_status.value
            write_json(ORDERS_FILE, orders)

            return {"status": "success", "order": order}

    return {"status": "error", "message": "Order not found"}


@router.get("/")
def get_all_orders():
    return {"status": "success", "orders": read_json(ORDERS_FILE)}


@router.get("/{order_id}")
def get_single_order(order_id: int):
    orders = read_json(ORDERS_FILE)

    for order in orders:
        if order["order_id"] == order_id:
            return {"status": "success", "order": order}

    return {"status": "error", "message": "Order not found"}
