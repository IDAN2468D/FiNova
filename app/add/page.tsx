"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Save, FileText, CalendarDays, LayoutTemplate, Wallet, Bot, Loader2, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function AddExpense() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");
  
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [smartText, setSmartText] = useState("");
  const [isSmartParsing, setIsSmartParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSmartParsing(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        const res = await fetch("/api/ai/vision-parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            imageBase64: base64data,
            mimeType: file.type
          })
        });

        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({
            ...prev,
            amount: data.amount ? String(data.amount) : prev.amount,
            description: data.description || prev.description,
            category: data.category || prev.category,
            date: data.date || prev.date
          }));
          
          if (['salary', 'gift', 'investment', 'other_income'].includes(data.category)) {
            setTransactionType("income");
          } else {
            setTransactionType("expense");
          }

          toast.success("הקבלה פוענחה בהצלחה!");
        } else {
          toast.error("שגיאה בפענוח התמונה.");
        }
        setIsSmartParsing(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("שגיאת רשת. נסה שוב.");
      setIsSmartParsing(false);
    }
  };

  const handleSmartParse = async () => {
    if (!smartText.trim()) return;
    setIsSmartParsing(true);
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: smartText })
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          amount: data.amount ? String(data.amount) : prev.amount,
          description: data.description || prev.description,
          category: data.category || prev.category,
          date: data.date || prev.date
        }));
        
        // Auto-detect income vs expense if category matches income types
        if (['salary', 'gift', 'investment', 'other_income'].includes(data.category)) {
          setTransactionType("income");
        } else {
          setTransactionType("expense");
        }

        toast.success("פוענח בהצלחה! השדות מולאו אוטומטית.");
        setSmartText("");
      } else {
        toast.error("שגיאה בפענוח חכם.");
      }
    } catch {
      toast.error("שגיאת רשת. נסה שוב.");
    } finally {
      setIsSmartParsing(false);
    }
  };

  const categories = transactionType === "expense" ? [
    { id: "supermarket", label: "סופרמרקט" },
    { id: "bills", label: "חשבונות" },
    { id: "gas", label: "דלק" },
    { id: "eating_out", label: "מסעדות מחוץ לבית" },
    { id: "shopping", label: "קניות" },
    { id: "other", label: "אחר" },
  ] : [
    { id: "salary", label: "משכורת" },
    { id: "gift", label: "מתנה" },
    { id: "investment", label: "השקעות" },
    { id: "other_income", label: "הכנסה אחרת" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: transactionType }),
      });

      if (res.ok) {
        toast.success("התנועה נשמרה בהצלחה!");
        router.push("/");
      } else {
        const data = await res.json();
        toast.error(data.message || "שגיאה בשמירת התנועה.");
      }
    } catch {
      toast.error("שגיאת רשת. נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto space-y-6 pb-12 px-6"
    >
      {/* Header / Back Button */}
      <div className="flex items-center">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium group"
        >
          <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:bg-slate-50 dark:group-hover:bg-slate-700 transition-colors">
            <ArrowRight size={18} />
          </div>
          <span>חזרה ללוח הבקרה</span>
        </Link>
      </div>

      {/* Main Form Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 mb-2">
          הוספת פעולה חדשה
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          כאן תוכל להוסיף הוצאה או הכנסה חדשה למעקב.
        </p>
      </div>

      {/* Smart Add Section */}
      <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-violet-200 dark:border-violet-800/60 shadow-inner">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={20} className="text-violet-600 dark:text-violet-400" />
          <h2 className="font-bold text-slate-800 dark:text-white">הוספה חכמה עם AI</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          כתוב חופשי מה קנית או הכנסת, או העלה תמונה של קבלה, והבינה המלאכותית תמלא את הטופס עבורך.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea 
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
            placeholder="הקלד כאן... למשל: &quot;קניתי קפה ב-15 שקלים&quot;" 
            rows={2}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSmartParse();
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <button 
              type="button"
              onClick={handleSmartParse}
              disabled={isSmartParsing || !smartText.trim()}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isSmartParsing ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
              פענח טקסט
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSmartParsing}
              className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700/50 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-slate-700 font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isSmartParsing ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              סרוק קבלה
            </button>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800/60 p-6 md:p-8 relative overflow-hidden">
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 end-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />

        <form onSubmit={handleSubmit} className="space-y-8 flex flex-col relative z-10">
          
          {/* Type Toggle */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full">
            <button
              type="button"
              onClick={() => setTransactionType("expense")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                transactionType === "expense" 
                  ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              הוצאה
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("income")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                transactionType === "income" 
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              הכנסה
            </button>
          </div>

          {/* Amount Field (Large focus area) */}
          <div className="space-y-4">
            <label htmlFor="amount" className="block text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              {transactionType === "expense" ? "כמה הוצאת?" : "כמה הכנסת?"}
            </label>
            <div className="flex justify-center items-center">
              <div className="relative w-2/3 md:w-1/2">
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className={`block w-full text-center py-4 bg-transparent border-b-2 focus:outline-none transition-colors text-5xl font-extrabold ${
                    transactionType === "expense" 
                      ? "text-rose-600 dark:text-rose-400 border-rose-200 focus:border-rose-500 placeholder-rose-200 dark:placeholder-rose-900" 
                      : "text-emerald-600 dark:text-emerald-400 border-emerald-200 focus:border-emerald-500 placeholder-emerald-200 dark:placeholder-emerald-900"
                  }`}
                />
                <span className={`absolute top-1/2 -translate-y-1/2 start-4 text-3xl font-bold opacity-50 ${
                  transactionType === "expense" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  ₪
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            {/* Description Field */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                תיאור (למה?)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <FileText size={18} />
                </div>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder={transactionType === "expense" ? "לדוגמה: קפה ומאפה במאפייה" : "לדוגמה: פרויקט פרילנס בינואר"}
                  className="block w-full ps-12 pe-4 py-3.5 text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Category Field */}
            <div className="space-y-2">
              <label htmlFor="category" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                קטגוריה
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <LayoutTemplate size={18} />
                </div>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="block w-full ps-12 pe-10 py-3.5 text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled hidden>בחר/י...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Date Field */}
            <div className="space-y-2">
              <label htmlFor="date" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                מתי?
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <CalendarDays size={18} />
                </div>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="block w-full ps-12 pe-4 py-3.5 text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`group relative w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-lg font-bold rounded-2xl text-white transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl overflow-hidden mt-4
              ${transactionType === "expense" 
                ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-slate-500/20" 
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ms-1 me-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {transactionType === "expense" ? "שומר הוצאה..." : "שומר הכנסה..."}
              </span>
            ) : (
              <>
                <Wallet size={20} className="group-hover:scale-110 transition-transform" />
                <span>{transactionType === "expense" ? "הוסף הוצאה" : "הוסף הכנסה"}</span>
              </>
            )}
            
            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
          </button>
        </form>
      </div>
    </motion.div>
  );
}
