from sqlmodel import SQLModel, create_engine, Session
DATABASE_URL = "sqlite:///./food_application.db"
engine = create_engine(DATABASE_URL,echo=True,connect_args={"check_same_thread": False})
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
def get_session():
    return Session(engine)

