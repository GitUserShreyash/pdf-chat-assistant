from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

models_to_test = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-pro",
]

for model in models_to_test:
    print(f"\n--- Testing model: {model} ---")
    try:
        response = client.models.generate_content(
            model=model,
            contents="Say 'success' if you receive this."
        )
        print(f"Result for {model}: {response.text.strip()}")
    except Exception as e:
        print(f"Error for {model}: {str(e)}")
