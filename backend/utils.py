import json
import os
import re
from datetime import datetime
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")

def read_json(file_path):
    if not os.path.exists(file_path):
        return []
    with open(file_path, "r") as f:
        return json.load(f)

def write_json(file_path, data):
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

def get_current_time():
    """
    Returns current IST datetime string
    Example: 2026-01-07 10:15:30
    """
    return datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")


def get_current_ist_time():
    """
    Returns current IST time object
    Used for category start/end comparison
    """
    return datetime.now(IST).time()

def is_valid_mobile(mobile: str):
    return bool(re.fullmatch(r"[6-9]\d{9}", mobile))
