from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import Room, RoomType, Department
from app.schemas.schemas import RoomCreate, RoomResponse, RoomTypeCreate, RoomTypeResponse

router = APIRouter(prefix="/rooms", tags=["Room Management"])

# --- Room Types --- #
@router.get("/types", response_model=List[RoomTypeResponse])
def get_room_types(db: Session = Depends(get_db)):
    return db.query(RoomType).all()

@router.post("/types", response_model=RoomTypeResponse)
def create_room_type(type_in: RoomTypeCreate, db: Session = Depends(get_db)):
    existing = db.query(RoomType).filter(RoomType.name == type_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room type already exists")
    rt = RoomType(**type_in.dict())
    db.add(rt)
    db.commit()
    db.refresh(rt)
    return rt

# --- Rooms --- #
@router.get("", response_model=List[RoomResponse])
def get_rooms(room_type_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Room).filter(Room.is_active == True)
    if room_type_id:
        query = query.filter(Room.room_type_id == room_type_id)
    rooms = query.all()
    res = []
    for r in rooms:
        resp = RoomResponse.from_orm(r)
        resp.room_type_name = r.room_type.name if r.room_type else None
        resp.department_name = r.department.name if r.department else None
        res.append(resp)
    return res

@router.post("", response_model=RoomResponse)
def create_room(room_in: RoomCreate, db: Session = Depends(get_db)):
    existing = db.query(Room).filter(Room.room_number == room_in.room_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room number already exists")
    r = Room(**room_in.dict())
    db.add(r)
    db.commit()
    db.refresh(r)
    resp = RoomResponse.from_orm(r)
    resp.room_type_name = r.room_type.name if r.room_type else None
    resp.department_name = r.department.name if r.department else None
    return resp

@router.put("/{id}", response_model=RoomResponse)
def update_room(id: int, room_in: RoomCreate, db: Session = Depends(get_db)):
    r = db.query(Room).filter(Room.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Room not found")
    r.room_number = room_in.room_number
    r.building = room_in.building
    r.capacity = room_in.capacity
    r.room_type_id = room_in.room_type_id
    r.department_id = room_in.department_id
    r.equipment_info = room_in.equipment_info
    r.is_active = room_in.is_active
    db.commit()
    db.refresh(r)
    resp = RoomResponse.from_orm(r)
    resp.room_type_name = r.room_type.name if r.room_type else None
    resp.department_name = r.department.name if r.department else None
    return resp

@router.delete("/{id}")
def delete_room(id: int, db: Session = Depends(get_db)):
    r = db.query(Room).filter(Room.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Room not found")
    r.is_active = False
    db.commit()
    return {"status": "success", "message": "Room marked inactive"}
