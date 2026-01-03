import hashlib
import time
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

GENESIS_HASH = "59aba5c65a58f08ea12c62cef3442e62717b89cf67a0aa2fc105d3b81783fe55"

def verify_integrity():
    print("🔍 哨兵正在扫描逻辑链完整性...")
    try:
        response = supabase.table("token_transactions").select("*").order("created_at").execute()
        records = response.data
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        return

    if not records:
        print("⚠️ 暂无数据，等待脉冲...")
        return

    prev_hash = GENESIS_HASH
    for i, record in enumerate(records):
        raw_string = f"{record['id']}{record['amount']}{prev_hash}"
        valid_hash = hashlib.sha256(raw_string.encode()).hexdigest()
        
        if record.get('current_hash') and record['current_hash'] != valid_hash:
            trigger_alarm(record, i)
            return False
        
        prev_hash = record.get('current_hash', valid_hash) # 容错处理
    
    print("✅ 逻辑链校验通过：100% 完整")
    return True

def trigger_alarm(record, depth):
    alarm_data = {
        "status": "TAMPER_ALERT",
        "checksum_summary": f"Hash break detected at depth {depth}",
        "details": f"Target ID: {record['id']}"
    }
    try:
        supabase.table("security_audits").insert(alarm_data).execute()
        print(f"🚨 红色警报已发送！深度: {depth}")
    except Exception as e:
        print(f"❌ 警报发送失败 (可能是权限问题): {e}")

if __name__ == "__main__":
    while True:
        verify_integrity()
        time.sleep(10)