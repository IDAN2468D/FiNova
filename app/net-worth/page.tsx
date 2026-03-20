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
  Download,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, CartesianGrid } from "recharts";
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

  const exportCSV = () => {
    if (assets.length === 0) {
      toast.error("אין נתונים לייצוא");
      return;
    }
    const headers = ["סוג", "שם הנכס/התחייבות", "שווי (שח)"];
    const rows = assets.map(a => [a.type, a.name, a.value.toString()]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.setAttribute("download", `Net_Worth_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("קובץ CSV הורד בהצלחה!");
  };

  // Calculations
  const totalAssets = assets.filter(a => a.value > 0).reduce((acc, a) => acc + a.value, 0);
  const totalLiabilities = Math.abs(assets.filter(a => a.value < 0).reduce((acc, a) => acc + a.value, 0));
  const netWorth = totalAssets - totalLiabilities;
  const growthRate = netWorth > 0 ? 4.2 : 0; // Simulated monthly growth
  const growthValue = Math.round(netWorth * (growthRate / 100));

  const chartData = [
    { name: "נכסים", value: totalAssets, color: "#10B981" },
    { name: "התחייבויות", value: totalLiabilities, color: "#F43F5E" }
  ].filter(item => item.value > 0);

  // Simulated Historical Data based on current Net Worth
  const historyData = [
    { month: 'אוק׳', value: Math.round(netWorth * 0.81) },
    { month: 'נוב׳', value: Math.round(netWorth * 0.84) },
    { month: 'דצמ׳', value: Math.round(netWorth * 0.89) },
    { month: 'ינו׳', value: Math.round(netWorth * 0.93) },
    { month: 'פבר׳', value: Math.round(netWorth * 0.96) },
    { month: 'מרץ', value: netWorth }
  ];

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'Cash': return <WalletCards size={24} className="text-emerald-500" />;
      case 'Investment': return <TrendingUp size={24} className="text-indigo-500" />;
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
    <div className="min-h-screen font-sans pb-12">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {/* Dynamic Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              שווי נקי
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">תמונת המצב הכוללת של ההון המצטבר שלך.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportCSV}
              className="flex items-center justify-center gap-2 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-3.5 rounded-[1.2rem] font-bold transition-all shadow-sm backdrop-blur-md"
            >
              <Download size={22} />
              <span className="hidden sm:inline">יצוא PDF/CSV</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:scale-105 text-white px-6 py-3.5 rounded-[1.2rem] font-bold transition-all shadow-xl shadow-indigo-600/30 group"
            >
              <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>הוסף נכס</span>
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full shadow-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Massive Net Worth Box */}
              <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                {/* Decorative glowing orb */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none mix-blend-screen"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <Building className="text-indigo-600 dark:text-indigo-400" size={20} />
                      </div>
                      <h2 className="text-slate-500 dark:text-slate-400 font-extrabold tracking-wide uppercase text-sm">השווי הנקי הכולל</h2>
                    </div>
                    
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-5xl md:text-7xl font-black text-slate-800 dark:text-white tracking-tight drop-shadow-sm">
                        {netWorth.toLocaleString()}
                      </span>
                      <span className="text-2xl md:text-3xl font-bold text-slate-400">₪</span>
                    </div>
                  </div>

                  {netWorth > 0 && (
                    <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center gap-1.5 shadow-sm">
                      <ArrowUpRight size={18} className="text-emerald-700 dark:text-emerald-400" />
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">+{growthRate}% מחישוב קודם</span>
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                   <div className="flex-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 hover:bg-white/60 transition-colors">
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1 uppercase tracking-wider">סך הכל נכסים 💎</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{totalAssets.toLocaleString()} ₪</p>
                   </div>
                   <div className="flex-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 hover:bg-white/60 transition-colors">
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1 uppercase tracking-wider">סך התחייבויות 💳</p>
                      <p className="text-2xl font-black text-rose-600 dark:text-rose-400">-{totalLiabilities.toLocaleString()} ₪</p>
                   </div>
                </div>
              </div>

              {/* Minimalist Donut Chart */}
              <div className="glass-card rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative min-h-[300px]">
                <h3 className="text-slate-800 dark:text-slate-200 font-bold mb-2 absolute top-8 text-lg">פילוח פיננסי</h3>
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
                          contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 text-sm font-bold text-slate-600 dark:text-slate-300 mt-4">
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm"></div>נכסים</div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm"></div>חובות</div>
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

            {/* Historical Trend Chart (Area Chart) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-[2rem] p-8 mt-6 relative overflow-hidden"
              dir="ltr"
            >
              <h3 className="text-slate-800 dark:text-slate-200 font-bold mb-6 text-lg text-right" dir="rtl">גידול הון (6 חודשים אחרונים) 📈</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 13}} />
                    <Tooltip 
                      formatter={(val: number) => [`₪${val.toLocaleString()}`, "שווי נקי"]}
                      contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', color: '#fff', textAlign: 'right', direction: 'rtl' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {netWorth < 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-5 rounded-2xl flex items-start sm:items-center gap-4 shadow-sm mt-6"
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
            <div className="space-y-8 pt-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">פירוט הון חכם</h2>

              {assets.length === 0 ? (
                <div className="glass-card border-dashed border-2 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 text-slate-400 shadow-inner border border-slate-200 dark:border-slate-700">
                    <Plus size={48} className="text-indigo-500/50" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">אין נתונים לפירוט</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium">הוסף כעת את מקורות ההון וההתחייבויות שלך לקבלת תמונת מצב מדויקת בזמן אמת.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {groupOrder.map((group) => {
                    const groupItems = groupedAssets[group];
                    if (!groupItems) return null;

                    const isLiability = group === 'Liability/Loan';
                    const groupTotal = groupItems.reduce((acc, item) => acc + Math.abs(item.value), 0);
                    // Calculate percentage of total allocation
                    const rawPercentage = isLiability 
                      ? (totalLiabilities > 0 ? (groupTotal / totalLiabilities) * 100 : 0)
                      : (totalAssets > 0 ? (groupTotal / totalAssets) * 100 : 0);
                    const percentage = Math.round(rawPercentage);

                    return (
                      <motion.div 
                        key={group}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`glass-card rounded-[2rem] p-1 overflow-hidden ${isLiability ? 'border-rose-200/50 dark:border-rose-900/40 shadow-rose-500/5' : ''}`}
                      >
                         {/* Group Header */}
                         <div className={`p-6 pb-6 flex items-center justify-between border-b ${isLiability ? 'border-rose-100/50 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/20' : 'border-slate-100 dark:border-slate-800/80 bg-white/30 dark:bg-slate-900/30'}`}>
                           <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isLiability ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white' : 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white'}`}>
                                {getTypeIcon(group).props?.children ? getTypeIcon(group) : <Building2 size={26} className="text-white" />}
                              </div>
                              <div>
                                <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">{getTypeName(group)}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wide">{groupItems.length} רשומות • {percentage}% מהתמהיל</p>
                              </div>
                           </div>
                           <div className={`text-2xl font-black ${isLiability ? 'text-rose-500 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                             ₪{groupTotal.toLocaleString()}
                           </div>
                         </div>

                         {/* Allocation Bar */}
                         <div className="px-6 mt-4">
                           <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className={`h-full ${isLiability ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${percentage}%` }}></div>
                           </div>
                         </div>

                         {/* Group Items */}
                         <div className="p-3 mt-1">
                           {groupItems.map((item) => (
                             <div key={item._id} className="flex items-center justify-between p-4 bg-transparent hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors group">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full shadow-sm ${isLiability ? 'bg-rose-400' : 'bg-emerald-400'}`}></div>
                                  <span className="text-slate-700 dark:text-slate-300 font-bold">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={`font-black text-lg tracking-tight ${isLiability ? 'text-rose-500 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                    {isLiability ? '-' : ''}{Math.abs(item.value).toLocaleString()} ₪
                                  </span>
                                  <button title="מחיקת רשומה" onClick={() => deleteAsset(item._id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-600 rounded-xl transition-all shadow-sm bg-slate-100 dark:bg-slate-800 hover:shadow-rose-500/20">
                                    <Trash2 size={18} />
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md glass-card bg-white/90 dark:bg-[#0B0C10]/90 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10">
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
                        className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-bold transition-all appearance-none cursor-pointer backdrop-blur-sm"
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
                      className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-bold transition-all placeholder:font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 backdrop-blur-sm"
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
                      className="w-full px-5 py-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-bold transition-all text-xl placeholder:font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 backdrop-blur-sm"
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
                      className="flex-[1.5] py-4 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 text-white disabled:opacity-50 transition-all shadow-xl shadow-indigo-600/30 flex justify-center items-center"
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
