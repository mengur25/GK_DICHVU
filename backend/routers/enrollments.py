from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from .. import schemas, models
from ..deps import get_db, require_roles
from ..models import RoleEnum

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

@router.get("/", response_model=list[schemas.EnrollmentOut])
def list_enrollments(db: Session = Depends(get_db),
                     _: models.User = Depends(require_roles(RoleEnum.admin, RoleEnum.student))):
    enrollments = db.query(models.Enrollment).options(joinedload(models.Enrollment.course)).all()
    for e in enrollments:
        e.course_code = e.course.course_code if e.course else None  
    return enrollments

@router.post("/", response_model=list[schemas.EnrollmentOut])
def create_enrollments_bulk(
    payload: schemas.EnrollmentBulkCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles(RoleEnum.admin, RoleEnum.student))
):
    results = []
    student = db.query(models.Student).get(payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    course_codes = payload.courses
    courses = db.query(models.Course).filter(models.Course.course_code.in_(course_codes)).all()
    print(f"Requested course_codes: {course_codes}")
    print(f"Found courses: {[course.course_code for course in courses]}")
    course_map = {course.course_code: course.id for course in courses}
    missing_codes = set(course_codes) - set(course_map.keys())
    if missing_codes:
        raise HTTPException(status_code=404, detail=f"Courses not found: {missing_codes}")
    
    for course_code in payload.courses:
        course_id = course_map[course_code]
        exists = (
            db.query(models.Enrollment)
            .filter_by(
                student_id=payload.student_id,
                course_id=course_id,
                semester=payload.semester,
                year=payload.year
            )
            .first()
        )
        if exists:
            continue

        e = models.Enrollment(
            student_id=payload.student_id,
            course_id=course_id,
            semester=payload.semester,
            year=payload.year,
            status=payload.status

        )

        
        db.add(e)
        results.append(e)

    db.commit()
    for e in results:
        db.refresh(e)
        e.course_code = db.query(models.Course).get(e.course_id).course_code
    return results


