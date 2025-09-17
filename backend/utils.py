from datetime import datetime, timedelta, timezone
import smtplib
from email.mime.text import MIMEText
import random

def generate_otp():
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=2)  # OTP expires in 5 minutes
    return otp, expires_at

def send_email(to_email: str, subject: str, body: str):
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login("mengur05@gmail.com", "scfg dyme bhdh aayp") 
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = "mengur05@gmail.com"
    msg['To'] = to_email
    server.sendmail("mengur05@gmail.com", to_email, msg.as_string())
    server.quit()