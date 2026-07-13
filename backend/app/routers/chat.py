from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.document import Document
from app.schemas.chat import (
    ChatSessionResponse, ChatSessionDetailResponse, 
    AskQuestionRequest, AskQuestionResponse
)
from app.services.vector_store import VectorStoreService
from app.services.rag_service import RAGService

router = APIRouter(prefix="/chat", tags=["chat"])
vector_store = VectorStoreService()
rag_service = RAGService()

@router.get("/history", response_model=List[ChatSessionResponse])
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all chat sessions for the authenticated user."""
    return db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.created_at.desc()).all()

@router.get("/sessions/{chat_id}", response_model=ChatSessionDetailResponse)
def get_chat_session(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves a single chat session with all its messages."""
    session = db.query(ChatSession).filter(
        ChatSession.id == chat_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )
    return session

@router.delete("/sessions/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat_session(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a chat session and all its messages."""
    session = db.query(ChatSession).filter(
        ChatSession.id == chat_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )
        
    db.delete(session)
    db.commit()
    return None

@router.post("/ask", response_model=AskQuestionResponse)
def ask_question(
    request: AskQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Asks a question about one or more documents.
    Retrieves context, calls LLM, saves message history, and returns the answer.
    """
    # 1. Security Check: Verify user owns all requested documents
    owned_docs = db.query(Document).filter(
        Document.id.in_(request.document_ids),
        Document.owner_id == current_user.id
    ).all()
    
    if len(owned_docs) != len(request.document_ids):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to one or more selected documents."
        )

    # 2. Get or create Chat Session
    if request.chat_id:
        chat_session = db.query(ChatSession).filter(
            ChatSession.id == request.chat_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not chat_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found."
            )
    else:
        # Create a new session
        title = request.question[:30] + "..." if len(request.question) > 30 else request.question
        chat_session = ChatSession(
            title=title,
            user_id=current_user.id
        )
        db.add(chat_session)
        db.commit()
        db.refresh(chat_session)

    # 3. Retrieve relevant context chunks from Vector Store
    # We query top 5 chunks
    try:
        similar_chunks = vector_store.search_similar_chunks(
            document_ids=request.document_ids,
            query=request.question,
            top_k=5
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error querying vector database: {str(e)}"
        )

    # 4. Generate Answer using LLM
    try:
        answer = rag_service.generate_answer(
            question=request.question,
            context_chunks=similar_chunks
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM generation failed: {str(e)}"
        )

    # 5. Save user message to database
    user_msg = ChatMessage(
        sender="user",
        content=request.question,
        chat_id=chat_session.id
    )
    db.add(user_msg)

    # 6. Save assistant response with citations to database
    # Citations will store matching snippets and page sources
    citations_data = [
        {
            "page": chunk["page"],
            "text": chunk["text"],
            "document_id": chunk["document_id"]
        } for chunk in similar_chunks
    ]
    
    assistant_msg = ChatMessage(
        sender="assistant",
        content=answer,
        citations=citations_data,
        chat_id=chat_session.id
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return {
        "answer": answer,
        "chat_id": chat_session.id,
        "citations": citations_data,
        "message_id": assistant_msg.id
    }
