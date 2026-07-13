from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

try:
    client = genai.Client(api_key=api_key)
    print("Testing gemini-embedding-2...")
    response = client.models.embed_content(
        model="gemini-embedding-2",
        contents="Hello world"
    )
    # Check embeddings
    if response.embeddings:
        print("Success! Embedding length:", len(response.embeddings[0].values))
    elif hasattr(response, "embedding") and response.embedding:
        print("Success! Embedding length:", len(response.embedding.values))
    else:
        print("Response:", response)
except Exception as e:
    print("Error:", str(e))
