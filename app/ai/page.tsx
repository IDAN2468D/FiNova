"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, ChevronLeft, Sparkles, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function AiAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "שלום! ✦<br><br>אני היועץ הפיננסי האישי שלך. אני מסונכרן עם ההיסטוריה שלך ויכול לעזור לך לתכנן תקציב חכם, למצוא היכן אפשר לחסוך, ולענות על שאלות כלכליות בצורה מקצועית.<br><br><b>במה אפשר לעזור היום?</b>" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/transactions")
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          transactions
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "model", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "model", content: "אופס, נתקלתי בבעיה להתחבר למסד הנתונים שלי. נסה שוב מאוחר יותר." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "שגיאת רשת. בדוק את החיבור לאינטרנט ונסה שוב." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 flex flex-col items-center font-sans selection:bg-indigo-200 dark:selection:bg-indigo-500/30">
      <div className="w-full fixed top-0 z-50">
        <Navbar />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 w-full max-w-5xl h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)] mx-auto px-4 lg:px-8 pt-24 pb-8 flex flex-col"
      >
        {/* Superior Header */}
        <div className="flex items-center justify-between xl:justify-start xl:gap-8 mb-6 mt-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all font-semibold group bg-white dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/80"
          >
            <ArrowRight size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">חזור לראשי</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="relative group">
               <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                 <Bot size={26} className="relative z-10 drop-shadow-md" />
               </div>
               <span className="absolute -top-1 -end-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#FAFAFA] dark:border-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                היועץ <span className="text-transparent bg-clip-text bg-gradient-to-l from-violet-600 to-blue-600">החכם</span>
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">מופעל ע״י הבינה המלאכותית של Google Gemini</p>
            </div>
          </div>
        </div>

        {/* Premium Chat Area Container */}
        <div className="flex-1 bg-white dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-2xl shadow-indigo-900/5 dark:shadow-none overflow-hidden flex flex-col mb-2 xl:mb-6">
          
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-8 scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`flex gap-4 w-full ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-10 h-10 mt-1 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-tr from-blue-500 to-cyan-400 text-white' 
                      : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-indigo-500/30'
                  }`}>
                    {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
                  </div>
                  
                  <div className={`max-w-[85%] md:max-w-[70%] px-6 py-4 rounded-[1.5rem] text-[15px] md:text-base leading-[1.7] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-tr-sm font-medium' 
                      : 'bg-[#F8F9FB] dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 rounded-tl-sm font-normal'
                  }`}>
                    <div 
                       className="prose prose-sm md:prose-base dark:prose-invert max-w-none [&>p]:mb-0 [&_b]:text-indigo-600 dark:[&_b]:text-indigo-400" 
                       dangerouslySetInnerHTML={{ __html: msg.content }} 
                    />
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 flex-row w-full"
                >
                  <div className="w-10 h-10 mt-1 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
                     <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div className="bg-[#F8F9FB] dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 rounded-[1.5rem] rounded-tl-sm px-6 py-5 flex gap-2 items-center h-[54px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/60 animate-bounce"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/80 animate-bounce delay-100"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600/100 animate-bounce delay-200"></span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endOfMessagesRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 bg-white dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/60 relative">
            <div className="max-w-4xl mx-auto relative flex items-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700/80 focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-all duration-300 shadow-inner">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="הקלד/י כאן את השאלה או הבקשה שלך..."
                className="w-full bg-transparent px-6 py-4 md:py-5 text-slate-800 dark:text-white outline-none placeholder:text-slate-400 font-medium text-base"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="mx-3 w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white disabled:opacity-40 transition-all shadow-md hover:shadow-lg disabled:hover:shadow-none transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="me-1" />}
              </button>
            </div>
            <div className="text-center mt-4 flex justify-center items-center gap-1.5 opacity-60">
               <Bot size={13} className="text-slate-500" />
               <span className="text-[11px] text-slate-500 font-medium tracking-wide">זכרו: הייעוץ נתון לשימושכם העצמי ואינו בא להחליף איש מקצוע.</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
