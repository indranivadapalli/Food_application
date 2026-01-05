from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database.models import Restaurant


def create_restaurant(session: Session, data: dict) -> Restaurant:
    restaurant = Restaurant(
        name=data["name"],
        email=data["email"],
        password=data["password"],
        address=data["address"],
        mobile=data["mobile"],
        restaurant_pic=data.get("restaurant_pic")
    )
    session.add(restaurant)
    session.commit()
    session.refresh(restaurant)
    return restaurant


def verify_restaurant(session: Session, email: str, password: str):
    restaurant = session.exec(
        select(Restaurant).where(
            Restaurant.email == email,
            Restaurant.password == password
        )
    ).first()

    if not restaurant:
        return False, None

    return True, restaurant


def get_restaurant(session: Session, restaurant_id: int):
    stmt = (
        select(Restaurant)
        .where(Restaurant.id == restaurant_id)
        .options(
            selectinload(Restaurant.categories),
            selectinload(Restaurant.menus)
        )
    )
    return session.exec(stmt).first()


def get_all_restaurants(session: Session):
    return session.exec(select(Restaurant)).all()


def update_restaurant(session: Session, restaurant_id: int, data: dict):
    restaurant = session.get(Restaurant, restaurant_id)
    if not restaurant:
        return None

    for key, value in data.items():
        setattr(restaurant, key, value)

    session.commit()
    session.refresh(restaurant)
    return restaurant


def delete_restaurant(session: Session, restaurant_id: int):
    restaurant = session.get(Restaurant, restaurant_id)
    if not restaurant:
        return False

    session.delete(restaurant)
    session.commit()
    return True
