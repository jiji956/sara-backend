import time
import random
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# 自动适配：优先读取 Anon Key，如果不存在则读取 Service Key
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print(f"❌ 错误：环境变量缺失。\nURL: {url}\nKEY: {key is not None}")
    exit()

supabase = create_client(url, key)

def send_logic_pulse():
    data = {
        "user_id": "ea1d69e7-150f-4c24-9daf-686eb889217c",
        "amount": random.uniform(10, 100)
    }
    try:
        supabase.table("token_transactions").insert(data).execute()
        print(f"📡 脉冲发射成功 | 逻辑深度 +1 | 递归量: {data['amount']:.2f}")
    except Exception as e:
        print(f"❌ 脉冲受阻: {e}")

if __name__ == "__main__":
    print("🚀 SARA 文明脉搏监测已开启...")
    while True:
        send_logic_pulse()
        time.sleep(5)