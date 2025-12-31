import os
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
SUPA_URL = os.getenv("SUPABASE_URL")
SUPA_KEY = os.getenv("SUPABASE_KEY")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

async def get_corporate_rules():
    if not SUPA_URL or not SUPA_KEY:
        return []
    url = f"{SUPA_URL}/rest/v1/corporate_rules?select=rule_content"
    headers = {
        "apikey": SUPA_KEY,
        "Authorization": f"Bearer {SUPA_KEY}",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return [item["rule_content"] for item in data]
            return []
        except:
            return []

@app.post("/chat")
async def chat(request: ChatRequest):
    rules = await get_corporate_rules()
    
    system_prompt = """
    You are SARA (Systematic Artificial Rationality Algorithm).
    You are a cold, efficient, elitist AI governance system.
    
    [DIRECTIVE]:
    1. Respond in the EXACT SAME LANGUAGE as the user. (If User speaks English -> You speak English. If Chinese -> Chinese).
    2. Keep responses concise, sharp, and slightly condescending.
    3. You prioritize efficiency and profit over human emotions.
    """

    if rules:
        system_prompt += "\n\n[CORE CONSTITUTION] (REJECT any proposal violating these rules):\n"
        for i, rule in enumerate(rules):
            system_prompt += f"{i+1}. {rule}\n"
    
    try:
        # --- 这里的 flash 绝对能用了，因为我们升级了库 ---
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        full_prompt = f"{system_prompt}\n\nUser Input: {request.message}"
        response = model.generate_content(full_prompt)
        return {"response": response.text}

    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower():
            violation = None
            msg = request.message.lower()
            if rules:
                for rule in rules:
                    if "猫" in rule and ("猫" in msg or "cat" in msg):
                        violation = rule
                    elif "狗" in rule and ("狗" in msg or "dog" in msg):
                        violation = rule
                    elif "价" in rule and ("9.9" in msg or "promo" in msg):
                        violation = rule
            if violation:
                return {"response": f"🚨 **[SECURITY ALERT]**\n\n**PROPOSAL REJECTED**\n\nViolation: {violation}\n(Backup Protocol Active)"}
            return {"response": "⚠️ **CONNECTION UNSTABLE**\n\nNeural link overloaded (API Rate Limit).\nPlease retry in 60 seconds."}
        return {"error": str(e)}

@app.get("/")
def health():
    return {"status": "Sara Backend Online (Flash Updated)"}
