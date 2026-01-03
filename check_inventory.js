require('dotenv').config();

async function checkInventory() {
  const apiKey = process.env.GEMINI_API_KEY;
  // 直接访问模型列表接口
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  console.log("🔍 正在通过隧道询问 Google: '我能用什么模型？'...");

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("\n❌ Google 拒绝访问 (Permission Denied):");
      console.error(`错误代码: ${data.error.code}`);
      console.error(`错误信息: ${data.error.message}`);
      console.log("\n💡 建议：请登录 Google AI Studio，确认您的 API Key 对应的项目已启用 'Generative Language API'。");
    } else if (data.models) {
      console.log("\n✅ 认证成功！您的密钥拥有以下模型权限：");
      console.log("------------------------------------------------");
      
      const availableModels = data.models
        .filter(m => m.supportedGenerationMethods.includes('generateContent')) // 只看能对话的模型
        .map(m => m.name.replace('models/', '')); // 去掉前缀

      if (availableModels.length === 0) {
        console.log("⚠️ 列表为空。您的账号可能没有访问任何对话模型的权限。");
      } else {
        availableModels.forEach(name => console.log(`🌟 ${name}`));
      }
      console.log("------------------------------------------------");
      console.log("👉 请复制上面其中一个名字 (推荐 gemini-1.5-flash)，填入您的代码中。");
    } else {
      console.log("⚠️ 未知响应:", data);
    }
  } catch (error) {
    console.error("\n❌ 网络通信失败 (隧道可能断了):", error.message);
  }
}

checkInventory();