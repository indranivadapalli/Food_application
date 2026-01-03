from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database.models import User

def create_user(session: Session, data: dict) -> User:
    user = User(
        name=data["name"],
        email=data["email"],
        mobile=data["mobile"],
        password=data["password"],
        address=data["address"],
        profile_picture=data.get("profile_picture") 
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def get_user(session: Session, user_id: int):
    return session.get(User, user_id)

def verify_user(session: Session, email: str, password: str):
    try:
        user = session.exec(select(User).where(User.email == email, User.password == password)).first()
        if not user:
            return False, {}
        else:
            return True, user
    except Exception as e:
        return False, {}
        

def get_all_users(session: Session):
    return session.exec(select(User)).all()

def update_user(session: Session, user_id: int, data: dict):
    user = session.get(User, user_id)
    if not user:
        return None

    for key, value in data.items():
        setattr(user, key, value)

    session.commit()
    session.refresh(user)
    return user

def delete_user(session: Session, user_id: int):
    user = session.get(User, user_id)
    if not user:
        return False

    session.delete(user)
    session.commit()
    return True

def get_user_with_orders(session: Session, user_id: int):
    stmt = (
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.orders))
    )
    return session.exec(stmt).first()

