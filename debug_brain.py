import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("? Key ???!")
else:
    print(f"?? Key ???: {api_key[:5]}...")
    genai.configure(api_key=api_key)
    
    print("\n?? ???? Google ??????...")
    try:
        # ?????????????
        available_models = []
        for m in genai.list_models():
            if "generateContent" in m.supported_generation_methods:
                print(f"? ??: {m.name}")
                available_models.append(m.name)
        
        if not available_models:
            print("?? ????,?????????????????? Key ?????")
    except Exception as e:
        print(f"? ????: {e}")

