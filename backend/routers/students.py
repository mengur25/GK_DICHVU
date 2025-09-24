from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from .. import schemas, models
from ..deps import get_db, require_roles, get_current_user
from ..models import RoleEnum
from ..security import get_password_hash

router = APIRouter(prefix="/students", tags=["Students"])

@router.post("/", response_model=schemas.StudentOut)
def create_student(
    payload: schemas.StudentCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles(RoleEnum.admin))
):
    if db.query(models.Student).filter(models.Student.student_code == payload.student_code).first():
        raise HTTPException(status_code=400, detail="student_code already exists")

    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="email already exists")

    hashed_pw = get_password_hash(payload.password)
    new_user = models.User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hashed_pw,
        role=RoleEnum.student,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_student = models.Student(
        user_id=new_user.id,
        student_code=payload.student_code,
        full_name=payload.full_name,
        department=payload.department,
        phone=payload.phone
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    new_account = models.ServiceAccount(
        student_id=new_student.id,
        balance=0
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    
    new_student.balance = new_account.balance

    return new_student

@router.get("/", response_model=list[schemas.StudentOut])
def list_students(db: Session = Depends(get_db),
                  _: models.User = Depends(require_roles(RoleEnum.admin))):
    students = db.query(models.Student).options(joinedload(models.Student.service_account)).all()
    return students



@router.get("/profile", response_model=schemas.StudentOut)
def get_my_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # only students have profile
    role_name = getattr(current_user.role, "name", str(current_user.role)).lower()
    if role_name != RoleEnum.student.name:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")

    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    account = db.query(models.ServiceAccount).filter(models.ServiceAccount.student_id == student.id).first()
    student.balance = getattr(account, "balance", 0)
    return student

@router.get("/by-code/{code}", response_model=schemas.StudentOut)
def get_student_by_code(code: str, db: Session = Depends(get_db), _: models.User = Depends(require_roles(RoleEnum.admin, RoleEnum.student))):
    st = db.query(models.Student).filter(models.Student.student_code == code).first()
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")
    account = db.query(models.ServiceAccount).filter(models.ServiceAccount.student_id == st.id).first()
    st.balance = getattr(account, "balance", 0)
    return st



@router.get("/{student_id}", response_model=schemas.StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db),
                _: models.User = Depends(require_roles(RoleEnum.admin))):
    st = db.query(models.Student).get(student_id)
    if not st:
        raise HTTPException(404, "Student not found")
    return st



@router.put("/{student_id}", response_model=schemas.StudentOut)
def update_student(
    student_id: int,
    payload: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles(RoleEnum.admin))
):
    st = db.get(models.Student, student_id)
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(st, key, value)
    db.commit()
    db.refresh(st)
    return st

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles(RoleEnum.admin))
):
    st = db.get(models.Student, student_id)
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(st)
    db.commit()
    return {"detail": "Student deleted"}
