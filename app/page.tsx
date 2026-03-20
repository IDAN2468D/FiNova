"use client";

import { motion } from "framer-motion";
import { Plus, ShoppingCart, Fuel, Zap, ArrowUpRight, ArrowDownRight, Coffee, PiggyBank, CreditCard, ChevronLeft, Target, Briefcase, Gift, TrendingUp, MoreHorizontal, Bot, Loader2, Sparkles, Download, FolderOpen, Import, Mail, FileText } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/Skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import toast from "react-hot-toast";

/** מיפוי קטגוריות לצבעים ואייקונים */
const catIcons: Record<string, { icon: React.ReactNode; bgColor: string; color: string }> = {
  supermarket: { icon: <ShoppingCart size={20} className="text-emerald-600 dark:text-emerald-400" />, bgColor: "bg-emerald-100 dark:bg-emerald-500/20", color: "bg-emerald-500" },
  bills: { icon: <Zap size={20} className="text-indigo-600 dark:text-indigo-400" />, bgColor: "bg-indigo-100 dark:bg-indigo-500/20", color: "bg-indigo-500" },
  gas: { icon: <Fuel size={20} className="text-violet-600 dark:text-violet-400" />, bgColor: "bg-violet-100 dark:bg-violet-500/20", color: "bg-violet-500" },
  eating_out: { icon: <Coffee size={20} className="text-amber-600 dark:text-amber-400" />, bgColor: "bg-amber-100 dark:bg-amber-500/20", color: "bg-amber-500" },
  shopping: { icon: <ShoppingCart size={20} className="text-pink-600 dark:text-pink-400" />, bgColor: "bg-pink-100 dark:bg-pink-500/20", color: "bg-pink-500" },
  other: { icon: <MoreHorizontal size={20} className="text-slate-600 dark:text-slate-400" />, bgColor: "bg-slate-100 dark:bg-slate-500/20", color: "bg-slate-500" },
  salary: { icon: <Briefcase size={20} className="text-teal-600 dark:text-teal-400" />, bgColor: "bg-teal-100 dark:bg-teal-500/20", color: "bg-teal-500" },
  gift: { icon: <Gift size={20} className="text-rose-600 dark:text-rose-400" />, bgColor: "bg-rose-100 dark:bg-rose-500/20", color: "bg-rose-500" },
  investment: { icon: <TrendingUp size={20} className="text-cyan-600 dark:text-cyan-400" />, bgColor: "bg-cyan-100 dark:bg-cyan-500/20", color: "bg-cyan-500" },
  other_income: { icon: <ArrowDownRight size={20} className="text-teal-600 dark:text-teal-400" />, bgColor: "bg-teal-100 dark:bg-teal-500/20", color: "bg-teal-500" },
};

const catLabels: Record<string, string> = {
  supermarket: "סופרמרקט", bills: "חשבונות", gas: "דלק", eating_out: "מסעדות",
  shopping: "קניות", other: "אחר", salary: "משכורת", gift: "מתנה",
  investment: "השקעות", other_income: "הכנסה אחרת",
};

interface TransactionData {
  _id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: "expense" | "income";
}

