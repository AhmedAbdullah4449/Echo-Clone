from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_current_user
from app.core.db import get_db
from pydantic import BaseModel

router = APIRouter()

@router.post("/")
async def fetchStories(category: str = Query(None) ,CurrentUser : dict = Depends(get_current_user), db = Depends(get_db)):
    query = "Select * from stories"
    params = []
    if category:
        query+= " where category = $1"
        params.append(category)
    try: 
        stories = await db.fetch(query,*params)
        return {"status" : "true", "data" : stories}
    except Exception as e:
        print("Error encountered: ", e)
        return {"status" : "false", "message": "Failed to Fetch stories"}

class addStorydata(BaseModel):
    category: str
    text: str
    title: str
@router.post("/addStory")
async def addStory(Story: addStorydata, currentUser : dict = Depends(get_current_user), db = Depends(get_db)):
    print("story recerived for adding: ", Story)
    try:
        await db.execute("Insert into stories (title, content, category) values($1, $2, $3)",Story.title, Story.text, Story.category)
        return {"status" : "true", "message" : f"Story {Story.title} added successfully"}
    except Exception as e:
        return {"status": "false", "message": "Error encountered while adding story"}