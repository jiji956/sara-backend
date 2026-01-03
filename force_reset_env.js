const fs = require('fs');
const path = require('path');

console.log("☢️ 正在执行 .env 强制重置协议...");

// 从您之前的日志中提取的配置信息
const envData = {
    GEMINI_API_KEY: "AIzaSyDMKnQFjyNzQqby3PlxsgNr2xyvIEzMybI",
    NEXT_PUBLIC_SUPABASE_URL: "https://abcjdbeobcvqofwygfdo.supabase.co",
    // 这是之前的粘连变量，现在已独立出来
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_secret_ZuJ4AnQc6UZ7Dv2ia5hdUA_vRtBtIEN"
};

// 构建标准格式的内容 (每行一个变量)
const content = Object.entries(envData)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

const envPath = path.join(__dirname, '.env');

// 强制覆盖写入
fs.writeFileSync(envPath, content);

console.log("✅ .env 文件已重生！内容如下：");
console.log("--------------------------------");
console.log(content);
console.log("--------------------------------");
console.log("\n🚀 配置已修复，请立即启动引擎！");