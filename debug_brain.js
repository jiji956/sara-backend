require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testBrain() {
    console.log("🧠 正在进行大脑皮层压力测试...");
    
    // 1. 检查 Key 是否被读取
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ 致命错误：.env 文件中读取不到 GEMINI_API_KEY！");
        return;
    }
    console.log(`✅ 密钥已识别: ${apiKey.substring(0, 8)}...`);

    // 2. 尝试连接 Google
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = "你好，SARA。请用一句话证明你的存在。";
        console.log("📡 正在向 Google AI 发送信号...");
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("\n🎉 测试成功！大脑响应正常：");
        console.log("------------------------------------------------");
        console.log(text);
        console.log("------------------------------------------------");

    } catch (error) {
        console.error("\n❌ 测试失败！原因分析：");
        if (error.message.includes("API key not valid")) {
            console.error("👉 您的 API Key 无效。请检查 .env 文件中的密钥是否正确。");
        } else if (error.message.includes("fetch failed") || error.message.includes("network")) {
            console.error("👉 网络连接失败。请确认您的网络可以访问 Google API (可能需要 VPN)。");
        } else if (error.message.includes("404")) {
             console.error("👉 模型未找到。可能是 'gemini-pro' 不可用，尝试改用 'gemini-pro'。");
        } else {
            console.error("👉 未知错误:", error.message);
        }
    }
}

testBrain();