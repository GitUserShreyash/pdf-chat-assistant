from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any

class ChatMessageResponse(BaseModel):
    id: int
    sender: str
    content: str
    citations: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionDetailResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: List[ChatMessageResponse]

    class Config:
        from_attributes = True

class AskQuestionRequest(BaseModel):
    chat_id: Optional[int] = None
    document_ids: List[int]
    question: str

class AskQuestionResponse(BaseModel):
    answer: str
    chat_id: int
    citations: List[Dict[str, Any]]
    message_id: int
