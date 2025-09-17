from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
import models
import schemas
from deps import get_db, require_roles
from models import RoleEnum, InvoiceStatus
from schemas import InvoiceCreate

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.post("/", response_model=schemas.InvoiceOut)
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db),
    _: models.User = Depends(require_roles(RoleEnum.admin))
):
    enrollments = db.query(models.Enrollment).join(models.Course).filter(
        models.Enrollment.student_id == payload.student_id,
        models.Enrollment.semester == payload.semester,
        models.Enrollment.year == payload.year,
        models.Enrollment.status == "registered"
    ).all()

    if not enrollments:
        raise HTTPException(404, "No registered courses found for this student in the given term")

    total_amount = sum(e.course.credits * e.course.tuition_fee_per_credit for e in enrollments)

    invoice = models.Invoice(
        student_id=payload.student_id,
        total_amount=total_amount,
        due_date=payload.due_date,
        status=InvoiceStatus.unpaid if payload.due_date >= date.today() else InvoiceStatus.overdue
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/", response_model=list[schemas.InvoiceOut])
def list_invoices(db: Session = Depends(get_db),
                  _: models.User = Depends(require_roles(RoleEnum.admin))):
    return db.query(models.Invoice).all()

@router.get("/by-student/{student_id}", response_model=list[schemas.InvoiceOut])
def invoices_by_student(student_id: int, db: Session = Depends(get_db),
                        _: models.User = Depends(require_roles(RoleEnum.admin, RoleEnum.student))):
    return db.query(models.Invoice).filter(models.Invoice.student_id == student_id).all()

