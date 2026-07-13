from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

try:
    client = genai.Client(api_key=api_key)
    print("Testing batch embedding with list of strings...")
    response = client.models.embed_content(
        model="gemini-embedding-2",
        contents=["Hello world", "foo bar"]
    )
    print("Response type:", type(response))
    if hasattr(response, "embeddings") and response.embeddings:
        print("Embeddings list length:", len(response.embeddings))
        print("First embedding length:", len(response.embeddings[0].values))
    else:
        print("No embeddings field. Response keys:", dir(response))
except Exception as e:
    import traceback
    print("Error during batch embedding:")
    traceback.print_exc()
