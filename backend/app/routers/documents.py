from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks
from sqlalchemy.orm import Session
import os
import shutil
from typing import List
from app.core.database import get_db
from app.core.config import settings
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentSummaryResponse
from app.services.pdf_service import PDFService
from app.services.vector_store import VectorStoreService
from app.services.rag_service import RAGService

router = APIRouter(prefix="/documents", tags=["documents"])
vector_store = VectorStoreService()
rag_service = RAGService()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads a PDF document, parses it, chunks it, and creates vector embeddings.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )

    # Make target file path
    file_name = file.filename
    # Avoid collisions by adding user prefix or using UUID
    safe_filename = f"user_{current_user.id}_{file_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    # Save file to disk
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
        
    file_size = os.path.getsize(file_path)

    db_document = None
    try:
        # Create database entry
        db_document = Document(
            name=file_name,
            file_path=file_path,
            file_size=file_size,
            owner_id=current_user.id
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)

        # Process PDF: Extract text pages
        pages_content = PDFService.extract_text_with_pages(file_path)
        
        # Chunk text
        chunks = PDFService.chunk_text(pages_content)
        
        # Generate Embeddings & Add to Vector Store (ChromaDB)
        vector_store.add_document_chunks(document_id=db_document.id, chunks=chunks)
        
        return db_document

    except Exception as e:
        # Cleanup files and db records on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        if db_document and db_document.id:
            try:
                vector_store.delete_document_chunks(db_document.id)
            except Exception:
                pass
            db.delete(db_document)
            db.commit()
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index PDF: {str(e)}"
        )

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all documents uploaded by the current user."""
    return db.query(Document).filter(Document.owner_id == current_user.id).all()

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a document, its file on disk, and its vectors from ChromaDB."""
    doc = db.query(Document).filter(
        Document.id == document_id, 
        Document.owner_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # 1. Delete file on disk
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass # continue deleting records anyway
            
    # 2. Delete vectors
    try:
        vector_store.delete_document_chunks(doc.id)
    except Exception:
        pass # continue deleting metadata
        
    # 3. Delete DB record
    db.delete(doc)
    db.commit()
    return None

@router.post("/{document_id}/summary", response_model=DocumentSummaryResponse)
def summarize_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates and returns an executive summary of the document, caching it in the DB."""
    doc = db.query(Document).filter(
        Document.id == document_id, 
        Document.owner_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
        
    # Return cached summary if already generated
    if doc.summary:
        return {"id": doc.id, "summary": doc.summary}
        
    try:
        # Extract content of PDF
        pages = PDFService.extract_text_with_pages(doc.file_path)
        full_text = "\n".join([p["text"] for p in pages])
        
        # Run Summary RAG
        summary = rag_service.generate_summary(full_text)
        
        # Save to DB
        doc.summary = summary
        db.commit()
        
        return {"id": doc.id, "summary": summary}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )
