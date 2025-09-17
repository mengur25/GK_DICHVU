from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import schemas
import models
from deps import get_db, require_roles
from models import RoleEnum
from sqlalchemy import func

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.post("/", response_model=schemas.CourseOut)
def create_course(payload: schemas.CourseCreate, db: Session = Depends(get_db),
                  _: models.User = Depends(require_roles(RoleEnum.admin))):
    if db.query(models.Course).filter(models.Course.course_code == payload.course_code).first():
        raise HTTPException(status_code=400, detail="course_code already exists")
    c = models.Course(**payload.model_dump())

    
    db.add(c)
    db.commit()
    db.refresh(c)

    return schemas.CourseOut(
        id=c.id,
        course_code=c.course_code,
        course_name=c.course_name,
        credits=c.credits,
        tuition_fee_per_credit=c.tuition_fee_per_credit,
        enrolled_count=0  
    )

@router.get("/", response_model=list[schemas.CourseOut])
def get_courses(db: Session = Depends(get_db)):
    results = (
        db.query(
            models.Course.id,
            models.Course.course_code,
            models.Course.course_name,
            models.Course.credits,
            models.Course.tuition_fee_per_credit,
            func.count(models.Enrollment.id).label("enrolled_count"),
        )
        .outerjoin(models.Enrollment, models.Course.id == models.Enrollment.course_id)
        .group_by(models.Course.id)
        .all()
    )

    return [
        schemas.CourseOut(
            id=r.id,
            course_code=r.course_code,
            course_name=r.course_name,
            credits=r.credits,
            tuition_fee_per_credit=r.tuition_fee_per_credit,
            enrolled_count=r.enrolled_count,
        )
        for r in results
    ]

@router.get("/{course_id}", response_model=schemas.CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(
            models.Course.id,
            models.Course.course_code,
            models.Course.course_name,
            models.Course.credits,
            models.Course.tuition_fee_per_credit,
            func.count(models.Enrollment.id).label("enrolled_count"),
        )
        .outerjoin(models.Enrollment, models.Course.id == models.Enrollment.course_id)
        .filter(models.Course.id == course_id)
        .group_by(models.Course.id)
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Course not found")

    enrolled_count = db.query(func.count(models.Enrollment.id)).filter(models.Enrollment.course_id == course_id).scalar()
    return schemas.CourseOut(
        id=result.id,
        course_code=result.course_code,
        course_name=result.course_name,
        credits=result.credits,
        tuition_fee_per_credit=result.tuition_fee_per_credit,
        enrolled_count=result.enrolled_count or 0,
    )


@router.put("/{course_id}", response_model=schemas.CourseOut)
def update_course(
    course_id: int,
    payload: schemas.CourseUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles(RoleEnum.admin))
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(course, key, value)

    db.commit()
    db.refresh(course)
    return course
