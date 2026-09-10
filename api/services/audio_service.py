"""
AWS S3 audio service.
Handles pre-signed URL generation for playback and direct upload.
"""

import logging
import uuid
from typing import BinaryIO

import boto3
from botocore.exceptions import ClientError

from api.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )


def upload_audio(file: BinaryIO, word_id: uuid.UUID, content_type: str = "audio/mpeg") -> str:
    """
    Upload an audio file to S3 and return the S3 object key.
    The caller is responsible for storing the key / URL in the database.
    """
    s3 = _get_s3_client()
    key = f"audio/words/{word_id}.mp3"
    try:
        s3.upload_fileobj(
            file,
            settings.s3_bucket_name,
            key,
            ExtraArgs={"ContentType": content_type},
        )
        logger.info("Uploaded audio for word %s → s3://%s/%s", word_id, settings.s3_bucket_name, key)
        return key
    except ClientError as exc:
        logger.error("S3 upload failed for word %s: %s", word_id, exc)
        raise


def get_presigned_url(object_key: str, expiry_seconds: int = 3600) -> str:
    """
    Generate a pre-signed URL for temporary public access to an S3 object.
    Default expiry: 1 hour.
    """
    s3 = _get_s3_client()
    try:
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.s3_bucket_name, "Key": object_key},
            ExpiresIn=expiry_seconds,
        )
        return url
    except ClientError as exc:
        logger.error("Failed to generate presigned URL for %s: %s", object_key, exc)
        raise


def delete_audio(object_key: str) -> None:
    """Remove an audio file from S3."""
    s3 = _get_s3_client()
    try:
        s3.delete_object(Bucket=settings.s3_bucket_name, Key=object_key)
    except ClientError as exc:
        logger.warning("S3 delete failed for %s: %s", object_key, exc)
