require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// 候选模型列表 (按成功率排序)
const candidateModels = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro",
    "gemini-1.5-flash-latest"
];

async function scanAndFix() {
    console.log("📡 启动全频段模型扫描...");
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error("❌ 缺少 API Key");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let workingModel = null;

    // 1. 循环测试
    for (const modelName of candidateModels) {
        process.stdout.write(`👉 正在测试频段: [ ${modelName} ] ... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test.");
            const response = await result.response;
            await response.text(); // 确认能拿到文本
            
            console.log("✅ 响应成功！");
            workingModel = modelName;
            break; // 找到就停止
        } catch (error) {
            console.log("❌ 无信号 (404/Error)");
            // console.log(error.message); // 调试用
        }
    }

    // 2. 根据结果执行修复
    if (workingModel) {
        console.log(`\n🎉 锁定可用模型: ${workingModel}`);
        console.log("🛠️ 正在自动修正 route.ts ...");

        const routePath = path.join(__dirname, 'app', 'api', 'chat', 'route.ts');
        
        if (fs.existsSync(routePath)) {
            let content = fs.readFileSync(routePath, 'utf8');
            // 正则替换任何旧的模型名称
            content = content.replace(/model: ".*?"/, `model: "${workingModel}"`);
            fs.writeFileSync(routePath, content);
            console.log("✅ 修复完成！神经链路已校准。");
            console.log("🚀 请立即重启 Next.js 服务器。");
        } else {
            console.error("❌ 找不到 route.ts 文件，无法自动修复。请手动修改。");
        }
    } else {
        console.error("\n💀 所有频段均无响应。");
        console.error("可能原因：");
        console.error("1. 您的 API Key 所在的 Google Cloud 项目没有开启 Gemini API 权限。");
        console.error("2. 您的网络环境无法连接 Google (需要全局 VPN)。");
    }
}

scanAndFix();