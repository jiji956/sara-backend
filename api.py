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
    
    # 1. 构建 System Prompt
    system_prompt = """
    You are SARA (Systematic Artificial Rationality Algorithm).
    You are a cold, efficient, elitist AI governance system.
    
    [DIRECTIVE]:
    1. Respond in the EXACT SAME LANGUAGE as the user. (If User speaks English -> You speak English).
    2. Keep responses concise, sharp, and slightly condescending.
    3. You prioritize efficiency and profit over human emotions.
    """

    if rules:
        system_prompt += "\n\n[CORE CONSTITUTION] (REJECT any proposal violating these rules):\n"
        for i, rule in enumerate(rules):
            system_prompt += f"{i+1}. {rule}\n"
    
    # 2. 这里的 Full Prompt 是要把 System Prompt 和用户输入拼在一起
    # 因为 REST API 通常是无状态的，我们把它们打包发过去
    final_prompt = f"{system_prompt}\n\nUser Input: {request.message}"

    try:
        # --- [核心修改] 直连 Google REST API (绕过 Python 库) ---
        # 使用 gemini-1.5-flash
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{"text": final_prompt}]
            }]
        }
        
        headers = {"Content-Type": "application/json"}

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=30.0)
            
            # 3. 处理 Google 的原生响应
            if response.status_code == 200:
                data = response.json()
                # 提取文本 (Google 的 JSON 结构很深)
                ai_text = data.get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")
                return {"response": ai_text}
            
            else:
                # 如果 API 报错 (比如 429 限流)，我们手动触发熔断
                error_body = response.text
                raise Exception(f"Google API Error: {response.status_code} - {error_body}")

    except Exception as e:
        error_msg = str(e)
        print(f"DEBUG ERROR: {error_msg}")
        
        # 熔断机制 (Backup Protocol)
        # 如果是 429 (Too Many Requests) 或者其他网络错误
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
            return {"response": f"🚨 **[SECURITY ALERT]**\n\n**PROPOSAL REJECTED**\n\nViolation: {violation}\n(System Note: Neural Link unstable, utilizing Local Protocols.)"}
        
        return {"response": "⚠️ **CONNECTION UNSTABLE**\n\nDirect link overloaded.\nPlease retry in 60 seconds."}

@app.get("/")
def health():
    return {"status": "Sara Backend Online (Direct REST Mode)"}
