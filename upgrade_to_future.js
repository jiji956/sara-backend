const fs = require('fs');
const path = require('path');

const targetModel = "gemini-2.5-flash"; // 锁定未来旗舰
const routePath = path.join(__dirname, 'app', 'api', 'chat', 'route.ts');

console.log(`🚀 正在将 SARA 升级至 [${targetModel}] 核心...`);

if (fs.existsSync(routePath)) {
    let content = fs.readFileSync(routePath, 'utf8');
    
    // 正则替换：找到任何 model: "xxx" 的写法，替换为新模型
    // 无论是 gemini-pro 还是其他，统统换掉
    const newContent = content.replace(/model: ".*?"/g, `model: "${targetModel}"`);
    
    fs.writeFileSync(routePath, newContent);
    console.log("✅ 升级完成！核心已重写。");
    console.log("------------------------------------------------");
    console.log(`当前模型: ${targetModel}`);
    console.log("------------------------------------------------");
} else {
    console.error("❌ 找不到 route.ts 文件！请检查路径。");
}