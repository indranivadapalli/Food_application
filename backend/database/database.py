
from sqlmodel import SQLModel, create_engine, Session
DATABASE_URL = "sqlite:///./food_delivery_new.db"
engine = create_engine(DATABASE_URL,pool_size=10,max_overflow=20)
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
def get_session():
    return Session(engine)

