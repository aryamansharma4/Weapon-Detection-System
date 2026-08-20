from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Detection(db.Model):
    __tablename__ = "detections"

    id = db.Column(db.Integer, primary_key=True)

    filename = db.Column(db.String(200), nullable=False)

    threat = db.Column(db.String(50), nullable=False)

    confidence = db.Column(db.Float, nullable=False)

    source = db.Column(db.String(50), nullable=False)

    timestamp = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    email = db.Column(
        db.String(150),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )