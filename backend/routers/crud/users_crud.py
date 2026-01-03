from models import User
from database import get_session,engine
from sqlmodel import Session,select



with get_session as session:
    user=User(
        name="Indrani",
        email="indrani@gmail.com",
        mobile=9491604846,
        address="coromandel gate",
        password="secret",
        profile_picture="hello.jpg"

    )
    session.add(user)
    session.commit()
    session.refresh(user)

    print(user.id)
def get_user(user_id:int):
    with session(engine) as session:
        return session.get(User,user_id)
def update_user(user_id:int,address:str):
    with session(engine) as session:
        user=session.get(User,user_id)
        user.address=address
        session.commit()
        return user
def delete_user(user_id:int):
    user=session.get(User,user_id)
    session.delete(user)
    session.commit()
