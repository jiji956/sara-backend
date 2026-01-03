const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const appDir = path.join(rootDir, 'app');

console.log("🧪 零点协议启动：正在剥离所有复杂逻辑...");

// 1. 诊断触角文件是否存在
const supabasePath = path.join(rootDir, 'supabaseClient.js');
if (fs.existsSync(supabasePath)) {
    console.log("✅ 诊断通过: supabaseClient.js 存在");
} else {
    console.log("❌ 严重诊断: supabaseClient.js 缺失！(这可能是导致之前崩溃的原因)");
}

// 2. 删除配置文件 (回归默认)
const configTs = path.join(rootDir, 'next.config.ts');
const configJs = path.join(rootDir, 'next.config.js');
if (fs.existsSync(configTs)) fs.unlinkSync(configTs);
if (fs.existsSync(configJs)) fs.unlinkSync(configJs);
console.log("🧹 已移除 next.config 文件，采用系统默认设置。");

// 3. 写入最简看板 (Hello World)
const simplePage = `
export default function Page() {
  return (
    <div style={{ background: 'black', height: '100vh', color: 'purple', padding: '50px' }}>
      <h1>PROTOCOL_ZERO_ACTIVE</h1>
      <p>System Visual Link Established.</p>
    </div>
  )
}
`;
fs.writeFileSync(path.join(appDir, 'page.tsx'), simplePage.trim());
console.log("✅ page.tsx 已重置为纯文本模式。");

// 4. 清理缓存
const nextCache = path.join(rootDir, '.next');
if (fs.existsSync(nextCache)) {
    fs.rmSync(nextCache, { recursive: true, force: true });
}

console.log("\n🚀 准备完毕。请立即执行: npm run dev");