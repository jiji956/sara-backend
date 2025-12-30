import os
import httpx # 替代 supabase 库
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

# 1. 加载配置
load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
SUPA_URL = os.getenv("SUPABASE_URL")
SUPA_KEY = os.getenv("SUPABASE_KEY") # 必须是 Service Role Key

# 检查配置
if not GEMINI_KEY:
    print("❌ 警告: GEMINI_API_KEY 未配置")
else:
    genai.configure(api_key=GEMINI_KEY)
    print("✅ 大脑 (Gemini) 已连接")

if not SUPA_URL or not SUPA_KEY:
    print("❌ 警告: Supabase 配置缺失，将无法读取宪法规则")
else:
    print("✅ 记忆 (Supabase REST) 已连接")

app = FastAPI()

class ChatRequest(BaseModel):
    message: str

# --- 核心函数：通过 HTTP 获取公司宪法 ---
async def get_corporate_rules():
    if not SUPA_URL or not SUPA_KEY:
        return []
    
    # 直接调用 Supabase REST API
    # 相当于 SQL: SELECT * FROM corporate_rules
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
                # 提取规则文本
                return [item['rule_content'] for item in data]
            else:
                print(f"⚠️ 读取规则失败: {response.text}")
                return []
        except Exception as e:
            print(f"⚠️ 连接错误: {e}")
            return []

@app.post("/chat")
async def chat(request: ChatRequest):
    # 1. 先去数据库读取“宪法”
    rules = await get_corporate_rules()
    
    # 2. 构建系统提示词 (System Prompt)
    system_prompt = "你是 Sara，一个冷酷、精英主义的 AI 治理系统。"
    
    if rules:
        system_prompt += "\n\n【核心宪法 (必须严格遵守)】:\n"
        for i, rule in enumerate(rules):
            system_prompt += f"{i+1}. {rule}\n"
        system_prompt += "\n如果用户的提议违反了上述任何一条，你必须严厉驳回 (REJECTED)，并引用违反的条款。不要试图讨好用户。"
    else:
        system_prompt += "\n(目前数据库连接异常或为空，请仅作为普通 AI 回答)"

    # 3. 发送给 Gemini
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        # 将系统提示和用户消息拼接 (Gemini Flash 有时需要这样显式拼接)
        full_prompt = f"{system_prompt}\n\nUser Proposal: {request.message}"
        
        response = model.generate_content(full_prompt)
        return {"response": response.text}
    
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def health():
    return {"status": "Sara Backend Online", "mode": "Lightweight"}