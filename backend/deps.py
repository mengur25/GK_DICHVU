from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from .database import SessionLocal
from .models import User, RoleEnum
from .security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
# from sqlalchemy import text

# with SessionLocal() as db:
#     users = db.execute(text("SELECT * FROM users")).fetchall()
#     students = db.execute(text("SELECT * FROM students")).fetchall()
#     print(users)
#     print(students)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise credentials_exception
    
    print("Decoded payload:", payload)
    print("Found user:", user.id, user.role if user else None)
    

    return user

def require_roles(*roles: RoleEnum):
    def checker(current_user: User = Depends(get_current_user)):
        print("require_roles: raw role:", current_user.role, "type:", type(current_user.role))

        if isinstance(current_user.role, RoleEnum):
            user_role_name = current_user.role.name
            user_role_value = current_user.role.value
        else:
            user_role_name = str(current_user.role)
            user_role_value = str(current_user.role)

        allowed = set()
        for r in roles:
            if isinstance(r, RoleEnum):
                allowed.add(r.name)
                allowed.add(str(r.value))
            else:
                allowed.add(str(r))

        if (str(user_role_name) not in allowed) and (str(user_role_value) not in allowed):
            print("require_roles: denied. user_role_name:", user_role_name, "user_role_value:", user_role_value, "allowed:", allowed)
            raise HTTPException(status_code=403, detail="Not enough permission")

        print("require_roles: allowed. user_role_name:", user_role_name, "user_role_value:", user_role_value)
        return current_user

    return checker

