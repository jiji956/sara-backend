const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 加载现有的环境变量
const envConfig = dotenv.config().parsed || {};

console.log("🔐 SARA 密钥链路诊断启动...");

// 1. 检查 .env 是否包含必要的 NEXT_PUBLIC_ 前缀
const requiredKey = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
const requiredUrl = 'NEXT_PUBLIC_SUPABASE_URL';

let missingKeys = [];
if (!envConfig[requiredUrl]) missingKeys.push(requiredUrl);
if (!envConfig[requiredKey]) missingKeys.push(requiredKey);

if (missingKeys.length > 0) {
    console.error(`\n❌ 严重配置错误：您的 .env 文件中缺少以下前端专用变量：`);
    missingKeys.forEach(k => console.error(`   - ${k}`));
    console.warn("⚠️  Next.js 强制要求前端变量必须以 'NEXT_PUBLIC_' 开头！");
    console.warn("   请打开 .env 文件，将 SUPABASE_URL 改为 NEXT_PUBLIC_SUPABASE_URL");
    console.warn("   将 SUPABASE_KEY 改为 NEXT_PUBLIC_SUPABASE_ANON_KEY");
} else {
    console.log("✅ .env 变量格式检查通过。");
}

// 2. 强制重写 supabaseClient.js (使用正确的变量名)
const clientContent = `
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    // 这是一个保护措施，防止空密钥导致崩溃
    console.error('❌ SARA Error: Supabase 环境变量未找到！请检查 .env 文件。');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
`;

const filePath = path.join(__dirname, 'supabaseClient.js');
fs.writeFileSync(filePath, clientContent.trim());
console.log("✅ supabaseClient.js 已修复：正在使用 'NEXT_PUBLIC_' 前缀读取密钥。");

console.log("\n🚀 修复完成。请再次尝试启动！");