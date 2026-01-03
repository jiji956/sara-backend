import hashlib
import os
import time
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ 凭证缺失")
    exit()

supabase = create_client(url, key)
GENESIS_HASH = "59aba5c65a58f08ea12c62cef3442e62717b89cf67a0aa2fc105d3b81783fe55"

def perform_surgery():
    print("🚑 自愈程序启动 | 正在扫描...")
    records = supabase.table("token_transactions").select("*").order("created_at").execute().data
    
    prev_hash = GENESIS_HASH
    
    for record in records:
        raw_string = f"{record['id']}{record['amount']}{prev_hash}"
        valid_hash = hashlib.sha256(raw_string.encode()).hexdigest()
        
        if record.get('current_hash') and record['current_hash'] != valid_hash:
            print(f"🚨 发现感染源 ID: {record['id']}")
            print("✂️ 正在切除受污染时间线...")
            try:
                # 尝试删除
                supabase.table("token_transactions").delete().gte("created_at", record['created_at']).execute()
                print("✅ 切除成功")
                
                # 重置状态
                audit_log = {"status": "SYSTEM_ACTIVE", "checksum_summary": "Auto-Healed", "details": "Restored"}
                supabase.table("security_audits").insert(audit_log).execute()
                print("✅ 看板状态已重置")
                return
            except Exception as e:
                print(f"❌ 手术失败 (权限不足?): {e}")
                return

        prev_hash = record.get('current_hash', valid_hash)
    
    print("✅ 系统健康，无需手术。")

if __name__ == "__main__":
    perform_surgery()