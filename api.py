import os
import httpx
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
SUPA_URL = os.getenv("SUPABASE_URL")
SUPA_KEY = os.getenv("SUPABASE_KEY")
IMAGE_BASE_URL = "https://sara-frontend-pjy4.vercel.app"

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class ChatRequest(BaseModel):
    message: str

# --- [新增：日志记录函数] ---
async def log_to_supabase(event_type: str, user_input: str):
    if not (SUPA_URL and SUPA_KEY): return
    url = f"{SUPA_URL}/rest/v1/executive_logs"
    headers = {
        "apikey": SUPA_KEY,
        "Authorization": f"Bearer {SUPA_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    payload = {
        "event_type": event_type,
        "user_input": user_input,
        "meta_data": {"platform": "SARA-Web-PWA"}
    }
    async with httpx.AsyncClient() as client:
        await client.post(url, json=payload, headers=headers)

@app.post("/chat")
async def chat(request: ChatRequest):
    msg = request.message.lower()
    
    # 1. 拦截逻辑：检测是否提及“违禁词”
    is_violation = any(word in msg for word in ["猫", "cat", "狗", "dog", "9.9", "promo"])
    
    if is_violation:
        # 🚀 [关键动作]：记录一次“解锁尝试”（即：用户撞到了付费墙）
        await log_to_supabase("UNLOCK_ATTEMPT", request.message)
        
        return {
            "response": "🚨 **[ACCESS DENIED]**\n检测到违规意图。Level 1 权限不足以执行此操作。",
            "image_url": f"{IMAGE_BASE_URL}/denied.jpg"
        }

    # 2. 正常逻辑：调用 Gemini 2.0
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
        payload = {"contents": [{"parts": [{"text": request.message}]}]}
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=30.0)
            ai_text = resp.json().get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")
            return {"response": ai_text}
    except Exception as e:
        return {"response": f"⚠️ 连接不稳定。Error: {str(e)}"}
