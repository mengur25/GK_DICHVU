from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
import schemas
import models
from deps import get_db, require_roles
from models import RoleEnum
from typing import List
router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db), _: models.User = Depends(require_roles(RoleEnum.admin))):
    users = db.query(models.User).options(joinedload(models.User.student)).all()
    print("student:", users[0].student)  

    return users

@router.get("/service-accounts", response_model=List[schemas.ServiceAccountOut])
def get_service_accounts(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles(RoleEnum.admin, RoleEnum.student))
):
    return db.query(models.ServiceAccount).all()
