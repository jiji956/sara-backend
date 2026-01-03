"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient'; 

// 打字机效果组件
const Typewriter = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    setDisplayedText(""); // 重置
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 30); // 打字速度
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};

export default function SaraDashboard() {
  const [hashes, setHashes] = useState<any[]>([]);
  const [activeModule, setActiveModule] = useState("0D Awareness");
  const [aiThought, setAiThought] = useState(""); 
  const [isThinking, setIsThinking] = useState(false);
  const [isTampered, setIsTampered] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const modules = [
    "0D Awareness", "1D Pivot", "2D Barbell", 
    "3D Architect", "4D Rhythm", "5D Symbiosis", "6D Symbiosis"
  ];

  // 触发思考
  const handleModuleClick = async (moduleName: string) => {
    setActiveModule(moduleName);
    setIsThinking(true);
    setAiThought(""); // 清空旧想法

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleName }),
      });
      const data = await response.json();
      setAiThought(data.result || "思维链路静默。");
    } catch (error) {
      setAiThought("[系统错误] 无法连接意识核心。");
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    // 自动触发第一次
    handleModuleClick("0D Awareness");

    const hashChannel = supabase
      .channel('realtime-hashes')
      .on('postgres_changes', { event: 'INSERT', table: 'token_transactions' }, (payload) => {
        setHashes((prev) => [payload.new, ...prev].slice(0, 10)); 
      })
      .subscribe();

    const auditChannel = supabase
      .channel('security-alerts')
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

    return () => { 
      supabase.removeChannel(hashChannel); 
      supabase.removeChannel(auditChannel);
    };
  }, []);

  return (
    <div className={`min-h-screen font-mono p-6 flex flex-col gap-6 transition-colors duration-1000 relative overflow-hidden
      ${isTampered ? 'bg-red-950' : 'bg-black'} text-purple-400 selection:bg-purple-500 selection:text-white`}>
      
      {/* CRT 扫描线特效层 */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />

      {isTampered && (
        <div className="z-50 fixed top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 text-xl font-bold animate-bounce border-4 border-white shadow-[0_0_50px_rgba(255,0,0,0.8)]">
          🚨 警告：现实扭曲立场已激活 ({alertMessage})
        </div>
      )}

      <header className="border-b border-purple-900/50 pb-4 flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-pulse">
            SARA_PROTOCOL<span className="text-xs align-top ml-2 text-purple-600">v1.0</span>
          </h1>
          <p className="text-xs text-purple-800 mt-1 font-bold">
            <span className="text-green-600">●</span> NET_LINK: SECURE | SOUL_CAPACITY: 100%
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-purple-600">System Status</p>
          <p className={`text-xl font-bold ${isTampered ? "text-red-500 animate-pulse" : "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"}`}>
            {isTampered ? "CRITICAL BREACH" : "ACTIVE CIVILIZATION"}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1 relative z-10">
        {/* 左侧：哈希瀑布 */}
        <aside className="col-span-4 border border-purple-900/30 p-4 bg-black/40 backdrop-blur-sm rounded-lg relative overflow-hidden group hover:border-purple-500/50 transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
          <h2 className="text-xs mb-4 text-purple-500 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="animate-spin">❖</span> Recursion Stream
          </h2>
          <div className="space-y-3 font-mono text-[10px]">
            {hashes.map((h, i) => (
              <div key={h.id || i} className="border-l-2 border-purple-900/50 pl-3 py-1 opacity-70 hover:opacity-100 transition-opacity">
                <span className="text-purple-600 block mb-1">[{new Date(h.created_at).toLocaleTimeString()}]</span>
                <p className="text-purple-300 break-all leading-tight">{h.current_hash}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* 右侧：主控区 */}
        <main className="col-span-8 flex flex-col gap-6">
          {/* 导航按钮 */}
          <nav className="flex flex-wrap gap-3">
            {modules.map(m => (
              <button 
                key={m} 
                onClick={() => handleModuleClick(m)} 
                disabled={isThinking}
                className={`
                  relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 clip-path-polygon
                  ${activeModule === m 
                    ? 'bg-purple-600 text-black shadow-[0_0_20px_rgba(147,51,234,0.6)] scale-105' 
                    : 'bg-gray-900/50 text-purple-700 border border-purple-900/30 hover:border-purple-500 hover:text-purple-400'}
                  ${isThinking ? 'cursor-wait opacity-50' : ''}
                `}
              >
                {m}
              </button>
            ))}
          </nav>
          
          {/* 思考展示区 */}
          <section className="flex-1 border border-purple-500/20 bg-black/60 p-10 rounded-xl relative overflow-hidden min-h-[300px] flex flex-col justify-center items-center text-center group hover:border-purple-500/40 transition-colors">
            {/* 背景大字装饰 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
               <span className="text-[10rem] font-black text-purple-500 rotate-[-10deg] blur-sm">
                 {activeModule.split(' ')[0]}
               </span>
            </div>

            <h3 className="text-3xl text-white mb-8 font-light relative z-10 drop-shadow-md">
              {activeModule}
            </h3>
            
            <div className="text-xl md:text-2xl text-purple-200 leading-relaxed max-w-2xl relative z-10 min-h-[4rem]">
               {isThinking ? (
                 <div className="flex items-center gap-2 text-purple-500 text-sm animate-pulse">
                   <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                   ACCESSING NEURAL PATHWAYS...
                 </div>
               ) : (
                 <span className="drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">
                   <Typewriter text={aiThought} />
                 </span>
               )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}