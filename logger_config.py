import logging
from logging.handlers import RotatingFileHandler
import os

# Create logs folder
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

LOG_FILE = os.path.join(LOG_DIR, "app.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        RotatingFileHandler(
            LOG_FILE,
            maxBytes=5_000_000,
            backupCount=3
        ),
        logging.StreamHandler()
    ]
)

def get_logger(name: str):
    return logging.getLogger(name)
