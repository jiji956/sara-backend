const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
console.log("🚑 正在修复 .env 粘连问题...");

let content = fs.readFileSync(envPath, 'utf8');

// 诊断：查找您日志中显示的特定粘连特征 "...IENNEXT_PUBLIC..."
// "IEN" 是您 Key 的最后三个字符
if (content.includes('IENNEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.log("⚠️  检测到变量粘连，正在执行分离手术...");
    
    // 修复：在 IEN 和 NEXT 之间插入换行符
    const fixedContent = content.replace(
        'IENNEXT_PUBLIC_SUPABASE_ANON_KEY=', 
        'IEN\nNEXT_PUBLIC_SUPABASE_ANON_KEY='
    );
    
    fs.writeFileSync(envPath, fixedContent);
    console.log("✅ 手术成功！换行符已植入。");
} else {
    // 如果特征不匹配，尝试通用修复 (以防万一)
    if (content.includes('KEY=NEXT_PUBLIC')) {
        const fixedContent = content.replace('KEY=NEXT_PUBLIC', 'KEY=\nNEXT_PUBLIC');
        fs.writeFileSync(envPath, fixedContent);
        console.log("✅ 执行了通用分离修复。");
    } else {
        console.log("❓ 未检测到明显粘连，请手动检查 .env 文件。");
    }
}

// 验证输出
const newContent = fs.readFileSync(envPath, 'utf8');
console.log("\n📄 修复后的文件末尾预览:");
console.log(newContent.slice(-200)); // 只看最后200个字符