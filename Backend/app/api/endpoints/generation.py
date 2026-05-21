from fastapi import APIRouter, Depends, UploadFile, File, Form, Body
from fastapi.responses import StreamingResponse
from app.api.dependencies import get_current_user
from app.core.db import get_db
from app.worker import generate_voice_task
import uuid
from app.api.dependencies import storage_client

router = APIRouter()

@router.post("/generatedData")
async def get_generated_data(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    try:
        
        userVoiceData = await db.fetch("SELECT * FROM voice_profiles where user_id = $1", current_user["user_id"])
        userGeneratedData = await db.fetch("SELECT * FROM generated_audio where user_id = $1", current_user["user_id"])
        return {
        "voice_profiles": userVoiceData,
        "generated_audio": userGeneratedData
    }
    except Exception as e:
        print(f"Error occurred: {e}")
        return {"error": str(e)}

@router.post("/upload")
async def upload_voice_profile(current_user: dict = Depends(get_current_user), db = Depends(get_db), voice_file: UploadFile = File(...), profile_name: str = Form(...)):
    print("Received voice file: ", voice_file.filename, "with profile name: ", profile_name)
    fileExtension = voice_file.filename.split(".")[-1]
    minioFileName = f"user_{current_user['user_id']}_{uuid.uuid4().hex}.{fileExtension}"
    try: 
        print("Uploading file to MinIO with name: ", minioFileName)
        storage_client.put_object(
            "voice-samples",
            minioFileName,
            voice_file.file,
            length=-1, # Auto-calculate length
            part_size=10*1024*1024, # 10MB parts
            content_type=voice_file.content_type
        )
        print("File uploaded to MinIO with name: ", minioFileName)
        row = await db.fetchrow("""
                         delete from voice_profiles where user_id = $1 returning *
                         """, current_user["user_id"])
        print("row is found to be: ", row)
        if(row):
            storage_client.remove_object("voice-samples", row["reference_audio_path"])
        await db.execute("""
                         INSERT INTO voice_profiles (user_id, profile_name, reference_audio_path, is_active)
                         VALUES ($1, $2, $3, TRUE)
                         """, current_user["user_id"], profile_name, minioFileName)
        return {"status": "success", "message": "Voice profile uploaded and saved successfully!"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to upload to MinIO: {str(e)}"}
    
@router.post("/generate_story")
async def generateStory(payload: dict = Body(...), current_user : dict = Depends(get_current_user), db = Depends(get_db)):
    storyId = payload.get("story_id")
    print("Story id: ", storyId)
    try:
        StoryData = await db.fetchrow("select * from stories where id = $1", storyId)
        print("Story Data found is: ", StoryData)
        if(not StoryData):
            return {"status" : "false", "message": "Story not found"}
        userVoice = await db.fetchrow("select * from voice_profiles where user_id = $1", current_user["user_id"])
        if(not userVoice):
             return {"status" : "false", "message": "User Profile not found"}
        print("User voice profile found is: ", userVoice)
        task = generate_voice_task.delay(StoryData["content"], userVoice["reference_audio_path"], current_user["user_id"])
        await db.execute("""
                         Insert into generated_audio (user_id, voice_profile_id,story_id, storyName, task_id, status) 
                         Values($1,$2,$3,$4,$5,'processing') 
                         """, current_user["user_id"], userVoice["id"], StoryData["id"], StoryData["title"],task.id)
        return {"status": "true", "message": "The AI is crafting your story. You can stay here or come back later!", "taskId" : task.id}
    except Exception as e:
        print("Error encountered: ", e)
        return {"status": "error", "message": f"{str(e)}"}    
    
@router.get("/status/{task_id}")
async def check_status(task_id: str):
    task_result = generate_voice_task.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task_result.status, 
        "result": task_result.result if task_result.ready() else None
    }

# // gets task id and then quiries generated_audio with task id to get the record and then uses the final_audio_path to get it from minio
@router.get("/getGeneratedStory")
async def get_generated_story(task_id: str, db = Depends(get_db)):
    try:
        record = await db.fetchrow("select * from generated_audio where task_id = $1", task_id)
        if not record:
            return {"status": "false", "message": "No record found for this task id"}
        if record["status"] != "completed":
            return {"status": "false", "message": f"Story generation is still {record['status']}"}
        final_audio_path = record["final_audio_path"]
        audio_data = storage_client.get_object("generated-stories", final_audio_path)
        return StreamingResponse(audio_data, media_type="audio/wav")
    except Exception as e:
        print("Error encountered: ", e)
        return {"status": "error", "message": f"{str(e)}"}
