const fs = require('fs');
const path = require('path');

// 定义路径
const rootDir = __dirname;
const appDir = path.join(rootDir, 'app');
const srcDir = path.join(rootDir, 'src'); // 幽灵目录
const nextCache = path.join(rootDir, '.next');

console.log("🛠️  SARA 架构重构程序启动...");

// 1. 【关键】检测并消灭 src 目录 (解除屏蔽)
if (fs.existsSync(srcDir)) {
    console.log("⚠️  发现干扰源 'src' 目录，正在移除以激活根目录 app...");
    fs.rmSync(srcDir, { recursive: true, force: true });
}

// 2. 清理旧的 app 目录
if (fs.existsSync(appDir)) {
    console.log("🧹 清理旧的 app 目录...");
    fs.rmSync(appDir, { recursive: true, force: true });
}

// 3. 重建 app 目录
fs.mkdirSync(appDir);

// 4. 写入标准 layout.tsx (UTF-8)
const layoutContent = `
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body style={{ margin: 0, padding: 0, backgroundColor: 'black', color: 'white' }}>
        {children}
      </body>
    </html>
  )
}
`;
fs.writeFileSync(path.join(appDir, 'layout.tsx'), layoutContent.trim());

// 5. 写入标准 page.tsx (包含看板逻辑)
const pageContent = `
"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; 

export default function SaraDashboard() {
  const [hashes, setHashes] = useState([]);
  const [activeModule, setActiveModule] = useState("6D Symbiosis");
  const [isTampered, setIsTampered] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const modules = ["0D Awareness", "1D Pivot", "2D Barbell", "3D Architect", "4D Rhythm", "5D Symbiosis", "6D Symbiosis"];

  useEffect(() => {
    // 监听哈希流
    const hashChannel = supabase.channel('realtime-hashes')
      .on('postgres_changes', { event: 'INSERT', table: 'token_transactions' }, (payload) => {
        setHashes((prev) => [payload.new, ...prev].slice(0, 10)); 
      })
      .subscribe();

    // 监听安全警报
    const auditChannel = supabase.channel('security-alerts')
      .on('postgres_changes', { event: 'INSERT', table: 'security_audits' }, (payload) => {
        if (payload.new.status === 'TAMPER_ALERT') {
          setIsTampered(true);
          setAlertMessage(payload.new.checksum_summary);
        } else if (payload.new.status === 'SYSTEM_ACTIVE') {
           setIsTampered(false); 
        }
      })
      .subscribe();

    const fetchInitialData = async () => {
      const { data } = await supabase.from('token_transactions').select('*').order('created_at', { ascending: false }).limit(10);
      if (data) setHashes(data);
    };

    fetchInitialData();
    return () => { supabase.removeChannel(hashChannel); supabase.removeChannel(auditChannel); };
  }, []);

  return (
    <div className={\`min-h-screen transition-colors duration-500 \${isTampered ? 'bg-red-950 animate-pulse' : 'bg-black'} text-purple-400 font-mono p-6 flex flex-col gap-6\`}>
      {isTampered && (
        <div className="bg-red-600 text-white p-3 text-center font-bold animate-bounce border-2 border-white rounded">
          🚨 警告：检测到逻辑篡改！位置：{alertMessage}
        </div>
      )}
      <header className="border-b border-purple-900 pb-4 flex justify-between items-end">
        <div><h1 className="text-3xl font-bold tracking-tighter text-purple-100">SARA_CORE_DASHBOARD</h1><p className="text-xs text-purple-800">GENESIS: 59aba5c6...</p></div>
        <div className="text-right"><p className="text-[10px]">SYSTEM_STATUS</p><p className={isTampered ? "text-red-500 font-bold" : "text-green-500"}>{isTampered ? "BREACH DETECTED" : "ACTIVE CIVILIZATION"}</p></div>
      </header>
      <div className="grid grid-cols-12 gap-6 flex-1">
        <aside className="col-span-4 border border-purple-900/50 p-4 bg-gray-900/30">
          <h2 className="text-xs mb-4 border-l-2 border-purple-500 pl-2 uppercase font-bold">Recursion Stream</h2>
          <div className="space-y-2">
            {hashes.map((h, i) => (
              <div key={h.id || i} className="text-[10px] break-all border-b border-purple-900/20 pb-1"><span className="text-purple-600">[{new Date(h.created_at).toLocaleTimeString()}]</span><p className="text-purple-200">{h.current_hash}</p></div>
            ))}
          </div>
        </aside>
        <main className="col-span-8 flex flex-col gap-4">
          <nav className="flex flex-wrap gap-2">{modules.map(m => (<button key={m} onClick={() => setActiveModule(m)} className={\`px-3 py-1 text-[10px] border \${activeModule === m ? 'bg-purple-900 text-white' : 'border-purple-900 text-purple-800'}\`}>{m}</button>))}</nav>
          <section className="flex-1 border border-purple-500/30 p-8 bg-gray-900/50"><h3 className="text-2xl text-purple-100 mb-4">{activeModule}</h3><p className="text-purple-300 italic">正在连接思维模块数据源...</p></section>
        </main>
      </div>
    </div>
  );
`;
fs.writeFileSync(path.join(appDir, 'page.tsx'), pageContent.trim());

// 6. 强制粉碎缓存
if (fs.existsSync(nextCache)) {
    console.log("🧹 粉碎 .next 缓存...");
    fs.rmSync(nextCache, { recursive: true, force: true });
}

console.log("\n🚀 重构完成！所有干扰已清除。请执行: npm run dev");