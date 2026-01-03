const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const filesToDelete = ['middleware.ts', 'middleware.js', 'src']; // src 再次确认清除

console.log("🔍 SARA 深度扫描启动...");

// 1. 扫描并删除中间件
filesToDelete.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`⚠️ 发现干扰源: ${file} -> 正在删除...`);
        fs.rmSync(filePath, { recursive: true, force: true });
    }
});

// 2. 列出关键文件清单 (用于诊断)
console.log("\n📂 当前根目录关键资产:");
const files = fs.readdirSync(rootDir);
files.forEach(f => {
    if (['app', 'pages', 'public', 'next.config.ts', 'next.config.js', 'package.json', 'tsconfig.json'].includes(f)) {
        console.log(` - ${f}`);
    }
});

// 3. 检查 app 目录内部
const appDir = path.join(rootDir, 'app');
if (fs.existsSync(appDir)) {
    console.log("\n📂 app 目录内容:");
    fs.readdirSync(appDir).forEach(f => console.log(` - ${f}`));
} else {
    console.error("\n❌ 严重错误: app 目录不存在！");
}

console.log("\n✅ 扫描完毕。");