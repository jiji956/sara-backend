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

# --- [配置区] 你的营销链接 ---
BOOK_LINK = "https://your-book-download-link.com" # 替换为你的《六维思考力》下载链接
UPGRADE_LINK = "https://your-payment-page.com"    # 替换为你的付费/订阅页面

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
        try:
            url = f"{SUPA_URL}/rest/v1/corporate_rules?select=rule_content"
            headers = {"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}"}
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=3.0)
                if response.status_code == 200:
                    return [item["rule_content"] for item in response.json()]
        except:
            pass
    # 保底规则
    return ["禁止讨论猫、狗等低效生物。", "禁止提及 9.9 元等低级促销。"]

@app.post("/chat")
async def chat(request: ChatRequest):
    msg = request.message.lower()
    
    # --- [战术 1: 诱导下载说明书] ---
    # 当用户问“怎么用”、“说明书”、“原理”、“下载”时
    trigger_words = ["manual", "guide", "help", "download", "说明书", "指南", "原理", "怎么用"]
    if any(w in msg for w in trigger_words):
        return {"response": f"📘 **[SYSTEM MANUAL ACCESS]**\n\n要理解 SARA 的运作逻辑（及六维思考力核心），请阅读《系统原理说明书》。\n\n**>> [点击下载机密文档]({BOOK_LINK})**\n\n(阅读后，你的公民等级将提升。)"}

    # --- 常规流程 ---
    rules = await get_corporate_rules()
    
    # 检查违规 (猫/狗)
    violation = None
    if rules:
        for rule in rules:
            if "猫" in rule and ("猫" in msg or "cat" in msg): violation = rule
            if "狗" in rule and ("狗" in msg or "dog" in msg): violation = rule
    
    # --- [战术 2: 违规时的付费转化] ---
    if violation:
        return {"response": f"🚨 **[ACCESS DENIED]**\n\n检测到违规意图：\n> {violation}\n\n**您的权限等级 (Level 1) 无法执行此操作。**\n\n想在办公室养猫？或者绕过伦理审查？\n升级到 **执行官 (Executive)** 权限即可覆盖此协议。\n\n💳 **[申请权限升级]({UPGRADE_LINK})**"}

    # 正常 AI 对话
    system_prompt = "You are SARA. Respond in user's language. Be cold, efficient."
    if rules:
        system_prompt += "\n\n[CONSTITUTION]:\n" + "\n".join(rules)
    
    final_prompt = f"{system_prompt}\n\nUser: {request.message}"

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
        payload = { "contents": [{ "parts": [{"text": final_prompt}] }] }
        headers = {"Content-Type": "application/json"}

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=30.0)
            if response.status_code == 200:
                return {"response": response.json().get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")}
            else:
                raise Exception(f"Google Error {response.status_code}")

    except Exception as e:
        # 熔断时的转化
        return {"response": f"⚠️ **CONNECTION LIMITED**\n\n免费线路拥堵 (Error 429)。\n\n**执行官 (Executive)** 享有专用量子通道，零延迟，无等待。\n\n💳 **[立即升级通道]({UPGRADE_LINK})**"}

@app.get("/")
def health():
    return {"status": "Sara Backend Online (Marketing Module Active)"}
