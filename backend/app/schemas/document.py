from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DocumentResponse(BaseModel):
    id: int
    name: str
    file_size: int
    created_at: datetime
    summary: Optional[str] = None
    owner_id: int

    class Config:
        from_attributes = True

class DocumentSummaryResponse(BaseModel):
    id: int
    summary: str
