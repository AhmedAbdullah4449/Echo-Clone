from celery import Celery
import asyncio
from .api.dependencies import process_ai_voice
from app.core.syncdb import SessionLocal
from sqlalchemy import text

# Connect to your Redis container
celery_app = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

@celery_app.task(bind=True, name="generate_voice_task")
def generate_voice_task(self, content, ref_blob_name, user_id):
    print("Worker received task with content: ", content, "and ref_blob_name: ", ref_blob_name, "for user_id: ", user_id)
    taskId = self.request.id
    
    db = SessionLocal() 
    try:
        loop = asyncio.get_event_loop()
        result_path = loop.run_until_complete(process_ai_voice(content, ref_blob_name))
        try:
            
            db.execute(
                text("UPDATE generated_audio SET final_audio_path = :path, status = 'completed' WHERE task_id = :t_id"),
                {"path": result_path, "t_id": taskId}
            )
            db.commit() 
        except Exception as e:
            db.rollback()
            print(f"Database error: {e}")
            raise e

        return {"status": "completed", "path": result_path}
    except Exception as e:
        print("Error in processing AI voice: ", e)
        db.execute(
            text("UPDATE generated_audio SET status = 'failed' WHERE task_id = :t_id"),
            {"t_id": taskId}
        )
        db.commit()
        print(f"Error occurred: {e}")
        raise e
    finally:
        db.close() 

