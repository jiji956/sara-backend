const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
console.log("🚑 正在修复 .env 文件格式...");

let content = fs.readFileSync(envPath, 'utf8');

// 诊断：检查是否存在粘连情况
if (content.includes('IENNEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.log("⚠️  检测到变量粘连，正在进行分离手术...");
    
    // 修复逻辑：在粘连处强制插入换行符
    // 注意：这里匹配的是您预览中显示的特定结尾字符 "IEN"
    const fixedContent = content.replace(
        'IENNEXT_PUBLIC_SUPABASE_ANON_KEY=', 
        'IEN\nNEXT_PUBLIC_SUPABASE_ANON_KEY='
    );
    
    fs.writeFileSync(envPath, fixedContent);
    console.log("✅ 手术成功！换行符已植入。");
} else if (content.includes('KEY=NEXT_PUBLIC')) {
    // 通用修复尝试
    const fixedContent = content.replace('KEY=NEXT_PUBLIC', 'KEY=\nNEXT_PUBLIC');
    fs.writeFileSync(envPath, fixedContent);
    console.log("✅ 通用修复已执行。");
} else {
    console.log("✅ 未检测到明显的粘连特征，或者文件已被修复。");
}

console.log("\n📄 当前文件结构验证：");
const newContent = fs.readFileSync(envPath, 'utf8');
console.log(newContent);