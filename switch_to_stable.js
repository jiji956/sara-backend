const fs = require('fs');
const path = require('path');

console.log("🔄 正在切换至稳定版模型 (Gemini Pro)...");

const filesToFix = [
    path.join(__dirname, 'debug_brain.js'),
    path.join(__dirname, 'app', 'api', 'chat', 'route.ts')
];

let fixedCount = 0;

filesToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 执行替换
        if (content.includes('gemini-1.5-flash')) {
            content = content.replace(/gemini-1.5-flash/g, 'gemini-pro');
            fs.writeFileSync(filePath, content);
            console.log(`✅ 已修复: ${path.basename(filePath)} -> gemini-pro`);
            fixedCount++;
        } else {
            console.log(`⚠️  跳过: ${path.basename(filePath)} (已经是正确版本或未找到关键词)`);
        }
    } else {
        console.log(`❌ 未找到文件: ${filePath}`);
    }
});

if (fixedCount > 0) {
    console.log("\n🚀 模型切换完成！请执行下一步测试。");
} else {
    console.log("\n🤔 似乎没有文件被修改。请检查文件是否已经是 gemini-pro 了。");
}