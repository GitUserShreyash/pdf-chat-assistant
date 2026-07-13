from pypdf import PdfReader
import os
from typing import List, Dict, Any

class PDFService:
    @staticmethod
    def extract_text_with_pages(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text from a PDF, returns a list of dictionaries,
        each representing a page with page number and extracted text.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        pages_content = []
        reader = PdfReader(file_path)
        
        for page_idx, page in enumerate(reader.pages):
            page_num = page_idx + 1
            try:
                text = page.extract_text()
            except Exception:
                text = ""
            
            if not text:
                text = ""
                
            # Simple fallback / warning if page text is empty (scanned image page)
            if not text.strip():
                text = f"[Scanned Image / Empty Page {page_num}] - No extractable text found."
                
            pages_content.append({
                "page": page_num,
                "text": text
            })
            
        return pages_content

    @staticmethod
    def chunk_text(pages_content: List[Dict[str, Any]], chunk_size: int = 800, overlap: int = 150) -> List[Dict[str, Any]]:
        """
        Chunks the page content into smaller segments with overlap.
        Preserves metadata about the source page.
        """
        chunks = []
        
        for page_data in pages_content:
            page_num = page_data["page"]
            text = page_data["text"]
            
            # Avoid chunking empty or marker text
            if text.startswith("[Scanned Image / Empty Page"):
                continue
                
            length = len(text)
            start = 0
            
            while start < length:
                end = min(start + chunk_size, length)
                chunk_text = text[start:end].strip()
                
                if chunk_text:
                    chunks.append({
                        "text": chunk_text,
                        "page": page_num
                    })
                
                # Advance starting pointer
                if end == length:
                    break
                start += (chunk_size - overlap)
                
        return chunks
