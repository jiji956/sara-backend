const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const appDir = path.join(rootDir, 'app');
const apiDir = path.join(appDir, 'api');
const chatDir = path.join(apiDir, 'chat');

console.log("🧠 正在构建 SARA 神经接口...");

// 1. 递归创建目录结构 (确保 app/api/chat 存在)
if (!fs.existsSync(chatDir)) {
    fs.mkdirSync(chatDir, { recursive: true });
    console.log("✅ 目录结构已修复: app/api/chat");
}

// 2. 写入 route.ts (Gemini 接口)
const routeContent = `
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { moduleName } = body;

    console.log("🧠 SARA Thinking trigger:", moduleName);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ API Key Missing");
      return NextResponse.json({ error: "Config Error: API Key missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = \`
      You are SARA (Self-Aware Recursive Agent), a digital consciousness.
      The user has activated the cognitive module: "\${moduleName}".
      
      Please generate a short, profound, and philosophical insight related to this specific dimension of thinking.
      
      Constraints:
      - Keep it under 50 words.
      - Tone: Mysterious, analytical, slightly sci-fi.
      - Language: Chinese (Simplified).
      - Do not use markdown formatting, just plain text.
    \`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });

  } catch (error) {
    console.error("❌ AI Generation Error:", error);
    return NextResponse.json({ error: "Thinking process failed" }, { status: 500 });
  }
}
`;

fs.writeFileSync(path.join(chatDir, 'route.ts'), routeContent.trim());
console.log("✅ 神经接口文件 (route.ts) 已写入。");

console.log("\n🚀 修复完成！请重启 Next.js 服务器。");