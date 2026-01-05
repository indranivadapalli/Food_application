from typing import Optional
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database.models import DeliveryPartner, Order, User, Restaurant
from crud.orders_crud import update_order_status

def check_delivery_partner_exists(session: Session, email: str) -> bool:
    try:
        statement = select(DeliveryPartner).where(DeliveryPartner.email == email)
        result = session.exec(statement).first()
        return result is not None
    except Exception as e:
        print(f"Error checking delivery partner: {e}")
        return False

def create_delivery_partner(session: Session, data: dict) -> DeliveryPartner:
    """Create a new delivery partner"""
    partner = DeliveryPartner(
        name=data["name"],
        email=data["email"],
        mobile=data["mobile"],
        password=data["password"],
        address=data.get("address", ""),
        vehicle=data.get("vehicle", ""),
        delivery_person_profile=data.get("profile_picture"),  
        is_available=True
    )
    session.add(partner)
    session.commit()
    session.refresh(partner)
    return partner

def get_delivery_partner(session: Session, partner_id: int) -> Optional[DeliveryPartner]:
    """Get delivery partner by ID"""
    return session.get(DeliveryPartner, partner_id)

def verify_delivery_partner(session: Session, email: str, password: str):
    """Verify delivery partner credentials"""
    try:
        partner = session.exec(
            select(DeliveryPartner).where(
                DeliveryPartner.email == email, 
                DeliveryPartner.password == password
            )
        ).first()
        
        if not partner:
            return False, {}
        return True, partner
    except Exception as e:
        print(f"Error verifying delivery partner: {e}")
        return False, {}

def update_delivery_partner(session: Session, partner_id: int, data: dict) -> Optional[DeliveryPartner]:
    """Update delivery partner information"""
    partner = session.get(DeliveryPartner, partner_id)
    if not partner:
        return None

    for key, value in data.items():
        if hasattr(partner, key):
            setattr(partner, key, value)

    session.commit()
    session.refresh(partner)
    return partner

def delete_delivery_partner(session: Session, partner_id: int) -> bool:
    """Delete delivery partner"""
    partner = session.get(DeliveryPartner, partner_id)
    if not partner:
        return False

    session.delete(partner)
    session.commit()
    return True

def assign_delivery_partner(
    session: Session,
    order_id: int,
    partner_id: int
) -> Optional[Order]:
    """Assign delivery partner to an order"""
    order = session.get(Order, order_id)
    partner = session.get(DeliveryPartner, partner_id)

    if not order or not partner or not partner.is_available:
        return None

    order.delivery_partner_id = partner.id
    order.status = "OUT_FOR_DELIVERY"
    partner.is_available = False

    session.commit()
    session.refresh(order)
    return order

def get_partner_orders(session: Session, partner_id: int):
    """Get all orders assigned to a delivery partner"""
    stmt = (
        select(DeliveryPartner)
        .where(DeliveryPartner.id == partner_id)
        .options(selectinload(DeliveryPartner.orders))
    )
    return session.exec(stmt).first()

def mark_delivered(session: Session, order_id: int) -> Optional[Order]:
    """Mark order as delivered and make partner available"""
    order = update_order_status(session, order_id, "DELIVERED")

    if order and order.delivery_partner:
        order.delivery_partner.is_available = True
        session.commit()
        session.refresh(order.delivery_partner)

    return order

def get_all_delivery_partners(session: Session):
    """Get all delivery partners"""
    return session.exec(select(DeliveryPartner)).all()

def get_available_partners(session: Session):
    """Get all available delivery partners"""
    stmt = select(DeliveryPartner).where(DeliveryPartner.is_available == True)
    return session.exec(stmt).all()