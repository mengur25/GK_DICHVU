from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from deps import get_db, get_current_user, require_roles
from models import RoleEnum

router = APIRouter(prefix="/service-accounts", tags=["Service Accounts"])

@router.get("/by-student/{student_id}")
def get_service_account_by_student(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get service account balance by student ID"""
    
    # Check if current user can access this student's account
    if current_user.role == RoleEnum.student:
        # Student can only access their own account
        student = db.query(models.Student).filter(
            models.Student.user_id == current_user.id,
            models.Student.id == student_id
        ).first()
        if not student:
            raise HTTPException(403, "Access denied")
    else:
        # Admin can access any student's account
        student = db.query(models.Student).filter(models.Student.id == student_id).first()
        if not student:
            raise HTTPException(404, "Student not found")
    
    # Get service account
    service_account = db.query(models.ServiceAccount).filter(
        models.ServiceAccount.student_id == student_id
    ).first()
    
    if not service_account:
        # Return zero balance if no service account exists
        return {"student_id": student_id, "balance": 0.0}
    
    return {
        "student_id": student_id,
        "balance": service_account.balance
    }

@router.get("/my-balance")
def get_my_balance(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's service account balance (for students)"""
    
    if current_user.role != RoleEnum.student:
        raise HTTPException(403, "Only students have service accounts")
    
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(404, "Student profile not found")
    
    service_account = db.query(models.ServiceAccount).filter(
        models.ServiceAccount.student_id == student.id
    ).first()
    
    if not service_account:
        return {"balance": 0.0}
    
    return {"balance": service_account.balance}

@router.put("/{account_id}")
def update_service_account_balance(
    account_id: int,
    balance_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update service account balance"""
    
    # Get service account
    service_account = db.query(models.ServiceAccount).filter(
        models.ServiceAccount.id == account_id
    ).first()
    
    if not service_account:
        raise HTTPException(404, "Service account not found")
    
    # Check if current user can access this account
    if current_user.role == RoleEnum.student:
        # Student can only access their own account
        student = db.query(models.Student).filter(
            models.Student.user_id == current_user.id,
            models.Student.id == service_account.student_id
        ).first()
        if not student:
            raise HTTPException(403, "Access denied")
    
    # Update balance
    new_balance = balance_data.get("balance")
    if new_balance is None:
        raise HTTPException(400, "Balance is required")
    
    service_account.balance = new_balance
    db.commit()
    db.refresh(service_account)
    
    return {
        "id": service_account.id,
        "student_id": service_account.student_id,
        "balance": service_account.balance
    }

