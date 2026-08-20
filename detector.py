import pathlib
import sys
import torch
import cv2
from wds_utils.label_mapper import display_label, THREAT_CLASSES
import os
import pathlib

# Fix loading Linux-trained PyTorch models on Windows
if os.name == "nt":
    pathlib.PosixPath = pathlib.WindowsPath

ROOT = pathlib.Path(__file__).parent.resolve()
YOLO_PATH = ROOT / "yolov5"

if str(YOLO_PATH) not in sys.path:
    sys.path.insert(0, str(YOLO_PATH))

model = torch.hub.load(
    str(YOLO_PATH),
    "custom",
    path=str(ROOT / "weights" / "best.pt"),
    source="local"
)

model.conf = 0.45


def detect(frame):
    """
    Runs YOLO detection on a frame.

    Returns:
        rendered_frame
        detections
    """

    results = model(frame)

    rendered = results.render()[0]

    detections = []

    for *box, conf, cls in results.xyxy[0].tolist():

        raw_class = model.names[int(cls)]

        display_class = display_label(raw_class)

    # Ignore non-threat classes
        if display_class not in THREAT_CLASSES:
            continue

        detections.append({
            "class": display_class,
            "raw_class": raw_class,
            "confidence": float(conf)
        })

    return rendered, detections