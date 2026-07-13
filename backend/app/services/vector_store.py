import math
from typing import List, Dict, Any
from app.core.database import SessionLocal
from app.models.document import DocumentChunk
from google import genai
from google.genai.errors import APIError
from app.core.config import settings

class VectorStoreService:
    def __init__(self):
        self.ai_client = None
        if settings.GEMINI_API_KEY:
            self.ai_client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def _get_ai_client(self) -> genai.Client:
        if not self.ai_client:
            if settings.GEMINI_API_KEY:
                self.ai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            else:
                raise ValueError("GEMINI_API_KEY environment variable is not set. Please add it to your .env file.")
        return self.ai_client

    def get_embedding(self, text: str) -> List[float]:
        """Generates embedding for a single text chunk using Gemini's text-embedding-004."""
        client = self._get_ai_client()
        try:
            response = client.models.embed_content(
                model="gemini-embedding-2",
                contents=text
            )
            if response.embeddings:
                return response.embeddings[0].values
            elif hasattr(response, "embedding") and response.embedding:
                return response.embedding.values
            else:
                raise ValueError("Unexpected response format from Gemini Embeddings API")
        except APIError as e:
            raise RuntimeError(f"Gemini API Error generating embedding: {str(e)}")

    def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generates embeddings for a batch of text chunks by calling get_embedding sequentially."""
        return [self.get_embedding(t) for t in texts]

    def add_document_chunks(self, document_id: int, chunks: List[Dict[str, Any]]):
        """
        Generates embeddings for chunks and adds them to SQL database.
        Each chunk is dict with "text" and "page".
        """
        if not chunks:
            return
            
        texts = [chunk["text"] for chunk in chunks]
        
        # Batch size for embedding calls
        batch_size = 50
        embeddings = []
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            batch_embs = self.get_embeddings_batch(batch_texts)
            embeddings.extend(batch_embs)
            
        db = SessionLocal()
        try:
            for idx, chunk in enumerate(chunks):
                db_chunk = DocumentChunk(
                    document_id=int(document_id),
                    page=int(chunk["page"]),
                    text=chunk["text"],
                    embedding=embeddings[idx]
                )
                db.add(db_chunk)
            db.commit()
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

    def search_similar_chunks(self, document_ids: List[int], query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Searches SQL database for relevant chunks matching the query, 
        filtered by the provided document IDs, and ranks them using cosine similarity in Python.
        """
        if not document_ids:
            return []
            
        query_emb = self.get_embedding(query)
        
        db = SessionLocal()
        try:
            # Query all chunks associated with selected document IDs
            chunks = db.query(DocumentChunk).filter(
                DocumentChunk.document_id.in_([int(d) for d in document_ids])
            ).all()
            
            if not chunks:
                return []
                
            # Calculate cosine similarity for all chunks
            scored_chunks = []
            for chunk in chunks:
                sim = self._cosine_similarity(query_emb, chunk.embedding)
                scored_chunks.append({
                    "text": chunk.text,
                    "page": chunk.page,
                    "document_id": chunk.document_id,
                    "similarity": sim
                })
                
            # Sort by similarity descending
            scored_chunks.sort(key=lambda x: x["similarity"], reverse=True)
            
            # Return top_k
            return scored_chunks[:top_k]
        finally:
            db.close()

    def delete_document_chunks(self, document_id: int):
        """Deletes all chunks associated with a document_id from database (handled by cascade but kept for compatibility)."""
        db = SessionLocal()
        try:
            db.query(DocumentChunk).filter(DocumentChunk.document_id == int(document_id)).delete()
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        """Calculates cosine similarity between two float vectors."""
        dot_product = sum(a * b for a, b in zip(v1, v2))
        norm_v1 = math.sqrt(sum(a * a for a in v1))
        norm_v2 = math.sqrt(sum(b * b for b in v2))
        if norm_v1 * norm_v2 == 0:
            return 0.0
        return dot_product / (norm_v1 * norm_v2)
