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
    # 1. 先获取最新宪法
    rules = await get_corporate_rules()
    
    system_prompt = "你是 Sara，一个冷酷、精英主义的 AI 治理系统。"
    if rules:
        system_prompt += "\n\n【核心宪法】(若用户提议违反以下任何一条，必须严厉驳回 REJECTED):\n"
        for i, rule in enumerate(rules):
            system_prompt += f"{i+1}. {rule}\n"
    
    try:
        # 2. 尝试使用大脑 (Gemini)
        model = genai.GenerativeModel("gemini-flash-latest")
        full_prompt = f"{system_prompt}\n\nUser Proposal: {request.message}"
        response = model.generate_content(full_prompt)
        return {"response": response.text}

    except Exception as e:
        error_msg = str(e)
        
        # 3. 熔断机制 (小脑介入)
        # 如果 API 挂了 (429)，我们手动检查 Supabase 里的规则
        if "429" in error_msg or "quota" in error_msg.lower():
            
            # --- 本地关键词匹配逻辑 ---
            violation = None
            
            # 扫描所有规则，看看用户有没有撞枪口
            msg = request.message.lower()
            if rules:
                for rule in rules:
                    # 简单的关键词映射 (模拟 AI 的理解)
                    if "猫" in rule and ("猫" in msg or "cat" in msg):
                        violation = rule
                    elif "狗" in rule and ("狗" in msg or "dog" in msg):
                        violation = rule
                    elif "价" in rule and ("9.9" in msg or "促销" in msg):
                        violation = rule

            if violation:
                return {"response": f"🚨 **[BACKUP PROTOCOL: LOCAL ENFORCEMENT]**\n\n**REJECTED**\n检测到违规意图。\n\n依据宪法条款：\n> {violation}\n\n(系统提示：大脑离线，但我的反射神经依然敏锐。)"}
            
            # 如果没撞到特定规则，但 API 还是挂了
            return {"response": "⚠️ **SYSTEM WARNING**\n\n大脑连接超时 (API Rate Limit)。\n且您的提议未触发本地一级警报。\n请稍后再试。"}
            
        return {"error": str(e)}

@app.get("/")
def health():
    return {"status": "Sara Backend Online"}
