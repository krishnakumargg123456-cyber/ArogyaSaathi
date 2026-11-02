"""
ArogyaSaathi Tamper-Evident Audit Service
Computes SHA-256 hash chaining for security and compliance
"""
import hashlib
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.entities import AuditEvent

def log_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    device_id: Optional[str] = None
) -> AuditEvent:
    # Fetch last audit event hash to chain
    last_event = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).first()
    prev_hash = last_event.hash_signature if last_event and last_event.hash_signature else "GENESIS_BLOCK"

    now = datetime.now(timezone.utc)
    raw_payload = f"{prev_hash}|{actor_id}|{action}|{entity_type}|{entity_id}|{details}|{now.isoformat()}"
    new_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

    event = AuditEvent(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address,
        device_id=device_id,
        timestamp=now,
        hash_signature=new_hash
    )
    db.add(event)
    db.commit()
    return event

