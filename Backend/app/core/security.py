import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from dotenv import load_dotenv
import os

load_dotenv()

secret_key = os.getenv("SECRET_KEY")
algorithm = os.getenv("ALGORITHM")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plainPassword:str, hashed_password: str) -> bool:
    return pwd_context.verify(plainPassword, hashed_password)    

def create_access_token(data: dict):
    TokenData = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=7*24*60)    
    TokenData.update({"exp": int(expire.timestamp())})
    token = jwt.encode(TokenData, secret_key, algorithm="HS256")
    return token