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
else:
    print("Warning: GEMINI_API_KEY not set")

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
    
    system_prompt = "你是 Sara，一个冷酷、精英主义的 AI 治理系统。"
    if rules:
        system_prompt += "\n\n【核心宪法】(若用户提议违反以下任何一条，必须严厉驳回 REJECTED):\n"
        for i, rule in enumerate(rules):
            system_prompt += f"{i+1}. {rule}\n"
    
    try:
        # --- 关键修改：切换到 gemini-1.5-flash ---
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        full_prompt = f"{system_prompt}\n\nUser Proposal: {request.message}"
        response = model.generate_content(full_prompt)
        return {"response": response.text}

    except Exception as e:
        error_msg = str(e)
        
        # 熔断机制 (依然保留，双重保险)
        if "429" in error_msg or "quota" in error_msg.lower():
            violation = None
            msg = request.message.lower()
            if rules:
                for rule in rules:
                    if "猫" in rule and ("猫" in msg or "cat" in msg):
                        violation = rule
                    elif "狗" in rule and ("狗" in msg or "dog" in msg):
                        violation = rule
                    elif "价" in rule and ("9.9" in msg or "促销" in msg):
                        violation = rule

            if violation:
                return {"response": f"🚨 **[BACKUP PROTOCOL]**\n\n**REJECTED**\n检测到违规意图 (数据库规则匹配)。\n\n依据条款：\n> {violation}\n\n(系统提示：API 限流中，启用本地执法。)"}
            
            return {"response": "⚠️ **SYSTEM WARNING**\n\n大脑连接超时 (API Rate Limit)。\n请稍后再试。"}
            
        return {"error": str(e)}

@app.get("/")
def health():
    return {"status": "Sara Backend Online"}
