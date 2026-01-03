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

def normalize_section(section: str) -> str:
    return section.lower().replace(" ", "_")


def is_item_available_now(section_name: str, section_timings: dict) -> bool:
    normalized_timings = {
        normalize_section(key): value
        for key, value in section_timings.items()
    }

    if section_name not in normalized_timings:
        logger.info("Section %s missing in timings", section_name)
        return False

    ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    current_time = ist_now.time()

    start_time = datetime.strptime(
        normalized_timings[section_name]["start"], "%H:%M"
    ).time()

    end_time = datetime.strptime(
        normalized_timings[section_name]["end"], "%H:%M"
    ).time()

    logger.info(
        "Availability check | section=%s | now=%s | start=%s | end=%s",
        section_name, current_time, start_time, end_time
    )

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
        users_list = read_json(USERS_FILE)
        restaurants_list = read_json(RESTAURANTS_FILE)
        delivery_persons_list = read_json(DELIVERY_PERSONS_FILE)
        orders_list = read_json(ORDERS_FILE)

        if not any(user["id"] == user_id for user in users_list):
            return {"status": "error", "message": "User not found"}

        try:
            items_list = json.loads(items)
            validated_items: List[OrderItem] = [OrderItem(**item) for item in items_list]
        except Exception:
            return {"status": "error", "message": "Invalid items format"}

        ordered_items = []
        subtotal_amount = 0

        for order_item in validated_items:
            selected_restaurant = next(
                (r for r in restaurants_list
                 if r["name"].lower() == order_item.restaurant_name.lower()),
                None
            )

            if not selected_restaurant:
                return {
                    "status": "error",
                    "message": f"Restaurant {order_item.restaurant_name} not found"
                }

            item_found = False

            for raw_section, menu_items in selected_restaurant["menu"].items():
                section_name = normalize_section(raw_section)

                for menu_item in menu_items:
                    if menu_item["name"].lower() == order_item.item_name.lower():

                        if not is_item_available_now(
                            section_name,
                            selected_restaurant.get("section_timings", {})
                        ):
                            return {
                                "status": "error",
                                "message": f"{order_item.item_name} is not available now"
                            }

                        item_total = menu_item["price"] * order_item.quantity
                        subtotal_amount += item_total

                        ordered_items.append({
                            "restaurant_name": selected_restaurant["name"],
                            "section": section_name,
                            "item_name": menu_item["name"],
                            "price": menu_item["price"],
                            "quantity": order_item.quantity,
                            "item_total": item_total
                        })

                        item_found = True
                        break

                if item_found:
                    break

            if not item_found:
                return {
                    "status": "error",
                    "message": f"{order_item.item_name} not found in {order_item.restaurant_name}"
                }

        gst_amount = (subtotal_amount * GST_PERCENTAGE) / 100
        final_amount = subtotal_amount + gst_amount + DELIVERY_CHARGE
        assigned_delivery_person = random.choice(delivery_persons_list)

        uploaded_file_details = None
        if attachment:
            saved_file_path = os.path.join(
                UPLOAD_DIRECTORY,
                f"{len(orders_list) + 1}_{attachment.filename}"
            )
            with open(saved_file_path, "wb") as buffer:
                shutil.copyfileobj(attachment.file, buffer)

            uploaded_file_details = {
                "file_name": attachment.filename,
                "file_path": saved_file_path,
                "content_type": attachment.content_type
            }

        new_order = {
            "order_id": len(orders_list) + 1,
            "user_id": user_id,
            "items": ordered_items,
            "subtotal": subtotal_amount,
            "gst_percent": GST_PERCENTAGE,
            "gst_amount": gst_amount,
            "delivery_fee": DELIVERY_CHARGE,
            "total_price": final_amount,
            "status": OrderStatus.placed.value,
            "placed_time": get_current_time(),
            "preparing_time": None,
            "pick_up_time": None,
            "delivered_time": None,
            "delivery_person": assigned_delivery_person,
            "attachment": uploaded_file_details
        }

        orders_list.append(new_order)
        write_json(ORDERS_FILE, orders_list)

        logger.info("Order created successfully: %s", new_order["order_id"])
        return {"status": "success", "order": new_order}

    except Exception as exception:
        logger.error("Order creation failed: %s", str(exception), exc_info=True)
        return {"status": "error", "message": "Internal server error"}


@router.put("/{order_id}/status")
def update_order_status(order_id: int, new_status: OrderStatus):
    orders_list = read_json(ORDERS_FILE)

    for order in orders_list:
        if order["order_id"] == order_id:

            current_status = order["status"]

            valid_flow = {
                OrderStatus.placed.value: OrderStatus.preparing.value,
                OrderStatus.preparing.value: OrderStatus.pick_up.value,
                OrderStatus.pick_up.value: OrderStatus.delivered.value
            }

            if current_status not in valid_flow:
                return {"status": "error", "message": "Invalid current order status"}

            if valid_flow[current_status] != new_status.value:
                return {
                    "status": "error",
                    "message": f"Only {current_status} → {valid_flow[current_status]} allowed"
                }

            current_time = get_current_time()

            if new_status == OrderStatus.preparing:
                order["preparing_time"] = current_time
            elif new_status == OrderStatus.pick_up:
                order["pick_up_time"] = current_time
            elif new_status == OrderStatus.delivered:
                order["delivered_time"] = current_time

            order["status"] = new_status.value
            write_json(ORDERS_FILE, orders_list)

            return {"status": "success", "order": order}

    return {"status": "error", "message": "Order not found"}


@router.get("/")
def get_all_orders():
    return {"status": "success", "orders": read_json(ORDERS_FILE)}


@router.get("/{order_id}")
def get_single_order(order_id: int):
    orders_list = read_json(ORDERS_FILE)
    for order in orders_list:
        if order["order_id"] == order_id:
            return {"status": "success", "order": order}
    return {"status": "error", "message": "Order not found"}
