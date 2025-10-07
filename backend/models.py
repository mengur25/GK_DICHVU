from sqlalchemy import Column, Integer, String, Boolean, Float, Date, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from .database import Base
from datetime import datetime

# Enum cho role người dùng
class RoleEnum(str, PyEnum):
    admin = "admin"
    student = "student"

# Enum cho trạng thái đăng ký môn học
class EnrollmentStatus(str, PyEnum):
    registered = "registered"
    completed = "completed"
    dropped = "dropped"

# Enum cho trạng thái hóa đơn
class InvoiceStatus(str, PyEnum):
    unpaid = "unpaid"
    paid = "paid"
    overdue = "overdue"

# Enum cho phương thức thanh toán
class PaymentMethod(str, PyEnum):
    service_account = "service_account"
    credit_card = "credit_card"
    vnpay = "vnpay"
    bank_transfer = "bank_transfer"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.student, nullable=False)
    is_active = Column(Boolean, default=True)

    student = relationship("Student", back_populates="user", uselist=False)

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_code = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    department = Column(String)
    is_active = Column(Boolean, nullable=False, default=True)
    
    user = relationship("User", back_populates="student")
    enrollments = relationship("Enrollment", back_populates="student")
    invoices = relationship("Invoice", back_populates="student")
    service_account = relationship("ServiceAccount", uselist=False, back_populates="student")

class ServiceAccount(Base):
    __tablename__ = "service_accounts"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True)
    balance = Column(Float, default=0)
    
    student = relationship("Student", back_populates="service_account")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String, unique=True, index=True, nullable=False)
    course_name = Column(String, nullable=False)
    credits = Column(Integer, nullable=False)
    tuition_fee_per_credit = Column(Float, nullable=False)

    enrollments = relationship("Enrollment", back_populates="course")

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    semester = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.registered, nullable=False)

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    payer_student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    payment_date = Column(Date, nullable=False)
    amount_paid = Column(Float, nullable=False)
    method = Column(Enum(PaymentMethod), nullable=False)
    transaction_code = Column(String, unique=True, nullable=False)

    invoice = relationship("Invoice", back_populates="payments")
    paid_at = Date
    payer_student = relationship("Student", foreign_keys=[payer_student_id])
    @property
    def student_code(self):
        return self.invoice.student.student_code if self.invoice and self.invoice.student else ""

    @property
    def student_name(self):
        return self.invoice.student.full_name if self.invoice and self.invoice.student else ""
    
class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    total_amount = Column(Float, nullable=False) 
    due_date = Column(Date, nullable=False)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.unpaid, nullable=False)
    paid_at = Column(DateTime, default=None)
    student = relationship("Student", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")