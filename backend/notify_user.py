import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import os

load_dotenv()

def send_notification(weight, filename):
    email_address = os.getenv("EMAIL_SENDER")
    email_password = os.getenv("EMAIL_PASSWORD")
    receiver = os.getenv("EMAIL_RECEIVER")

    msg = EmailMessage()
    msg["Subject"] = "📬 Mailbox Triggered"
    msg["From"] = email_address
    msg["To"] = receiver
    msg.set_content(f"Mailbox accessed.\nWeight: {weight}g\nImage: {filename}")

    with open(f"uploads/{filename}", "rb") as f:
        img_data = f.read()
        msg.add_attachment(img_data, maintype="image", subtype="jpeg", filename=filename)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(email_address, email_password)
        smtp.send_message(msg)
