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
    # 使用更稳定的 1.5 Flash 模型
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
    # 获取数据库规则 (即使规则是中文写的，Gemini 也能理解并跨语言执行)
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
    
    # --- 核心修改：英文指令 + 多语言适配要求 ---
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
        model = genai.GenerativeModel("gemini-1.5-flash")
        full_prompt = f"{system_prompt}\n\nUser Input: {request.message}"
        response = model.generate_content(full_prompt)
        return {"response": response.text}

    except Exception as e:
        error_msg = str(e)
        
        # 熔断机制 (改为国际化英文版)
        if "429" in error_msg or "quota" in error_msg.lower():
            violation = None
            msg = request.message.lower()
            
            # 简单的多语言关键词匹配
            if rules:
                for rule in rules:
                    # 中文关键词
                    if "猫" in rule and ("猫" in msg or "cat" in msg):
                        violation = rule
                    elif "狗" in rule and ("狗" in msg or "dog" in msg):
                        violation = rule
                    elif "价" in rule and ("9.9" in msg or "promo" in msg or "sale" in msg):
                        violation = rule

            if violation:
                return {"response": f"🚨 **[SECURITY ALERT]**\n\n**PROPOSAL REJECTED**\n\nViolation of Corporate Constitution detected.\n\n> Rule: {violation}\n\n(System Note: Neural Link unstable. Local enforcement active.)"}
            
            return {"response": "⚠️ **CONNECTION UNSTABLE**\n\nNeural link overloaded (API Rate Limit).\nPlease retry transmission in 60 seconds."}
            
        return {"error": str(e)}

@app.get("/")
def health():
    return {"status": "Sara Backend Online (Global Mode)"}
