from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import date, datetime
from typing import Optional, List, Literal
from .models import RoleEnum, InvoiceStatus, PaymentMethod

# -------- Auth --------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleEnum | str
    email: EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# -------- Student --------
class StudentCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    student_code: str
    department: Optional[str] = None
    phone: Optional[str] = None

class StudentUpdate(BaseModel):
    department: Optional[str] = None  
    phone: Optional[str] = None  

# -------- Service Accounts ------
class ServiceAccountOut(BaseModel):
    id: int
    student_id: int
    balance: float

    class Config:
        orm_mode = True

class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_code: str
    full_name: str
    department: Optional[str]
    phone: Optional[str]
    service_account: Optional[ServiceAccountOut] = None  
    is_active: Optional[bool] = True
    user_id: Optional[int]

# -------- Users --------
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: RoleEnum = RoleEnum.student

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    full_name: str
    role: RoleEnum
    is_active: bool
    student: Optional[StudentOut] = None

UserOut.model_rebuild()
StudentOut.model_rebuild()

# -------- Course --------
class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    credits: int = Field(ge=0)
    tuition_fee_per_credit: float = Field(ge=0)

class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_code: str
    course_name: str
    credits: int
    tuition_fee_per_credit: float
    enrolled_count: int

class CourseUpdate(BaseModel):
    tuition_fee_per_credit: Optional[float] = None
    credits: Optional[int] = None

# -------- Enrollment --------
class EnrollmentBulkCreate(BaseModel):
    student_id: int
    courses: list[str]  
    semester: str
    year: int
    status: Literal["registered", "dropped", "completed"] = "registered"

class EnrollmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    course_id: int
    course_code: str
    semester: str
    year: int
    status: str

# -------- Invoice --------
class InvoiceCreate(BaseModel):
    student_id: int
    semester: str
    due_date: date
    year: int
    status: InvoiceStatus = InvoiceStatus.unpaid

class InvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    total_amount: float
    due_date: date
    status: InvoiceStatus

# -------- Payment --------
class PaymentCreate(BaseModel):
    invoice_id: int
    student_code: str 
    student_name: str 
    amount_paid: float = Field(ge=0)
    method: PaymentMethod
    card_number: Optional[str] = None  
    agree_terms: bool = Field(..., description="Must agree to terms")

class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    invoice_id: int
    student_code: str 
    student_name: str
    payment_date: date
    amount_paid: float
    method: PaymentMethod
    transaction_code: str



class RecentPaymentItem(BaseModel):
    invoice_id: int
    student_id: int
    student_name: Optional[str] = None
    amount: int
    paid_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class PaymentHistorySummary(BaseModel):
    total_paid_invoices: int
    total_amount: int
    unique_payers: int
    recent_payments: List[RecentPaymentItem] = []

    model_config = ConfigDict(from_attributes=True)