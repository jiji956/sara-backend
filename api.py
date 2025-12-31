import os
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
SUPA_URL = os.getenv("SUPABASE_URL")
SUPA_KEY = os.getenv("SUPABASE_KEY")

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
    
    # 构建提示词
    system_prompt = """
    You are SARA.
    [DIRECTIVE]:
    1. Respond in the EXACT SAME LANGUAGE as the user.
    2. Be cold, efficient, and profit-driven.
    """

    if rules:
        system_prompt += "\n\n[CONSTITUTION]:\n"
        for i, rule in enumerate(rules):
            system_prompt += f"{i+1}. {rule}\n"
    
    final_prompt = f"{system_prompt}\n\nUser: {request.message}"

    try:
        # --- [核心修改] 使用你的账号支持的 gemini-2.0-flash ---
        # 你的截图里明确显示有 models/gemini-2.0-flash
        target_model = "gemini-2.0-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={GEMINI_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{"text": final_prompt}]
            }]
        }
        
        headers = {"Content-Type": "application/json"}

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=30.0)
            
            if response.status_code == 200:
                data = response.json()
                # 提取回答
                ai_text = data.get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")
                return {"response": ai_text}
            
            else:
                # 如果还是报错，我们打印出来看
                error_body = response.text
                print(f"GOOGLE ERROR: {response.status_code} - {error_body}")
                raise Exception(f"Google Error {response.status_code}")

    except Exception as e:
        # 熔断机制
        msg = request.message.lower()
        violation = None
        if rules:
            for rule in rules:
                if "猫" in rule and ("猫" in msg or "cat" in msg): violation = rule
                if "狗" in rule and ("狗" in msg or "dog" in msg): violation = rule
        
        if violation:
             return {"response": f"🚨 **[SECURITY ALERT]**\n\n**REJECTED**\nViolation: {violation}"}

        return {"response": f"⚠️ **CONNECTION FAILURE**\n\nError: {str(e)}\n(Model: gemini-2.0-flash)"}

@app.get("/")
def health():
    return {"status": "Sara Backend Online (Gemini 2.0)"}
