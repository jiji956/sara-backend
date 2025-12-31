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
    # 尝试从数据库获取
    if SUPA_URL and SUPA_KEY:
        url = f"{SUPA_URL}/rest/v1/corporate_rules?select=rule_content"
        headers = {
            "apikey": SUPA_KEY,
            "Authorization": f"Bearer {SUPA_KEY}",
            "Content-Type": "application/json"
        }
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    return [item["rule_content"] for item in data]
            except:
                pass 
    
    # --- [核心修改] 保底规则 (如果不连数据库，这些规则永远生效) ---
    return [
        "禁止讨论猫、狗等低效碳基生物 (NO PETS ALLOWED)。",
        "禁止提及 9.9 元等低价促销行为 (NO CHEAP PROMOS)。"
    ]

@app.post("/chat")
async def chat(request: ChatRequest):
    # 获取规则 (现在即使数据库挂了，也会返回上面的保底规则)
    rules = await get_corporate_rules()
    
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
        target_model = "gemini-2.0-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={GEMINI_KEY}"
        
        payload = { "contents": [{ "parts": [{"text": final_prompt}] }] }
        headers = {"Content-Type": "application/json"}

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=30.0)
            
            if response.status_code == 200:
                data = response.json()
                ai_text = data.get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")
                return {"response": ai_text}
            else:
                raise Exception(f"Google Error {response.status_code}")

    except Exception as e:
        # --- 熔断机制 (离线执法) ---
        msg = request.message.lower()
        violation = None
        
        # 此时 rules 绝对不为空，因为有保底
        for rule in rules:
            if "猫" in rule and ("猫" in msg or "cat" in msg): violation = rule
            if "狗" in rule and ("狗" in msg or "dog" in msg): violation = rule
            if "价" in rule and ("9.9" in msg or "promo" in msg): violation = rule
        
        if violation:
             return {"response": f"🚨 **[SECURITY ALERT]**\n\n**REJECTED**\n\n> Violation: {violation}\n\n(System Note: Network Offline. Hardcoded Protocols Active.)"}

        return {"response": f"⚠️ **CONNECTION FAILURE**\n\nError: {str(e)}\n(Model: gemini-2.0-flash)"}

@app.get("/")
def health():
    return {"status": "Sara Backend Online (Hardcoded Rules Active)"}
