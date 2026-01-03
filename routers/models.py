from sqlmodel import SQLModel,Field
from typing import List,Optional
from datetime import datetime

class User(SQLModel,table=True):
    id:Optional[int]=Field(default=None,primary_key=True)
    name:str
    email:str
    mobile:str
    address:str
    password:str
    profile_picture:Optional[str]=None
    created_time:datetime=Field(default_factory=datetime.utcnow)


class Restaurant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    address: str
    contact: str
    restaurant_pic: Optional[str] = None

class DeliveryPerson(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    mobile: str
    vehicle: str
    profile_picture: Optional[str] = None

class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="user.id")
    restaurant_id: int = Field(foreign_key="restaurant.id")
    delivery_person_id: int = Field(foreign_key="deliveryperson.id")

    status: str
    subtotal: float
    gst_percent: float
    gst_amount: float
    delivery_fee: float
    total_price: float

    placed_time: datetime = Field(default_factory=datetime.utcnow)
    preparing_time: Optional[datetime] = None
    pick_up_time: Optional[datetime] = None
    delivered_time: Optional[datetime] = None

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

class OrderItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    quantity: int
    price: float

    order_id: int = Field(foreign_key="order.id")
    menu_item_id: int = Field(foreign_key="menuitem.id")


class MenuItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    price: float
    section: str
    menu_item_pic: Optional[str] = None

    restaurant_id: int = Field(foreign_key="restaurant.id")








