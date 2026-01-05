from datetime import time
from sqlmodel import select
from models.category import Category

@router.post("/{restaurant_id}/categories/add")
def add_category_timing(
    restaurant_id: int,
    name: str = Form(...),
    start_time: str = Form(...),  # "07:00"
    end_time: str = Form(...)
):
    logger.info("Add category timing: %s for restaurant %s", name, restaurant_id)

    try:
        session = get_session()

        category = Category(
            name=name.lower(),
            start_time=time.fromisoformat(start_time),
            end_time=time.fromisoformat(end_time),
            restaurant_id=restaurant_id
        )

        session.add(category)
        session.commit()
        session.refresh(category)

        return {
            "status": "success",
            "message": "Category timing added",
            "category_id": category.id
        }

    except Exception as e:
        logger.error("Add category timing failed: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}
@router.put("/categories/{category_id}/update")
def update_category_timing(
    category_id: int,
    start_time: str = Form(...),
    end_time: str = Form(...)
):
    logger.info("Update category timing ID %s", category_id)

    try:
        session = get_session()
        category = session.get(Category, category_id)

        if not category:
            return {"status": "error", "message": "Category not found"}

        category.start_time = time.fromisoformat(start_time)
        category.end_time = time.fromisoformat(end_time)

        session.add(category)
        session.commit()

        return {
            "status": "success",
            "message": "Category timing updated"
        }

    except Exception as e:
        logger.error("Update category timing failed: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}
@router.get("/{restaurant_id}/categories")
def get_category_timings(restaurant_id: int):
    logger.info("Fetch category timings for restaurant %s", restaurant_id)

    try:
        session = get_session()
        categories = session.exec(
            select(Category).where(Category.restaurant_id == restaurant_id)
        ).all()

        return {
            "status": "success",
            "categories": [
                {
                    "id": c.id,
                    "name": c.name,
                    "start_time": c.start_time,
                    "end_time": c.end_time
                }
                for c in categories
            ]
        }

    except Exception as e:
        logger.error("Fetch category timings failed: %s", str(e), exc_info=True)
        return {"status": "error", "message": "Internal error"}
