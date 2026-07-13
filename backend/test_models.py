from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
try:
    client = genai.Client(api_key=api_key)
    print("Listing models...")
    for model in client.models.list():
        # Print the model object attributes or dictionary
        print(f"Model Name: {model.name}")
        # Try printing other fields if available
        if hasattr(model, 'supported_generation_methods'):
            print(f"  supported_generation_methods: {model.supported_generation_methods}")
        elif hasattr(model, 'supported_generation_method'):
            print(f"  supported_generation_method: {model.supported_generation_method}")
except Exception as e:
    print("Error listing models:", str(e))