export default function Home() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "אורח";
  const userInitial = userName.charAt(0).toUpperCase();
  const userImage = session?.user?.image;

  const [activeTab, setActiveTab] = useState("all");
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("שגיאה בטעינת נתונים:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const handleSyncToSheets = async () => {
    if (transactions.length === 0) {
      toast.error("אין למערכת נתונים קיימים כדי לסנכרן.");
      return;
    }
    setIsSyncingSheets(true);
    try {
      const res = await fetch("/api/export/sheets", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          <span>
            גיבוי הצליח! <a href={data.spreadsheetUrl} target="_blank" rel="noreferrer" className="underline font-bold text-indigo-700">פתח כאן</a>
          </span>, 
          { duration: 6000 }
        );
      } else {
        toast.error(data.message || "שגיאה בגיבוי לגוגל.");
      }
    } catch (err) {
      toast.error("שגיאת רשת מול השרת.");
    } finally {
      setIsSyncingSheets(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(null);

  // מצבי ה-Import (ייבוא נתונים מגוגל אקסל)
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importSheetUrl, setImportSheetUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isScanningGmail, setIsScanningGmail] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  useEffect(() => {
    // מחפשים האם יש למשתמש כבר תיקיית קבלות בדרייב
    if (session?.user) {
      fetch("/api/drive/folder")
        .then(r => r.json())
        .then(data => {
          if (data.success && data.folderUrl) {
             setDriveFolderUrl(data.folderUrl);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const handleGenerateInsight = async () => {
    if (transactions.length === 0) return;
    setIsGeneratingInsight(true);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions })
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data.insight);
      }
    } catch (err) {
      console.error("שגיאה במשיכת תובנות:", err);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  // חישוב סיכומים דינמיים מהנתונים האמיתיים
  const currentSpent = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);
  const currentIncome = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const monthlyBudget = 6000;
  const spentPercentage = Math.min((currentSpent / monthlyBudget) * 100, 100);

  // חישוב קטגוריות דינמי
  const categories = useMemo(() => {
    const expenseOnly = transactions.filter(t => t.type === "expense");
    const grouped: Record<string, number> = {};
    expenseOnly.forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + t.amount; });
    const total = expenseOnly.reduce((s, t) => s + t.amount, 0) || 1;
    return Object.entries(grouped)
      .map(([cat, amount]) => ({
        name: catLabels[cat] || cat,
        value: amount, // renamed to 'value' for Recharts
        percentage: Math.round((amount / total) * 100),
        colorHex: cat === 'supermarket' ? '#10b981' : 
                  cat === 'bills' ? '#6366f1' : 
                  cat === 'gas' ? '#8b5cf6' : 
                  cat === 'eating_out' ? '#f59e0b' : 
                  cat === 'shopping' ? '#ec4899' : '#64748b',
        color: catIcons[cat]?.color || "bg-slate-500",
        icon: catIcons[cat]?.icon || <MoreHorizontal size={16} />,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // 4 תנועות אחרונות
  const recentExpenses = useMemo(() => {
    return transactions.slice(0, 4).map(t => ({
      id: t._id,
      title: t.description,
      amount: t.amount,
      date: new Date(t.date).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" }),
      categoryName: catLabels[t.category] || t.category,
      icon: catIcons[t.category]?.icon || <MoreHorizontal size={20} />,
      bgColor: catIcons[t.category]?.bgColor || "bg-slate-100",
      type: t.type,
    }));
  }, [transactions]);

  const handleImportSheet = async () => {
    if (!importSheetUrl) return;
    setIsImporting(true);
    try {
      const res = await fetch("/api/drive/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId: importSheetUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`נשאבו בהצלחה ${data.count} שורות נתונים מהגיליון!`);
        setShowImportDialog(false);
        setImportSheetUrl("");
        fetchData(); // טעינת נתונים מחדש אחרי ייבוא מוצלח
      } else {
        toast.error(data.message || "שגיאה בייבוא מהגיליון.");
      }
    } catch (err) {
      toast.error("שגיאת רשת מול השרת בייבוא הגיליון.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleScanGmail = async () => {
    setIsScanningGmail(true);
    toast.loading("מפעיל בוט סורק מיילים...", { id: "gmail" });
    try {
      const res = await fetch("/api/gmail/scan");
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.receipts.length > 0) {
          toast.success(
            <span>
              מצאתי {data.receipts.length} קבלות פוטנציאליות במייל שלך! <br/>
              <b>דוגמה מזהה:</b> {data.receipts[0].subject}
            </span>, 
            { id: "gmail", duration: 8000 }
          );
          // כאן ניתן בעתיד להזרים את המערך הזה ל-Modal מיוחד לאישור.
        } else {
           toast.error("לא מצאתי קבלות חדשות במייל (Wolts, Apple, חשבוניות וכו').", { id: "gmail" });
        }
      } else {
        toast.error(data.message || "שגיאה בחיבור ל-Gmail API.", { id: "gmail" });
      }
    } catch (err) {
      toast.error("שגיאת רשת מול השרת.", { id: "gmail" });
    } finally {
      setIsScanningGmail(false);
    }
  };

  const handleGenerateDoc = async () => {
    setIsGeneratingDoc(true);
    toast.loading("מפיק דוח פיננסי אוטומטי (Docs)...", { id: "doc" });
    try {
      const res = await fetch("/api/docs/generate", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
         toast.success(
            <span>דוח הופק! <a href={data.documentUrl} target="_blank" rel="noreferrer" className="underline font-bold text-emerald-800">פתח דוח עכשיו</a></span>, 
            { id: "doc", duration: 8000 }
         );
      } else {
         toast.error(data.message || "שגיאה בחיבור ל-Docs API.", { id: "doc" });
      }
    } catch (err) {
      toast.error("שגיאת רשת מול השרת.", { id: "doc" });
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto space-y-6 pb-12 relative mt-6 px-6">
        
        {/* 1. Header Section */}
        <div className="flex items-center mb-6 mt-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">שלום, {userName} 👋</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">הנה סקירה של ההוצאות שלך החודש</p>
          </div>
        </div>

        {/* 1.5. Mobile-Friendly Scrollable Action Bar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide snap-x mb-2 w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>
            
            <button
              onClick={handleGenerateDoc}
              disabled={isGeneratingDoc}
              className="flex shrink-0 snap-start items-center gap-2 px-4 py-2.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 border border-emerald-100 dark:border-emerald-800/30"
              title="הפקת דוח מסכם"
            >
               {isGeneratingDoc ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
               <span className="text-sm whitespace-nowrap">דוח מנהלים (Docs)</span>
            </button>
            <button
              onClick={handleScanGmail}
              disabled={isScanningGmail}
              className="flex shrink-0 snap-start items-center gap-2 px-4 py-2.5 text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 border border-rose-100 dark:border-rose-800/30"
              title="סורק קבלות מג'ימייל"
            >
               {isScanningGmail ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
              <span className="text-sm whitespace-nowrap">צייד קבלות</span>
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="flex shrink-0 snap-start items-center gap-2 px-4 py-2.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 font-bold rounded-xl transition-colors shadow-sm border border-indigo-100 dark:border-indigo-800/30"
              title="ייבוא מ-Sheets ידני"
            >
              <Import size={18} />
              <span className="text-sm whitespace-nowrap">ייבוא נתונים מצד ג׳</span>
            </button>
            {driveFolderUrl && (
              <a
                href={driveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 snap-start items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold rounded-xl transition-colors shadow-sm border border-amber-100 dark:border-amber-800/30"
                title="תיקיית הקבלות שלי"
              >
                <FolderOpen size={18} />
                <span className="text-sm whitespace-nowrap">קבלות (Drive)</span>
              </a>
            )}
            <button
              onClick={handleSyncToSheets}
              disabled={isSyncingSheets}
              className="flex shrink-0 snap-start items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 border border-blue-100 dark:border-blue-800/30"
              title="גיבוי ענן לגוגל"
            >
              {isSyncingSheets ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              <span className="text-sm whitespace-nowrap">גיבוי ענן (Sheets)</span>
            </button>
            <button
              onClick={() => {
                import("@/utils/exportToCSV").then((module) => {
                  module.exportTransactionsToCSV(transactions);
                  toast.success("הדוח ירד בהצלחה!");
                });
              }}
              className="flex shrink-0 snap-start items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl transition-colors shadow-sm border border-emerald-100 dark:border-emerald-800/30"
              title="יצוא לאקסל"
            >
              <Download size={18} />
              <span className="text-sm whitespace-nowrap">יצוא לאקסל</span>
            </button>
        </div>

        {/* Main Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Balance Card - Premium Gradient */}
        {loading ? (
          <Skeleton className="md:col-span-2 h-[260px] rounded-3xl" />
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 shadow-xl text-white"
          >
            {/* Decorative blur elements */}
            <div className="absolute -top-24 -end-24 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -start-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">יתרה נוכחית</p>
                  <div className="flex items-end gap-3">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                      ₪{(currentIncome - currentSpent).toLocaleString()}
                    </h2>
                  </div>
                </div>
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
                  <CreditCard className="text-white/80" size={24} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ArrowDownRight className="text-emerald-400" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300">הכנסות</p>
                    <p className="text-lg font-bold">₪{currentIncome.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                    <ArrowUpRight className="text-rose-400" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300">הוצאות</p>
                    <p className="text-lg font-bold">₪{currentSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Budget Progress Card */}
        {loading ? (
          <Skeleton className="h-[260px] rounded-3xl" />
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card rounded-[2rem] p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-800 dark:text-white">תקציב חודשי</h3>
                <Target size={18} className="text-indigo-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">מרץ 2026</p>
              
              {/* Circular Progress (CSS Hack) */}
              <div className="relative w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="10" fill="none" />
                  <motion.circle 
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * spentPercentage) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="50" cy="50" r="40" 
                    className={`stroke-indigo-500 transition-all ${spentPercentage > 90 ? "!stroke-rose-500" : ""}`} 
                    strokeWidth="10" fill="none" 
                    strokeDasharray="251.2" 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">{Math.round(spentPercentage)}%</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                נוצלו <span className="font-bold text-slate-900 dark:text-white">₪{currentSpent.toLocaleString()}</span> מתוך ₪{monthlyBudget.toLocaleString()}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Expense Distribution (Recharts) */}
        {loading ? (
          <Skeleton className="h-[350px] rounded-3xl" />
        ) : (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card rounded-[2rem] p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">התפלגות הוצאות</h3>
              <Link href="/transactions" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">פירוט מלא</Link>
            </div>
            
            <div className="flex-1 min-h-[250px] w-full relative" dir="ltr">
              {categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.colorHex} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => [`₪${val.toLocaleString()}`, "סכום"]}
                      itemStyle={{ textAlign: 'right', direction: 'rtl' }}
                      contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0', direction: 'rtl', textAlign: 'right' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium ms-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 font-semibold" dir="rtl">
                  אין מספיק נתונים להצגת גרף 📉
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Savings Goal */}
        {loading ? (
          <Skeleton className="h-[350px] rounded-3xl" />
        ) : (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card rounded-[2rem] p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">יעדי חיסכון</h3>
              <PiggyBank size={20} className="text-pink-500" />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center">
                      <PiggyBank size={20} className="text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">חופשה בחו״ל</h4>
                      <p className="text-xs text-slate-500">יעד: דצמבר 2026</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-slate-900 dark:text-white">₪4,500</span>
                  </div>
                </div>
                
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "45%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>45% בוצע</span>
                  <span>מתוך ₪10,000</span>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* AI Financial Advisor */}
      {!loading && transactions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl shadow-xl overflow-hidden mt-6 relative"
        >
          {/* Decorative Sparkles */}
          <div className="absolute top-0 end-0 p-8 opacity-20 pointer-events-none">
            <Sparkles size={120} className="text-white" />
          </div>
          <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Bot size={40} className="text-white drop-shadow-md" />
            </div>
            <div className="flex-1 text-center md:text-right">
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">יועץ פיננסי חכם (AI)</h3>
              <p className="text-indigo-100 font-medium max-w-2xl text-sm md:text-base mb-4">
                קבל תובנות אישיות בזמן אמת על בסיס נתוני ההוצאות וההכנסות שלך, פרי פיתוח טכנולוגיית Gemini של Google.
              </p>
              
              {!aiInsight && (
                <button 
                  onClick={handleGenerateInsight}
                  disabled={isGeneratingInsight}
                  className="bg-white hover:bg-slate-50 text-indigo-700 disabled:opacity-80 px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-black/10 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto md:mx-0"
                >
                  {isGeneratingInsight ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {isGeneratingInsight ? "מנתח נתונים..." : "גלה תובנות חדשות"}
                </button>
              )}

              {aiInsight && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="bg-white/10 backdrop-blur-lg border border-white/20 p-5 rounded-2xl mt-4 text-white shadow-inner"
                >
                  <div 
                    className="text-sm md:text-base leading-relaxed tracking-wide"
                    dangerouslySetInnerHTML={{ __html: aiInsight }} 
                  />
                  <button 
                    onClick={handleGenerateInsight}
                    disabled={isGeneratingInsight}
                    className="mt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-200 hover:text-white transition-colors"
                  >
                    {isGeneratingInsight ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                    {isGeneratingInsight ? "מעדכן..." : "בקש תובנה נוספת"}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* 3. Recent Expenses List */}
      {loading ? (
        <Skeleton className="h-[400px] rounded-3xl mt-6" />
      ) : (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card rounded-[2rem] overflow-hidden mt-6"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/30 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              פעילויות אחרונות
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeTab === 'all' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                הכל
              </button>
              <button 
                onClick={() => setActiveTab('income')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeTab === 'income' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                הכנסות
              </button>
              <button 
                onClick={() => setActiveTab('expense')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeTab === 'expense' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                הוצאות
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {recentExpenses
              .filter(expense => activeTab === 'all' || expense.type === activeTab)
              .map((expense) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={expense.id}
                className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${expense.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    {expense.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-white mb-0.5">
                      {expense.title}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-600 dark:text-slate-400">{expense.categoryName}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span>{expense.date}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-lg ${expense.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                    {expense.type === 'income' ? '+' : '-'}₪{expense.amount.toLocaleString()}
                  </span>
                  <ChevronLeft size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity -ms-2" />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/20 text-center">
            <Link href="/transactions" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
              הצג הכל
            </Link>
          </div>
        </motion.section>
      )}

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-24 start-6 z-50 md:bottom-12 md:start-12">
        <Link href="/add">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl rotate-45 shadow-xl shadow-indigo-600/30 flex items-center justify-center cursor-pointer group"
          >
            <div className="-rotate-45 group-hover:rotate-0 transition-transform duration-300">
              <Plus size={32} />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Import Modal Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
             className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border border-slate-200 dark:border-slate-800"
          >
             <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white">ייבוא מ-Google Sheets</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
               הדבק כאן לינק או ID של גיליון אקסל (צריך להיות בפורמט זהה למבנה הגיבוי שלנו) והמערכת תשואב את הנתונים ישירות פנימה.
             </p>
             <input 
               type="text"
               value={importSheetUrl}
               onChange={(e) => setImportSheetUrl(e.target.value)}
               placeholder="https://docs.google.com/spreadsheets/d/..."
               className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 py-3 px-4 rounded-xl text-left mb-6 font-medium text-slate-800 dark:text-white"
               dir="ltr"
             />
             <div className="flex gap-3">
                <button 
                  onClick={() => setShowImportDialog(false)}
                  className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold transition-all"
                >
                  ביטול
                </button>
                <button 
                  onClick={handleImportSheet}
                  disabled={isImporting || !importSheetUrl}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isImporting ? <Loader2 size={18} className="animate-spin" /> : "ייבא עכשיו"}
                </button>
             </div>
          </motion.div>
        </div>
      )}
      </div>
    </>
  );
}
