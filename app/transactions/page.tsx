'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { ShoppingCart, Fuel, Zap, ArrowDownRight, Coffee, ChevronDown, Filter, Search, Trash2, Loader2, Briefcase, Gift, TrendingUp, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

/**
 * מיפוי קטגוריות לאייקונים וצבעים
 */
const categoryMap: Record<string, { icon: React.ReactNode; bgColor: string }> = {
  supermarket: { icon: <ShoppingCart size={20} className="text-emerald-600 dark:text-emerald-400" />, bgColor: "bg-emerald-100 dark:bg-emerald-500/20" },
  bills: { icon: <Zap size={20} className="text-indigo-600 dark:text-indigo-400" />, bgColor: "bg-indigo-100 dark:bg-indigo-500/20" },
  gas: { icon: <Fuel size={20} className="text-violet-600 dark:text-violet-400" />, bgColor: "bg-violet-100 dark:bg-violet-500/20" },
  eating_out: { icon: <Coffee size={20} className="text-amber-600 dark:text-amber-400" />, bgColor: "bg-amber-100 dark:bg-amber-500/20" },
  shopping: { icon: <ShoppingCart size={20} className="text-pink-600 dark:text-pink-400" />, bgColor: "bg-pink-100 dark:bg-pink-500/20" },
  other: { icon: <MoreHorizontal size={20} className="text-slate-600 dark:text-slate-400" />, bgColor: "bg-slate-100 dark:bg-slate-500/20" },
  salary: { icon: <Briefcase size={20} className="text-teal-600 dark:text-teal-400" />, bgColor: "bg-teal-100 dark:bg-teal-500/20" },
  gift: { icon: <Gift size={20} className="text-rose-600 dark:text-rose-400" />, bgColor: "bg-rose-100 dark:bg-rose-500/20" },
  investment: { icon: <TrendingUp size={20} className="text-cyan-600 dark:text-cyan-400" />, bgColor: "bg-cyan-100 dark:bg-cyan-500/20" },
  other_income: { icon: <ArrowDownRight size={20} className="text-teal-600 dark:text-teal-400" />, bgColor: "bg-teal-100 dark:bg-teal-500/20" },
};

const categoryLabels: Record<string, string> = {
  supermarket: "סופרמרקט",
  bills: "חשבונות",
  gas: "דלק",
  eating_out: "מסעדות",
  shopping: "קניות",
  other: "אחר",
  salary: "משכורת",
  gift: "מתנה",
  investment: "השקעות",
  other_income: "הכנסה אחרת",
};

interface TransactionData {
  _id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: "expense" | "income";
}

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("שגיאה בשליפת תנועות:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    if (!confirm("בטוח שברצונך למחוק את התנועה?")) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTransactions((prev) => prev.filter((t) => t._id !== id));
      }
    } catch (err) {
      console.error("שגיאה במחיקה:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("he-IL", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  // סינון לפי טאב + חיפוש
  const filtered = transactions
    .filter((t) => activeTab === "all" || t.type === activeTab)
    .filter((t) =>
      searchQuery === "" ||
      t.description.includes(searchQuery) ||
      categoryLabels[t.category]?.includes(searchQuery) ||
      t.amount.toString().includes(searchQuery)
    );

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto space-y-8 px-6 py-8 pb-12">

        {/* Header */}
        <header className="space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                כל הפעילויות 🧾
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">עקוב וחפש אחר כלל התנועות בחשבון שלך</p>
            </div>

            <Link href="/add" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              <span>הוסף תנועה חדשה</span>
            </Link>
          </div>

          {/* חיפוש */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="חפש תנועה, קטגוריה או סכום..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-medium text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </header>

        {/* טאבים */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setActiveTab('all')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}>
            כל התנועות 📊
          </button>
          <button onClick={() => setActiveTab('income')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'income' ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}>
            הכנסות בלבד 📈
          </button>
          <button onClick={() => setActiveTab('expense')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'expense' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}>
            הוצאות בלבד 📉
          </button>
        </div>

        {/* טעינה */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-violet-500" size={40} />
          </div>
        )}

        {/* רשימת תנועות */}
        {!loading && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden">
            {filtered.map((t, i) => {
              const cat = categoryMap[t.category] || categoryMap["other"];
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  key={t._id}
                  className={`p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group ${i !== 0 ? 'border-t border-slate-100 dark:border-slate-800/50' : ''}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-[1.2rem] ${cat.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      {cat.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-slate-800 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {t.description}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                          {categoryLabels[t.category] || t.category}
                        </span>
                        <span>{formatDate(t.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left flex flex-col items-end">
                      <span className={`font-black text-xl tracking-tight block ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                        {t.type === 'income' ? '+' : '-'}₪{t.amount.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                      title="מחק תנועה"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && !loading && (
              <div className="p-16 text-center space-y-3">
                <div className="text-5xl">📭</div>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">לא נמצאו תנועות</p>
                <p className="text-slate-400 dark:text-slate-500 font-medium">הוסף תנועה חדשה כדי שתופיע כאן.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
