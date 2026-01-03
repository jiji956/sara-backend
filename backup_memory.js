require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 初始化连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backup() {
    console.log("💾 正在连接云端记忆库...");

    // 拉取所有交易记录 (假设不超过 10000 条，多了需要分页)
    const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ 备份失败:", error.message);
        return;
    }

    // 生成带时间戳的文件名
    const date = new Date().toISOString().split('T')[0];
    const fileName = `sara_memory_backup_${date}.json`;
    const filePath = path.join(__dirname, 'backups', fileName);

    // 确保备份目录存在
    if (!fs.existsSync(path.join(__dirname, 'backups'))) {
        fs.mkdirSync(path.join(__dirname, 'backups'));
    }

    // 写入文件
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ 备份成功！共归档 ${data.length} 条记忆。`);
    console.log(`📁 存储位置: ${filePath}`);
}

backup();