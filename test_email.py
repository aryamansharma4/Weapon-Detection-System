from dotenv import load_dotenv
from email_service import send_alert_email

load_dotenv()

send_alert_email(
    receiver="tkg7120ckt@gmail.com",
    threat="Firearm",
    confidence=0.94,
    timestamp="2026-08-03 22:30:00",
    image_path="static/results/result_-_mp4-7_jpg.rf.e21c2817fb4b737bc1013a4848309af9.jpg"   # Replace with any existing image
)

print("Email test completed.")