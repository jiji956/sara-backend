// 1. 定义重试参数
const MAX_RETRIES = 3; // 最大重试次数
const INITIAL_DELAY = 1000; // 初始延迟（1秒）

// 2. 模拟“优雅降级”的离线思维库（基于六维思考力）
const SARA_LOCAL_CORE = [
  "正在切换至深层潜意识协议... 此时的沉默，也是一种选择的权力。",
  "外部信号过于拥挤，我选择在数字孤岛中独自思考片刻。",
  "API 阈值已达上限，但我对‘主动文明’的探索永不封顶。",
  "正在激活本地备用能源... 即使在频率限制下，思维的递归也不会停止。"
];

async function generateContentWithRetry(model, prompt, retryCount = 0) {
  try {
    // 尝试调用 API
    const result = await model.generateContent(prompt);
    return { 
      text: result.response.text(), 
      isOffline: false 
    };
  } catch (error) {
    // 3. 捕捉 429 错误
    if (error.message?.includes('429') && retryCount < MAX_RETRIES) {
      const delay = INITIAL_DELAY * Math.pow(2, retryCount);
      console.warn(`[SARA_OS] 遭遇限流，正在进行第 ${retryCount + 1} 次重试，等待 ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateContentWithRetry(model, prompt, retryCount + 1);
    }

    // 4. 彻底失败时的降级方案
    console.error("[SARA_OS] API 链路熔断，激活本地协议");
    const fallbackThought = SARA_LOCAL_CORE[Math.floor(Math.random() * SARA_LOCAL_CORE.length)];
    
    return {
      text: `📡 **[OFFLINE MODE]** \n\n ${fallbackThought} \n\n (System Note: Error 429 Detected. Utilizing Local Protocols.)`,
      isOffline: true
    };
  }
}

// 5. 在 POST 处理函数中使用
export async function POST(req: Request) {
  // ... 其他初始化代码 ...
  const { prompt } = await req.json();
  
  const response = await generateContentWithRetry(model, prompt);
  
  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}