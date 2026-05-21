from fastapi import FastAPI, Depends,UploadFile, File, Form
from app.api.dependencies import get_current_user
from app.core.db import connect_db, close_db, init_db
from app.api.endpoints import auth
from .worker import generate_voice_task
from .api.dependencies import storage_client
from app.api.endpoints import generation
from app.api.endpoints import stories
import uuid
app= FastAPI(title = "Vocal Legacy App", version="1.0.0")
# @app.post("/stories/generate")
# async def start_generation(
#     user_id: int = Form(...),
#     text: str = Form(...),
#     voice_file: UploadFile = File(...)
# ):
#     # 1. Generate a unique filename for MinIO
#     # We use a UUID so if the same user uploads twice, files don't overwrite
#     print("Voice file is: ", voice_file)
#     file_extension = voice_file.filename.split(".")[-1]
#     ref_blob_name = f"user_{user_id}_{uuid.uuid4().hex}.{file_extension}"

#     # 2. Stream the file directly from the request to MinIO
#     # This avoids saving the file to your laptop's hard drive first
#     try:
#         storage_client.put_object(
#             "voice-samples",
#             ref_blob_name,
#             voice_file.file,
#             length=-1, # Auto-calculate length
#             part_size=10*1024*1024, # 10MB parts
#             content_type=voice_file.content_type
#         )
#     except Exception as e:
#         return {"status": "error", "message": f"Failed to upload to MinIO: {str(e)}"}
    
#     # 2. Push to Redis Queue
#     task = generate_voice_task.delay(text, ref_blob_name, user_id)
    
#     # 3. Return Task ID immediately
#     return {
#         "status": "processing",
#         "task_id": task.id,
#         "message": "The AI is crafting your story. You can stay here or come back later!"
#     }

    
@app.on_event("startup")
async def startup():
    print("connecting to database...")
    await connect_db()
    print("initializing database...")
    await init_db()

@app.get("/")
async def health_check():
    return {"message": "Vocal Legacy App is running!"}

@app.get("/protected-route")
async def justChecking(currentuser: dict = Depends(get_current_user)):
    return {"message": "user decoded success", "user_id": currentuser["user_id"], "user_email": currentuser["email"]}
    
    
app.include_router(generation.router, prefix="/api", tags=["generation"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(stories.router, prefix="/story", tags=["story"])

for route in app.routes:
    print(route.path)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7000)