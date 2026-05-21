from app.api.dependencies import get_current_user
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from app.core.db import get_db
from app.core.security import verify_password, create_access_token, hash_password


router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    

@router.post("/signup",status_code = status.HTTP_201_CREATED)
async def signup(user: UserCreate, db = Depends(get_db)):
    print("Received user data: ", user)
    hashed_password = hash_password(user.password)
    print("Hashed password is: ", hashed_password)
    try:
        row = await db.fetchrow(
            '''
            INSERT into users (email,name, password_hash)
            VALUES($1,$2,$3)
            RETURNING id,email,name
            ''',
            user.email, user.name, hashed_password
        )
        access_token = create_access_token({"user_id": row["id"], "name": row["name"], "email": row["email"]})
        return {"message":"User created successfully", "data" : {"access_token": access_token, "data": row}}
    except Exception as e:
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        print("Error occurred while creating user:", str(e))
        raise HTTPException(status_code=500, detail="Database error")
    
@router.post("/login")
async def LoginUser(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    db_user = await db.fetchrow("select * from users where email=$1",
                                form_data.username)
    if(not db_user):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED ,
            detail= "Incorrect Email",
            headers={"WWW-Authenticate": "Bearer"}
        )
    passwordCheck= verify_password(form_data.password,db_user["password_hash"])
    if(not passwordCheck):
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    jwt_token = create_access_token({"user_id": db_user["id"], "name": db_user["name"], "email": db_user["email"]})
    return {
        "message": "Login successful",
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "name": db_user["name"]
        }
    }
    
@router.get("/check-token")
async def justChecking(currentuser: dict = Depends(get_current_user)):
    return {"message": "user decoded success", "data": {"user_id": currentuser["user_id"],"name" : currentuser["name"] ,"user_email": currentuser["email"]}}
 