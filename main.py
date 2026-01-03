from fastapi import FastAPI
from routers import users, restaurants, delivery, orders

app = FastAPI(title="Food Delivery App")

app.include_router(users.router)
app.include_router(restaurants.router)
app.include_router(delivery.router)
app.include_router(orders.router)
