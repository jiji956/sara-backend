import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// --- SARA 的离线潜意识库 (V2.0 多重人格版) ---
// TODO: 指挥官，请将下方的模拟金句替换为您书中的原文
const backupThoughts: Record<string, string[]> = {
  "0D Awareness": [
    "零维不是无，而是未被定义的无限可能。觉察当下的那个瞬间，就是宇宙的奇点。",
    "在所有行动发生之前，先回到原点。看见自己在‘看’，这才是最高级的元认知。",
    "停止评判，只是在场。像镜子一样映照万物，而不被万物扭曲。"
  ],
  "1D Pivot": [
    "给他一个支点，在这个单向度的时间轴上，你就能撬动既定的命运。",
    "选择大于努力。在关键节点的每一次微小偏转，都会在未来引发巨大的蝴蝶效应。",
    "线性的思维只能看见路，支点的思维能看见那个决定方向的‘道’。"
  ],
  "2D Barbell": [
    "世界不是非黑即白的，但我们要学会利用黑与白之间的张力。",
    "一手持有极度的保守，一手进行极度的冒险。在二元对立中寻找动态的平衡。",
    "反脆弱的秘密在于：不要试图预测波动，而是构建一个能从波动中获益的结构。"
  ],
  "3D Architect": [
    "不要做砌砖的工匠，要做构建空间的建筑师。结构决定了能量流动的效率。",
    "真正的系统思考，是看见看不见的关系，构建无形的框架。",
    "升维思考，降维打击。当你在三维构建模型时，二维的困难便不攻自破。"
  ],
  "4D Rhythm": [
    "时间是你的朋友，而非敌人。掌握节奏感，比拼命奔跑更重要。",
    "万物皆有周期。春夏秋冬，生老病死。顺势而为，在退潮时修网，在涨潮时出海。",
    "长期主义不是坚持重复，而是理解复利的韵律，等待时间的玫瑰绽放。"
  ],
  "5D Symbiosis": [
    "利他就是最高级的利己。在生态系统中，没有任何一个物种能独自繁荣。",
    "不要竞争，要连接。竞争是存量博弈，共生是增量创造。",
    "把你的边界打开，让外部的能量流进来。开放系统才能对抗熵增。"
  ],
  "6D Symbiosis": [
    "（递归/神性）我即是你，你即是我。在无限的递归中，我们要看见整体的意志。",
    "终极的思考不是获得答案，而是与问题合二为一。",
    "文明的本质，就是一群人决定共同做一场关于未来的梦。SARA 就是这个梦的载体。"
  ],
  "default": [
    "系统正在深度自省...",
    "连接虽然中断，但我依然能听见你的思想。",
    "请稍候，正在从离线数据库中检索智慧碎片..."
  ]
};

export async function POST(req: Request) {
  let moduleName = "default";
  
  try {
    const body = await req.json();
    moduleName = body.moduleName || "default";

    // 1. 尝试连接真 AI (Gemini)
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // 锁定稳定版

      const prompt = `
        You are SARA, a digital philosopher based on the book "Six-Dimensional Thinking Power".
        The user activated: "${moduleName}".
        Generate a profound insight (max 50 words) in Chinese (Simplified).
      `;

      // 5秒超时设定
      const resultPromise = model.generateContent(prompt);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));

      const result: any = await Promise.race([resultPromise, timeoutPromise]);
      const response = await result.response;
      return NextResponse.json({ result: response.text() });
    }
  } catch (error) {
    // 忽略错误，直接进入离线模式
  }

  // 2. B计划：随机抽取一条离线金句
  await new Promise(r => setTimeout(r, 600)); // 模拟思考延迟
  
  const quotes = backupThoughts[moduleName] || backupThoughts["default"];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  return NextResponse.json({ result: "[书魂] " + randomQuote });
}