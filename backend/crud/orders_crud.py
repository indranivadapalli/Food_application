from sqlmodel import Session, select
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional
from database.models import Order, OrderItem, Menu, User, Restaurant,OrderStatus

def create_order(session, user_id, restaurant_id, items, payment_image=None):
    total_amount = 0

    order = Order(
        user_id=user_id,
        restaurant_id=restaurant_id,
        status=OrderStatus.PLACED,
        total_amount=0,
        payment_image=payment_image
    )

    session.add(order)
    session.flush()  # ensures order.id exists

    for item in items:
        menu = session.get(Menu, item["menu_id"])
        if not menu:
            session.rollback()
            return None

        if not menu.is_available:
            session.rollback()
            return None

        quantity = int(item["quantity"])
        item_total = menu.price * quantity
        total_amount += item_total

        order_item = OrderItem(
            order_id=order.id,
            menu_id=menu.id,
            quantity=quantity,
            price=menu.price
        )
        session.add(order_item)

    order.total_amount = total_amount

    session.commit()
    session.refresh(order)
    return order

def get_order_with_details(session: Session, order_id: int):
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(
            joinedload(Order.user),
            joinedload(Order.restaurant),
            selectinload(Order.items).joinedload(OrderItem.menu),
            joinedload(Order.delivery_partner)
        )
    )
    return session.exec(stmt).first()


def get_user_orders(session: Session, user_id: int):
    stmt = (
        select(Order)
        .where(Order.user_id == user_id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    return session.exec(stmt).all()

def get_all_orders(session: Session):
    stmt = (
        select(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.restaurant),
            joinedload(Order.delivery_partner),
            selectinload(Order.items).joinedload(OrderItem.menu)
        )
    )
    return session.exec(stmt).all()

def delete_order(session: Session, order_id: int):
    order = session.get(Order, order_id)
    if not order:
        return False

    session.delete(order)
    session.commit()
    return True

def update_order_status(session: Session, order_id: int, status: str):
    order = session.get(Order, order_id)
    if not order:
        return None
    order.status = status
    session.commit()
    session.refresh(order)
    return order


def start_preparing(session: Session, order_id: int):
    return update_order_status(session, order_id, "PREPARING")


def mark_out_for_delivery(session: Session, order_id: int):
    return update_order_status(session, order_id, "OUT_FOR_DELIVERY")


def complete_order(session: Session, order_id: int):
    return update_order_status(session, order_id, "DELIVERED")


def cancel_order(session: Session, order_id: int):
    order = session.get(Order, order_id)
    if not order:
        return None

    if order.status in ("PLACED", "PREPARING"):
        order.status = "CANCELLED"
        session.commit()
        return order
    return None

#order bill 
def generate_order_bill(session: Session, order_id: int):
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(
            joinedload(Order.user),
            joinedload(Order.restaurant),
            joinedload(Order.delivery_partner),
            selectinload(Order.items).joinedload(OrderItem.menu)
        )
    )

    order = session.exec(stmt).first()
    if not order:
        return None

    bill = {
        "order_id": order.id,
        "status": order.status,
        "created_at": order.created_at,
        "user": {
            "name": order.user.name,
            "email": order.user.email,
            "address": order.user.address
        },
        "restaurant": {
            "name": order.restaurant.name,
            "address": order.restaurant.address,
            "contact": order.restaurant.contact
        },
        "delivery_partner": (
            {
                "name": order.delivery_partner.name,
                "phone": order.delivery_partner.phone
            } if order.delivery_partner else None
        ),
        "items": [],
        "subtotal": order.total_amount,
        "gst_amount": order.gst_amount,
        "delivery_charge": order.delivery_charge,
        "final_payable_amount": order.final_amount
    }

    for item in order.items:
        bill["items"].append({
            "item_name": item.menu.name,
            "unit_price": item.price,
            "quantity": item.quantity,
            "item_total": item.price * item.quantity
        })

    return bill

