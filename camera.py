import os
import cv2
from datetime import datetime
from pathlib import Path

from flask import current_app

from detector import detect

from db_models import db, Detection
from email_service import send_alert_email


BASE_DIR = Path(__file__).resolve().parent

SNAPSHOT_DIR = BASE_DIR / "static" / "snapshots"
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)


def _save_detection(
    threats,
    rendered,
    source,
    last_saved,
    last_email,
    recipient
):
    """
    Save a detection snapshot, database records, and email alert.

    Returns:
        updated_last_saved,
        updated_last_email
    """

    if not threats:
        return last_saved, last_email

    now = datetime.now()

    # Save a snapshot at most once every 15 seconds.
    should_save = (
        last_saved is None
        or (now - last_saved).total_seconds() >= 15
    )

    if not should_save:
        return last_saved, last_email

    filename = now.strftime("%Y%m%d_%H%M%S") + ".jpg"

    path = SNAPSHOT_DIR / filename

    cv2.imwrite(
        str(path),
        rendered
    )

    # Database logging
    for item in threats:

        detection = Detection(
            filename=filename,
            threat=item["class"],
            confidence=item["confidence"],
            source=source
        )

        db.session.add(detection)

    db.session.commit()

    # Email cooldown: maximum one alert every 60 seconds.
    should_email = (
        last_email is None
        or (now - last_email).total_seconds() >= 60
    )

    if should_email:

        try:

            send_alert_email(
                receiver=recipient,
                threat=threats[0]["class"],
                confidence=threats[0]["confidence"],
                timestamp=now.strftime(
                    "%d %b %Y | %I:%M %p"
                ),
                image_path=str(path)
            )

            last_email = now

        except Exception as error:

            print(
                f"Email alert failed: {error}"
            )

    last_saved = now

    return last_saved, last_email


def process_detected_frame(
    frame,
    app,
    source="Live Camera",
    recipient=None
):
    """
    Process one frame through YOLOv5.

    `app` is the Flask application instance. It is required (rather than
    relying on an already-active request context) because this function is
    called both from inside a normal request (/detect_frame) and from a
    generator (generate_frames) that keeps running after the request that
    started it has completed, where no app context would otherwise be
    active. Pushing the context here makes both call sites safe and keeps
    the save/email cooldown state (current_app._last_saved /
    current_app._last_email) consistent regardless of caller.

    Returns:
        rendered: annotated image
        detections: list of detected threats
    """

    rendered, detections = detect(frame)

    with app.app_context():

        if not hasattr(current_app, "_last_saved"):
            current_app._last_saved = None

        if not hasattr(current_app, "_last_email"):
            current_app._last_email = None

        current_app._last_saved, current_app._last_email = (
            _save_detection(
                threats=detections,
                rendered=rendered,
                source=source,
                last_saved=current_app._last_saved,
                last_email=current_app._last_email,
                recipient=recipient
            )
        )

    return rendered, detections


def generate_frames(app, source, recipient):
    """
    Generate a continuous MJPEG stream from an IP camera (or webcam index)
    with YOLOv5 detection applied to every frame.

    source:
        "http://.../video" -> IP camera stream
        0                  -> local webcam index
    """

    camera = cv2.VideoCapture(source)

    if not camera.isOpened():

        raise RuntimeError(
            f"Unable to open camera source: {source}"
        )

    try:

        while True:

            success, frame = camera.read()

            if not success:

                print(
                    f"Unable to read frame from camera: {source}"
                )

                break

            try:

                # process_detected_frame already saves snapshots/DB rows/
                # email alerts internally (with its own cooldown state), so
                # there is no separate save step needed here.
               rendered, threats = process_detected_frame(
                    frame,
                    app,
                    source="IP Camera",
                    recipient=recipient
                )

            except Exception as error:

                print(
                    f"Detection error: {error}"
                )

                rendered = frame
                threats = []

            # Encode processed frame for MJPEG stream.
            success, buffer = cv2.imencode(
                ".jpg",
                rendered
            )

            if not success:
                continue

            frame_bytes = buffer.tobytes()

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + frame_bytes
                + b"\r\n"
            )

    finally:

        camera.release()
