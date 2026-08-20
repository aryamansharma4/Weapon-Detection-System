import os
import smtplib
from email.message import EmailMessage


def send_alert_email(
    receiver,
    threat,
    confidence,
    timestamp,
    image_path,
    source="Live Camera"
):
    sender = os.environ.get("EMAIL_ADDRESS")
    password = os.environ.get("EMAIL_PASSWORD")

    if not sender or not password:
        print("Email credentials not configured.")
        return

    msg = EmailMessage()

    msg["Subject"] = "🚨 Weapon Detection Alert | WDS"
    msg["From"] = sender
    msg["To"] = receiver

    html = f"""
    <html>
    <body style="font-family:Arial;background:#f4f6f8;padding:30px;">

    <div style="max-width:650px;margin:auto;background:white;border-radius:10px;border:1px solid #ddd;overflow:hidden;">

        <div style="background:#b91c1c;color:white;padding:18px;text-align:center;">
            <h2 style="margin:0;">🚨 Weapon Detection Alert</h2>
        </div>

        <div style="padding:25px;">

            <p>
            A potential threat has been detected by the
            <strong>Weapon Detection System (WDS)</strong>.
            </p>

            <table style="width:100%;border-collapse:collapse;">

                <tr>
                    <td><strong>Threat Type</strong></td>
                    <td>{threat}</td>
                </tr>

                <tr>
                    <td><strong>Confidence</strong></td>
                    <td>{confidence:.2%}</td>
                </tr>

                <tr>
                    <td><strong>Source</strong></td>
                    <td>{source}</td>
                </tr>

                <tr>
                    <td><strong>Time</strong></td>
                    <td>{timestamp}</td>
                </tr>

            </table>

            <br>

            <p>
            A potential threat has been detected.
            </p>

            <p>
            Please review the attached snapshot immediately.
            </p>

        </div>

        <div style="background:#f7f7f7;padding:15px;text-align:center;font-size:12px;color:#666;">
            Weapon Detection System (WDS)<br>
            AI-powered Real-Time Security Monitoring
        </div>

    </div>

    </body>
    </html>
    """

    msg.set_content(f"""
Weapon Detection Alert

Threat Type : {threat}
Confidence  : {confidence:.2%}
Source      : {source}
Time        : {timestamp}

A potential threat has been detected.

Please review the attached snapshot immediately.
""")

    msg.add_alternative(html, subtype="html")

    if os.path.exists(image_path):
        with open(image_path, "rb") as f:
            msg.add_attachment(
                f.read(),
                maintype="image",
                subtype="jpeg",
                filename=os.path.basename(image_path)
            )

    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.starttls()
        smtp.login(sender, password)
        smtp.send_message(msg)

    print("Alert email sent.")