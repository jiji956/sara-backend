require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testConnection() {
    console.log("📡 正在尝试穿越隧道连接 Google AI (Model: gemini-pro)...");
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { console.error("❌ Key 缺失"); return; }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 发送一个极简的 Hello 信号
        const result = await model.generateContent("Hello! Are you online? Answer in one word.");
        const response = await result.response;
        const text = response.text();
        
        console.log("\n✅ 隧道贯通！Google AI 响应成功：");
        console.log("-----------------------------------");
        console.log(text);
        console.log("-----------------------------------");

    } catch (error) {
        console.error("\n❌ 连接依然被阻断。");
        console.error("错误详情:", error.message);
        // 如果是 fetch failed，通常意味着 Node.js 原生 fetch 没走代理
        if (error.cause) console.error("底层原因:", error.cause);
    }
}

testConnection();