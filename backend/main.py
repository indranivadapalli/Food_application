from fastapi import FastAPI
from database.database import create_db_and_tables
from fastapi.middleware.cors import CORSMiddleware
from routers.delivery import router as delivery_router
from routers.users import router as users_router
from routers.restaurants import router as restaurants_router
from routers.orders import router as orders_router
from routers.menu import router as menu_router
from routers.category import router as category_router

from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="uploads"), name="static")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(delivery_router)
app.include_router(users_router)
app.include_router(restaurants_router)
app.include_router(orders_router)
app.include_router(menu_router)
app.include_router(category_router)