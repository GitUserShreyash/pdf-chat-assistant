from google import genai
from google.genai.errors import APIError
from app.core.config import settings
from typing import List, Dict, Any

class RAGService:
    def __init__(self):
        self.ai_client = None
        if settings.GEMINI_API_KEY:
            self.ai_client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def _get_ai_client(self) -> genai.Client:
        if not self.ai_client:
            if settings.GEMINI_API_KEY:
                self.ai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            else:
                raise ValueError("GEMINI_API_KEY is not set in the environment.")
        return self.ai_client

    def generate_answer(self, question: str, context_chunks: List[Dict[str, Any]]) -> str:
        """
        Generates an answer based on retrieved context chunks.
        Encourages the LLM to format citations directly in the response.
        """
        if not context_chunks:
            return "No relevant context was found in the documents to answer this question."

        client = self._get_ai_client()
        
        # Build prompt context
        context_str = ""
        for i, chunk in enumerate(context_chunks):
            context_str += f"\n--- Context Source [{i+1}] (Page {chunk['page']}) ---\n"
            context_str += chunk["text"]
            context_str += "\n-------------------------------------\n"

        prompt = f"""You are a helpful assistant answering questions based on the provided PDF document context.
Your goal is to answer the user's question using ONLY the facts present in the Context sources listed below.

Instructions:
1. Provide a direct, factual, and complete answer.
2. If the context does not contain the information required to answer, state: "I cannot find the answer in the provided documents." Do not try to make up an answer.
3. You MUST include citations in your answer when referencing information from the sources. Use the format `[Page X]` referencing the page number specified in the source header.
4. Keep the answer clear and professional.

Context:
{context_str}

Question: {question}
Answer:"""

        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=prompt
            )
            return response.text or "No response could be generated."
        except APIError as e:
            raise RuntimeError(f"Gemini API Error: {str(e)}")

    def generate_summary(self, document_text: str) -> str:
        """Generates a summary of the extracted text of a document."""
        if not document_text.strip():
            return "No text available to summarize."
            
        client = self._get_ai_client()
        
        # Limit text length to avoid token limits for summary (gemini-2.5-flash has large context, but let's keep it compact)
        max_summary_input = 20000  # ~5000 words
        text_to_summarize = document_text[:max_summary_input]
        
        prompt = f"""You are an expert document summarizer. Summarize the following document text into a concise, professional, and clear executive summary.
Highlight the primary topics, key takeaways, and conclusions. Format with bullet points if appropriate.

Document Text:
{text_to_summarize}

Executive Summary:"""

        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=prompt
            )
            return response.text or "Could not generate a summary."
        except APIError as e:
            raise RuntimeError(f"Gemini API Error: {str(e)}")
