from fastapi import FastAPI
from routers import users, restaurants, delivery, orders

from database.database import create_db_and_tables

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Food Delivery App")

# Allowed origins (React frontend)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       
    allow_credentials=True,
    allow_methods=["*"],         
    allow_headers=["*"],          
)

app.include_router(users.router)
app.include_router(restaurants.router)
app.include_router(delivery.router)
app.include_router(orders.router)

create_db_and_tables()