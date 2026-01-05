from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database.models import User,Restaurant,DeliveryPartner
def check_user_exists(session: Session, email: str, role: str):
    if role == 'user':
        model = User
    if role == 'restaurant':
        model = Restaurant
    if role == 'delivery':
        model = DeliveryPartner

    if model:
        statement = select(model).where(model.email == email)
        result = session.exec(statement).first()
        if result:
            return True
    return False
def create_user(session: Session, data: dict) -> User:

   role = data.get("role", "user")
   if role == "restaurant":
        new_entry = Restaurant(
            name=data["name"],
            email=data["email"],
            mobile=data["mobile"],
            password=data["password"],
            address=data["address"],
            restaurant_pic=data.get("profile_picture")
        )
   elif role == "delivery_person":
        new_entry = DeliveryPartner(
            name=data["name"],
            email=data["email"],
            mobile=data["mobile"],
            password=data["password"],
            address=data["address"],
            delivery_person_profile=data.get("profile_picture")
        )
   else:
        new_entry = User(
            name=data["name"],
            email=data["email"],
            mobile=data["mobile"],
            password=data["password"],
            address=data["address"],
            profile_picture=data.get("profile_picture")
        )
   session.add(new_entry)
   session.commit()
   session.refresh(new_entry)
   return new_entry

def get_user(session: Session, user_id: int,role:str="user"):
    if role == "restaurant": return session.get(Restaurant, user_id)
    if role == "delivery_person": return session.get(DeliveryPartner, user_id)
    return session.get(User, user_id)

def verify_user(session: Session, email: str, password: str, role: str):
    # Mapping the string role to the actual Database Model
    role_map = {
        "user": User,
        "restaurant": Restaurant,
        "delivery_person": DeliveryPartner
    }
    
    # Get the specific model for the selected tab
    target_model = role_map.get(role, User)

    try:
        # SEARCH ONLY THE TARGET TABLE
        user = session.exec(
            select(target_model).where(
                target_model.email == email, 
                target_model.password == password
            )
        ).first()
        
        if not user:
            return False, {}
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

