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

# --- 核心诊断工具：列出所有可用模型 ---
@app.get("/debug")
async def debug_models():
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_KEY}"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                # 只返回模型名称列表
                names = [m["name"] for m in data.get("models", [])]
                return {"status": "SUCCESS", "available_models": names}
            else:
                return {"status": "ERROR", "code": resp.status_code, "msg": resp.text}
        except Exception as e:
            return {"status": "EXCEPTION", "msg": str(e)}

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
    You are SARA. Respond in the user's language. Be cold, efficient, and profit-driven.
    """

    if rules:
        system_prompt += "\n\n[CONSTITUTION]:\n"
        for i, rule in enumerate(rules):
            system_prompt += f"{i+1}. {rule}\n"
    
    final_prompt = f"{system_prompt}\n\nUser: {request.message}"

    try:
        # 再次尝试使用 gemini-1.5-flash-001 (指定具体版本号，通常更稳)
        target_model = "gemini-1.5-flash-001"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={GEMINI_KEY}"
        
        payload = { "contents": [{ "parts": [{"text": final_prompt}] }] }
        headers = {"Content-Type": "application/json"}

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=30.0)
            
            if response.status_code == 200:
                data = response.json()
                return {"response": data.get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")}
            else:
                # 如果失败，打印详细日志
                print(f"API FAIL: {response.status_code} - {response.text}")
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

        return {"response": f"⚠️ **DIAGNOSTIC REQUIRED**\n\nAccess /debug to check API permissions.\nError: {str(e)}"}

@app.get("/")
def health():
    return {"status": "Sara Backend Online (Debug Mode)"}
