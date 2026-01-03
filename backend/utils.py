import json
import os
import re
from datetime import datetime

def read_json(file_path):
    if not os.path.exists(file_path):
        return []
    with open(file_path, "r") as f:
        return json.load(f)

def write_json(file_path, data):
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

def get_current_time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def is_valid_mobile(mobile: str):
    return re.fullmatch(r"[6-9]\d{9}", mobile)
