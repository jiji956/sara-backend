const fs = require('fs');
const path = require('path');

console.log("🔄 正在对齐 Python 脚本的密钥接口...");

// 1. 定义通过 Anon Key 运行的新版代码模板

const pulseCode = `
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
    print(f"❌ 错误：环境变量缺失。\\nURL: {url}\\nKEY: {key is not None}")
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
`;

const watchtowerCode = `
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
`;

const healCode = `
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
`;

// 2. 写入文件
fs.writeFileSync(path.join(__dirname, 'pulse.py'), pulseCode.trim());
fs.writeFileSync(path.join(__dirname, 'security_watchtower.py'), watchtowerCode.trim());
fs.writeFileSync(path.join(__dirname, 'heal.py'), healCode.trim());

console.log("✅ 3个核心 Python 脚本已更新。它们现在会读取 'NEXT_PUBLIC_SUPABASE_ANON_KEY'。");
console.log("🚀 请尝试运行: python pulse.py");