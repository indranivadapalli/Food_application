from typing import Optional,List
from datetime import datetime
from sqlmodel import SQLModel,Field,Relationship

#user table creation
class User(SQLModel,table=True):
    __tablename__="users"
    id:Optional[int]=Field(default=None,primary_key=True)
    name:str
    email:str
    mobile:str
    password:str
    address:str=Field(max_length=100)
    created_at:datetime=Field(default_factory=datetime.utcnow)
    profile_picture: Optional[str] = None
    orders:List["Order"]=Relationship(back_populates="user")

#Restaurant table creation
class Restaurant(SQLModel,table=True):
    __tablename__="restaurants"
    id:Optional[int]=Field(default=None,primary_key=True)
    name:str=Field(max_length=50)
    address:str=Field(min_length=5,max_length=100)
    contact:str
    created_at:datetime=Field(default_factory=datetime.utcnow)
    restaurant_pic: Optional[str] = None
    categories: List["Category"] = Relationship(back_populates="restaurant")
    menus: List["Menu"] = Relationship(back_populates="restaurant")
    orders: List["Order"] = Relationship(back_populates="restaurant")

# menu table creation
class Menu(SQLModel, table=True):
    __tablename__ = "menus"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    price: float
    is_available: bool = Field(default=True)
    menu_item_pic: Optional[str] = None
    restaurant_id: int = Field(foreign_key="restaurants.id")
    category_id: int = Field(foreign_key="categories.id")
    category: "Category" = Relationship(back_populates="menus")
    restaurant: Restaurant = Relationship(back_populates="menus")
    order_items: List["OrderItem"] = Relationship(back_populates="menu")

#order table creation
class Order(SQLModel, table=True):
    __tablename__ = "orders"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    restaurant_id: int = Field(foreign_key="restaurants.id")
    delivery_partner_id: Optional[int] = Field(default=None, foreign_key="delivery_partners.id")
    total_amount: float
    status: str = Field(default="PLACED")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    payment_image: Optional[str] = None
    user: User = Relationship(back_populates="orders")
    restaurant: Restaurant = Relationship(back_populates="orders")
    items: List["OrderItem"] = Relationship(back_populates="order")
    delivery_partner: Optional["DeliveryPartner"] = Relationship(back_populates="orders")

#orderitem table creation 
class OrderItem(SQLModel, table=True):
    __tablename__ = "order_items"
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="orders.id")
    menu_id: int = Field(foreign_key="menus.id")
    quantity: int
    price: float  
    order: Order = Relationship(back_populates="items")
    menu: Menu = Relationship(back_populates="order_items")

#delivery user table creation
class DeliveryPartner(SQLModel, table=True):
    __tablename__ = "delivery_partners"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    mobile: str = Field(unique=True, index=True)
    vehicle: str  
    is_available: bool = Field(default=True)
    delivery_person_profile: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    orders: List["Order"] = Relationship(back_populates="delivery_partner")
from datetime import time
#class category creation 
class Category(SQLModel, table=True):
    __tablename__ = "categories"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    start_time: time
    end_time: time

    restaurant_id: int = Field(foreign_key="restaurants.id")
    restaurant: "Restaurant" = Relationship(back_populates="categories")

    menus: List["Menu"] = Relationship(back_populates="category")



