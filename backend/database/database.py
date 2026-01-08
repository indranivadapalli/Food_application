from sqlmodel import SQLModel, create_engine,Session
import os

sqlite_file_name = "food_delivery_new.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, echo=False)

def create_db_and_tables():
    # This command creates the .db file and all tables defined in models.py
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

