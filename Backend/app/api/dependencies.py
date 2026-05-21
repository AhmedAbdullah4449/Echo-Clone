from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from minio import Minio
import httpx
from dotenv import load_dotenv
import os

load_dotenv()
storage_client = Minio(
    "localhost:9000",
    access_key="admin", # Default
    secret_key="password123", # Default
    secure=False
)

COLAB_URL = "https://tackle-pentagram-mauve.ngrok-free.dev"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def process_ai_voice(text, ref_blob_name):
    # 1. Download reference from MinIO
    print("We are in process_ai_voice function, received text: ", text, "and ref_blob_name: ", ref_blob_name)
    ref_local = f"temp_{ref_blob_name}"
    storage_client.fget_object("voice-samples", ref_blob_name, ref_local)

    # 2. Send to Colab
    async with httpx.AsyncClient(timeout=120.0) as client:
        with open(ref_local, "rb") as f:
            files = {"ref_audio": (ref_blob_name, f, "audio/wav")}
            data = {"text": text}
            response = await client.post(f"{COLAB_URL}/generate-story", data=data, files=files)

    # 3. Upload Result to MinIO
    if response.status_code == 200:
        result_blob = f"story_{os.urandom(4).hex()}.wav"
        with open("result.wav", "wb") as f:
            f.write(response.content)
        
        storage_client.fput_object("generated-stories", result_blob, "result.wav")
        return result_blob
    return None


async def get_current_user(token: str = Depends(oauth2_scheme)):
    print("Received token: ", token)
    try:
        algorithm = os.getenv("ALGORITHM")
        secret_key = os.getenv("SECRET_KEY")
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        user_id = payload.get("user_id")
        email = payload.get("email") 
        name = payload.get("name")  
        print("Email from token: ", email, "User ID from token: ", user_id, "Name from token: ", name)
        if email is None or user_id is None or name is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
                )  
        return {"user_id": user_id, "name": name, "email": email}  
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
        )