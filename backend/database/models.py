from enum import Enum
from typing import Optional, List
from datetime import datetime, time
from sqlmodel import SQLModel, Field, Relationship


# 1. Define Enum for status validation
class OrderStatus(str, Enum):
    PLACED = "PLACED"
    PREPARING = "PREPARING"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

# --- USER TABLE ---
class User(SQLModel, table=True):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True} # <--- Add to ALL classes
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    mobile: str
    password: str
    address: str = Field(max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profile_picture: Optional[str] = None
    orders: List["Order"] = Relationship(back_populates="user")

# --- RESTAURANT TABLE ---
class Restaurant(SQLModel, table=True):
    __tablename__ = "restaurants"
    __table_args__ = {"extend_existing": True} # <--- Add to ALL classes
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=50)
    address: str = Field(min_length=5, max_length=100)
    email: str = Field(unique=True, index=True)
    password: str = Field()
    mobile: str = Field()
    created_at: datetime = Field(default_factory=datetime.utcnow)
    restaurant_pic: Optional[str] = None
    
    categories: List["Category"] = Relationship(back_populates="restaurant")
    menus: List["Menu"] = Relationship(back_populates="restaurant")
    orders: List["Order"] = Relationship(back_populates="restaurant")

# --- CATEGORY TABLE ---
class Category(SQLModel, table=True):
    __tablename__ = "categories"
    __table_args__ = {"extend_existing": True} # <--- Add to ALL classes
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    start_time: time 
    end_time: time
    restaurant_id: int = Field(foreign_key="restaurants.id")
    restaurant: "Restaurant" = Relationship(back_populates="categories")
    menus: List["Menu"] = Relationship(back_populates="category")

# --- DELIVERY PARTNER TABLE ---
class DeliveryPartner(SQLModel, table=True):
    __tablename__ = "delivery_partners"
    __table_args__ = {"extend_existing": True} # <--- Add to ALL classes
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True) 
    password: str = Field() 
    mobile: str = Field(unique=True, index=True)
    address: str = Field(default="N/A") 
    vehicle: str = Field(default="Bike") 
    is_available: bool = Field(default=True)
    delivery_person_profile: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    orders: List["Order"] = Relationship(back_populates="delivery_partner")

# --- MENU TABLE ---
class Menu(SQLModel, table=True):
    __tablename__ = "menus"
    __table_args__ = {"extend_existing": True}

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

# --- ORDER TABLE ---
class Order(SQLModel, table=True):
    __tablename__ = "orders"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    restaurant_id: int = Field(foreign_key="restaurants.id")
    delivery_partner_id: Optional[int] = Field(default=None, foreign_key="delivery_partners.id")

    total_amount: float
    status: OrderStatus = Field(default=OrderStatus.PLACED)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    payment_image: Optional[str] = None

    user: "User" = Relationship(back_populates="orders")
    restaurant: "Restaurant" = Relationship(back_populates="orders")
    items: List["OrderItem"] = Relationship(back_populates="order")
    delivery_partner: Optional["DeliveryPartner"] = Relationship(back_populates="orders")

# --- ORDER ITEM TABLE ---
class OrderItem(SQLModel, table=True):
    __tablename__ = "order_items"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="orders.id")
    menu_id: int = Field(foreign_key="menus.id")
    quantity: int
    price: float

    order: "Order" = Relationship(back_populates="items")
    menu: "Menu" = Relationship(back_populates="order_items")
