from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.all_models import SchedulingRuleWeight

router = APIRouter(prefix="/rules", tags=["Scheduling Rules"])

class RuleWeightUpdate(BaseModel):
    rule_name: str
    weight: int
    is_enabled: bool = True

@router.get("")
def get_rules(db: Session = Depends(get_db)):
    rules = db.query(SchedulingRuleWeight).all()
    return rules

@router.post("/update")
def update_rules(updates: List[RuleWeightUpdate], db: Session = Depends(get_db)):
    for u in updates:
        r = db.query(SchedulingRuleWeight).filter(SchedulingRuleWeight.rule_name == u.rule_name).first()
        if r:
            r.weight = u.weight
            r.is_enabled = u.is_enabled
        else:
            db.add(SchedulingRuleWeight(rule_name=u.rule_name, weight=u.weight, is_enabled=u.is_enabled))
    db.commit()
    return {"status": "success", "message": "Rules updated"}
