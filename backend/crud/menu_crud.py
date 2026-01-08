from sqlmodel import Session, select
from typing import List, Optional
from database.models import Menu,Category, Restaurant
from datetime import datetime
from utils import get_current_ist_time
from sqlalchemy.orm import selectinload, joinedload

def create_menu_item(session: Session, data: dict) -> Menu:
    menu = Menu(
        name=data["name"],
        price=data["price"],
        restaurant_id=data["restaurant_id"],
        category_id=data["category_id"],
        menu_item_pic=data.get("menu_item_pic"),  
        is_available=data.get("is_available", True)
    )
    session.add(menu)
    session.commit()
    session.refresh(menu)
    return menu

def create_multiple_menu_items(
    session: Session,
    restaurant_id: int,
    items: List[dict]
) -> List[Menu]:
    menus = [
        Menu(
            restaurant_id=restaurant_id,
            name=item["name"],
            price=item["price"],
            is_available=item.get("is_available", True)
        )
        for item in items
    ]
    session.add_all(menus)
    session.commit()
    return menus
def get_restaurant_menu(
    session: Session,
    restaurant_id: int,
    available_only: bool = True
):
    stmt = select(Menu).where(Menu.restaurant_id == restaurant_id)
    if available_only:
        stmt = stmt.where(Menu.is_available == True)
    return session.exec(stmt).all()
def update_menu_item(
    session: Session,
    menu_id: int,
    name: Optional[str] = None,
    price: Optional[float] = None,
    is_available: Optional[bool] = None
):
    menu = session.get(Menu, menu_id)
    if not menu:
        return None

    if name is not None:
        menu.name = name
    if price is not None:
        menu.price = price
    if is_available is not None:
        menu.is_available = is_available

    session.commit()
    session.refresh(menu)
    return menu
def delete_menu_item(session: Session, menu_id: int) -> bool:
    menu = session.get(Menu, menu_id)
    if not menu:
        return False
    session.delete(menu)
    session.commit()
    return True
def is_category_available(category) -> bool:
    now = datetime.now().time()
    return category.start_time <= now <= category.end_time

def get_menu(session: Session, menu_id: int):
    return session.get(Menu, menu_id)

def get_menus_by_restaurant(session: Session, restaurant_id: int):
    stmt = (
        select(Menu)
        .where(Menu.restaurant_id == restaurant_id)
        .where(Menu.is_available == True)
    )
    return session.exec(stmt).all()


def update_menu(session: Session, menu_id: int, data: dict):
    menu = session.get(Menu, menu_id)
    if not menu:
        return None
    for key, value in data.items():
        setattr(menu, key, value)
    session.commit()
    session.refresh(menu)
    return menu
def delete_menu(session: Session, menu_id: int):
    menu = session.get(Menu, menu_id)
    if not menu:
        return False
    session.delete(menu)
    session.commit()
    return True
  
def search_dashboard_menu(
    session: Session,
    keyword: str,
    available_only: bool = True
):
    stmt = (
        select(Menu)
        .join(Menu.restaurant)   
        .join(Menu.category)     
        .options(
            joinedload(Menu.restaurant),
            joinedload(Menu.category)
        )
        .where(
            Menu.name.ilike(f"%{keyword}%") |
            Restaurant.name.ilike(f"%{keyword}%")
        )
    )




    if available_only:
        stmt = stmt.where(Menu.is_available == True)
    stmt = stmt.distinct(Menu.id)
    menus = session.exec(stmt).all()
    current_time = datetime.now().time()
    filtered_menus = []
    for menu in menus:
        category = menu.category
        if category.start_time <= current_time <= category.end_time:
            filtered_menus.append(menu)

    return filtered_menus
