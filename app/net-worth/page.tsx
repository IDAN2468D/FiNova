"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { 
  Building, 
  TrendingUp, 
  WalletCards, 
  PiggyBank, 
  Plus, 
  CreditCard,
  Building2,
  Trash2,
  AlertCircle,
  MoreVertical,
  MinusCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import toast from "react-hot-toast";

interface Asset {
  _id: string;
  name: string;
  type: 'Cash' | 'Investment' | 'Real Estate' | 'Liability/Loan';
  value: number;
}

export default function NetWorthPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<'Cash' | 'Investment' | 'Real Estate' | 'Liability/Loan'>('Cash');
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/assets");
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch {
      toast.error('שגיאה בטעינת נתונים');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value) return;
    setIsSubmitting(true);

    try {
      let finalValue = Math.abs(Number(value));
      if (type === 'Liability/Loan') {
        finalValue = -finalValue;
      }

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, value: finalValue })
      });

      if (res.ok) {
        toast.success("נשמר בהצלחה!");
        setName("");
        setValue("");
        setType("Cash");
        setIsModalOpen(false);
        fetchAssets();
      } else {
        toast.error("שגיאה בשמירה");
      }
    } catch {
      toast.error("שגיאה בשמירה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAsset = async (id: string) => {
    if (!confirm("למחוק נתון זה?")) return;
    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("נמחק בהצלחה");
        fetchAssets();
      }
    } catch {
      toast.error("שגיאה במחיקה");
    }
  };

  // Calculations
  const totalAssets = assets.filter(a => a.value > 0).reduce((acc, a) => acc + a.value, 0);
  const totalLiabilities = Math.abs(assets.filter(a => a.value < 0).reduce((acc, a) => acc + a.value, 0));
  const netWorth = totalAssets - totalLiabilities;

  const chartData = [
    { name: "נכסים", value: totalAssets, color: "#10B981" },
    { name: "התחייבויות", value: totalLiabilities, color: "#F43F5E" }
  ].filter(item => item.value > 0);

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'Cash': return <WalletCards size={24} className="text-emerald-500" />;
      case 'Investment': return <TrendingUp size={24} className="text-blue-500" />;
      case 'Real Estate': return <Building2 size={24} className="text-purple-500" />;
      case 'Liability/Loan': return <CreditCard size={24} className="text-rose-500" />;
      default: return <PiggyBank size={24} />;
    }
  };

  const getTypeName = (t: string) => {
    switch(t) {
      case 'Cash': return 'עו״ש ומזומן';
      case 'Investment': return 'השקעות שוק ההון / פנסיה';
      case 'Real Estate': return 'נדל״ן וקרקעות';
      case 'Liability/Loan': return 'התחייבויות (חובות, משכנתא)';
      default: return t;
    }
  };

  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.type]) acc[asset.type] = [];
    acc[asset.type].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  const groupOrder = ['Real Estate', 'Investment', 'Cash', 'Liability/Loan'];

  return (
    <div className="min-h-screen bg-[#F4F6FB] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-12">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {/* Dynamic Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              שווי נקי <span className="text-slate-400 dark:text-slate-500 font-medium">Net Worth</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">תמונת המצב הכוללת של ההון המצטבר שלך.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
          >
            <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>הוסף נכס או התחייבות</span>
          </button>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full shadow-lg" />
          </div>
        ) : (
          <>
            {/* Top KPI Dashboard - Monarch Money Style */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Massive Net Worth Box */}
              <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-indigo-950 dark:to-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[280px]">
                {/* Decorative glowing orb */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/5">
                      <Building className="text-indigo-300" size={20} />
                    </div>
                    <h2 className="text-indigo-200/80 font-semibold tracking-wide uppercase text-sm">השווי הנקי הכולל (Net Worth)</h2>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-6xl md:text-7xl font-black text-white drop-shadow-lg tracking-tight">
                      {netWorth.toLocaleString()}
                    </span>
                    <span className="text-3xl font-bold text-indigo-300/80">₪</span>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-white/10">
                   <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                      <p className="text-indigo-200/60 font-medium text-sm mb-1">סך הכל נכסים (Assets)</p>
                      <p className="text-2xl font-bold text-emerald-400">+{totalAssets.toLocaleString()} ₪</p>
                   </div>
                   <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                      <p className="text-indigo-200/60 font-medium text-sm mb-1">סך התחייבויות (Liabilities)</p>
                      <p className="text-2xl font-bold text-rose-400">-{totalLiabilities.toLocaleString()} ₪</p>
                   </div>
                </div>
              </div>

              {/* Minimalist Donut Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col items-center justify-center relative min-h-[280px]">
                <h3 className="text-slate-800 dark:text-slate-200 font-bold mb-2 absolute top-8 text-lg">התפלגות הון זמין</h3>
                {chartData.length > 0 ? (
                  <div className="w-full h-44 mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={8}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`₪${value.toLocaleString()}`, '']}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', padding: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 text-sm font-bold text-slate-600 dark:text-slate-300 mt-4">
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm"></div>נכסים</div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm"></div>התחייבויות</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 pb-4">
                    <PiggyBank size={48} className="opacity-20 mb-3" />
                    <span className="font-medium text-sm">אין עדיין נתונים לתצוגה</span>
                  </div>
                )}
              </div>
            </div>

            {netWorth < 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-5 rounded-2xl flex items-start sm:items-center gap-4 shadow-sm"
              >
                <div className="bg-rose-100 dark:bg-rose-500/20 p-2 rounded-xl text-rose-600 dark:text-rose-400">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="text-rose-800 dark:text-rose-300 font-bold">התחייבויות גבוהות מהנכסים</h4>
                  <p className="text-rose-600 dark:text-rose-400 text-sm font-medium mt-0.5">סך החובות וההלוואות שלך עולה על סך הרכוש. שים לב ללוח התשלומים ולריביות.</p>
                </div>
              </motion.div>
            )}

            {/* Premium Asset Tracking List */}
            <div className="space-y-8 pt-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">פירוט הון אישי</h2>

              {assets.length === 0 ? (
                <div className="bg-white/50 border border-dashed border-slate-300 dark:bg-slate-900/50 dark:border-slate-800 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400 shadow-inner">
                    <Plus size={36} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">עדיין לא הוספת נתונים</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">לחץ על הכפתור מעלה כדי להתחיל לעקוב אחרי העו״ש, חסכונות, רכבים ונדל״ן.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {groupOrder.map((group) => {
                    const groupItems = groupedAssets[group];
                    if (!groupItems) return null;

                    const isLiability = group === 'Liability/Loan';
                    const groupTotal = groupItems.reduce((acc, item) => acc + Math.abs(item.value), 0);

                    return (
                      <motion.div 
                        key={group}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-[2rem] p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800/80 overflow-hidden"
                      >
                         {/* Group Header */}
                         <div className={`p-6 pb-5 flex items-center justify-between border-b \${isLiability ? 'border-rose-100/50 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10' : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50'}`}>
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-sm \${isLiability ? 'bg-white dark:bg-slate-900 text-rose-500 border border-rose-100 dark:border-rose-800' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
                                {getTypeIcon(group)}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{getTypeName(group)}</h3>
                                <p className="text-slate-500 text-sm font-medium">{groupItems.length} רשומות</p>
                              </div>
                           </div>
                           <div className={`text-xl font-black \${isLiability ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                             ₪{groupTotal.toLocaleString()}
                           </div>
                         </div>

                         {/* Group Items */}
                         <div className="p-2">
                           {groupItems.map((item) => (
                             <div key={item._id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors group">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full \${isLiability ? 'bg-rose-400' : 'bg-emerald-400'}`}></div>
                                  <span className="text-slate-700 dark:text-slate-300 font-bold">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={`font-bold text-base tracking-tight \${isLiability ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                    {isLiability ? '-' : ''}{Math.abs(item.value).toLocaleString()} ₪
                                  </span>
                                  <button title="מחיקת רשומה" onClick={() => deleteAsset(item._id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-600 rounded-xl transition-all shadow-sm">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                             </div>
                           ))}
                         </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modern Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="bg-slate-50 dark:bg-slate-950 p-8 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">הוספת רשומה 📈</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">עדכן את השווי הנקי שלך עם נתוני אמת.</p>
              </div>
              
              <div className="p-8 pb-10">
                <form onSubmit={handleAddAsset} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">סוג הרישום</label>
                    <div className="relative">
                      <select 
                        value={type} 
                        onChange={(e: any) => setType(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-bold transition-all appearance-none cursor-pointer"
                      >
                        <option value="Cash">💵 מזומן / חשבון עו״ש</option>
                        <option value="Investment">📈 השקעות (שוק ההון, פנסיה)</option>
                        <option value="Real Estate">🏡 נדל״ן ודיור</option>
                        <option value="Liability/Loan">💳 הלוואות והתחייבויות (חוב, משכנתא)</option>
                      </select>
                      <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none text-slate-400">
                        <MoreVertical size={20} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">כינוי מזהה</label>
                    <input 
                      type="text" 
                      value={name}
                      placeholder="לדוגמא: קרן פנסיה קל גמל"
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-bold transition-all placeholder:font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">הערכת שווי נוכחי (₪)</label>
                    <input 
                      type="number" 
                      value={value}
                      placeholder="0"
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-bold transition-all text-xl placeholder:font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                      required
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      ביטול חזרה
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[1.5] py-4 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-all shadow-xl shadow-indigo-600/30 flex justify-center items-center"
                    >
                      {isSubmitting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "שמור רשומה במערכת"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
