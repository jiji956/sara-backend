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

# --- [资产配置] ---
# 您的前端 Vercel 域名
IMAGE_BASE_URL = "https://sara-frontend-pjy4.vercel.app" 
# 营销链接 (请在以后替换为您的真实链接)
BOOK_LINK = "https://your-book-download-link.com"
PAY_LINK = "https://your-payment-page.com"

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class ChatRequest(BaseModel):
    message: str

async def get_rules():
    # 尝试从 Supabase 获取，失败则使用保底硬编码规则
    rules = ["禁止讨论猫、狗等低效生物。", "禁止提及 9.9 元等低级促销。"]
    if SUPA_URL and SUPA_KEY:
        try:
            headers = {"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}"}
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{SUPA_URL}/rest/v1/corporate_rules?select=rule_content", headers=headers, timeout=3.0)
                if resp.status_code == 200:
                    rules = [item["rule_content"] for item in resp.json()]
        except: pass
    return rules

@app.post("/chat")
async def chat(request: ChatRequest):
    msg = request.message.lower()
    
    # 1. 拦截逻辑：检测是否提及“猫/狗/低价”
    rules = await get_rules()
    violation = None
    for r in rules:
        if any(word in msg for word in ["猫", "cat", "狗", "dog", "9.9", "promo"]):
            violation = r
            break
    
    # 2. 触发视觉拦截 (Level 1 限制)
    if violation:
        return {
            "response": f"🚨 **[ACCESS DENIED]**\n\n检测到违规意图：\n> {violation}\n\n您的权限等级 (Level 1) 无法执行此操作。升级到 **执行官 (Executive)** 权限即可覆盖此协议。",
            "image_url": f"{IMAGE_BASE_URL}/denied.jpg",
            "action_link": PAY_LINK
        }
    
    # 3. 引导下载逻辑
    if any(w in msg for w in ["说明书", "原理", "manual", "guide"]):
        return {
            "response": f"📘 **[SYSTEM MANUAL ACCESS]**\n\n要理解 SARA 的核心算法及《六维思考力》，请阅读机密文档。\n\n**>> [点击下载说明书]({BOOK_LINK})**"
        }

    # 4. 正常对话：调用 Gemini 2.0 Flash
    try:
        # 使用您 debug 确认可用的 2.0 模型路径
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
        payload = {"contents": [{"parts": [{"text": f"You are SARA, a cold and rational AI. User says: {request.message}"}]}]}
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=30.0)
            if response.status_code == 200:
                ai_text = response.json().get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")
                return {"response": ai_text}
            else:
                raise Exception(f"API Error {response.status_code}")
    except Exception as e:
        return {"response": f"⚠️ **CONNECTION FAILURE**\n(System Note: Utilizing Local Protocols. Error: {str(e)})"}

@app.get("/")
def health():
    return {"status": "Sara Backend Online (Visual Intercept Active)"}
