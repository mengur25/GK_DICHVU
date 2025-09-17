from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal
import models
from models import User, RoleEnum
from security import get_password_hash
from routers import auth, users, students, courses, enrollments, invoices, payments, service_accounts

Base.metadata.create_all(bind=engine)

app = FastAPI(title="University Tuition Payment API")

origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

def create_admin():
    db: Session = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@gmail.com").first()
        if not admin:
            new_admin = User(
                full_name="Nguyen Duong",
                email="admin@gmail.com",
                hashed_password=get_password_hash("123456"),
                role=RoleEnum.admin
            )
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)
            print("Admin user created:", new_admin.email)
    finally:
        db.close()

create_admin()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(students.router)
app.include_router(courses.router)
app.include_router(enrollments.router)
app.include_router(invoices.router)
app.include_router(payments.router)
app.include_router(service_accounts.router)

@app.get("/")
def root():
    return {"message": "Tuition Payment API is running"}
