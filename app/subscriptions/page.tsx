"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Repeat, Calendar, Plus, CreditCard, Loader2, X, Trash2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";

interface SubscriptionItem {
  _id: string;
  name: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  category: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [category, setCategory] = useState("שירותים ודיגיטל");

  const fetchSubs = async () => {
    try {
      const res = await fetch("/api/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } catch (err) {
      toast.error("שגיאה בטעינת המנויים");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !nextBillingDate) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: Number(amount),
          billingCycle,
          nextBillingDate,
          category
        })
      });
      if (res.ok) {
        toast.success("המנוי נוסף בהצלחה!");
        setIsModalOpen(false);
        setName("");
        setAmount("");
        setBillingCycle("monthly");
        setNextBillingDate("");
        fetchSubs();
      } else {
        toast.error("שגיאה ביצירת המנוי");
      }
    } catch {
      toast.error("שגיאת רשת");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!confirm("האם למחוק מנוי זה?")) return;
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("המנוי נמחק");
        fetchSubs();
      } else {
        toast.error("שגיאה במחיקה");
      }
    } catch {
      toast.error("שגיאת רשת");
    }
  };

  const totalMonthly = subscriptions.reduce((acc, sub) => {
    return acc + (sub.billingCycle === "yearly" ? sub.amount / 12 : sub.amount);
  }, 0);

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const getIconColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("netflix") || n.includes("youtube")) return "bg-red-500 text-white";
    if (n.includes("spotify")) return "bg-green-500 text-white";
    if (n.includes("gym") || n.includes("holmes")) return "bg-blue-500 text-white";
    if (n.includes("apple") || n.includes("icloud")) return "bg-slate-800 text-white";
    if (n.includes("disney")) return "bg-indigo-600 text-white";
    return "bg-violet-500 text-white";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-8">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">ניהול מנויים 🔁</h1>
            <p className="text-slate-500 dark:text-slate-400">מעקב חכם אחרי כל התשלומים הקבועים שלך במקום אחד.</p>
          </div>
          <button 
            className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden"
        >
           <div className="absolute -top-24 -end-24 w-48 h-48 bg-violet-500/30 rounded-full blur-3xl" />
           <div className="relative z-10 flex justify-between items-center">
             <div className="space-y-1">
               <div className="flex items-center gap-2 text-indigo-200 text-sm font-semibold mb-2">
                 <Repeat size={16} />
                 <span>סה״כ עלות קבועה בחודש</span>
               </div>
               <div className="text-5xl font-extrabold tracking-tight">
                 ₪{totalMonthly.toFixed(0)}
               </div>
             </div>
             <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hidden sm:block">
               <CreditCard size={32} className="text-indigo-300" />
             </div>
           </div>
        </motion.div>

        {/* Subscriptions List */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">המנויים שלך ({subscriptions.length})</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
               <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
          ) : subscriptions.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
            >
               <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                 <Repeat size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">אין לך עדיין מנויים פעילים</h3>
               <p className="text-slate-500 text-sm mt-1">לחץ על כפתור הפלוס למעלה כדי להוסיף מנוי חדש.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subscriptions.map((sub, idx) => {
                const daysUntil = getDaysUntil(sub.nextBillingDate);
                const isUrgent = daysUntil >= 0 && daysUntil <= 7;
                const isPast = daysUntil < 0;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={sub._id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                  >
                     <div className={`w-14 h-14 rounded-[1rem] flex items-center justify-center text-2xl font-black uppercase shadow-inner \${getIconColor(sub.name)}`}>
                        {sub.name.charAt(0)}
                     </div>

                     <div className="flex-1">
                       <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">{sub.name}</h3>
                       <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">{sub.category} • {sub.billingCycle === 'monthly' ? 'חודשי' : 'שנתי'}</p>
                     </div>

                     <div className="text-left flex flex-col items-end">
                       <div className="font-extrabold text-slate-900 dark:text-white text-lg">₪{sub.amount}</div>
                       <div className={`text-[10px] font-bold mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${isUrgent ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : isPast ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
                         <Calendar size={10} />
                         {isPast ? 'עבר' : `עוד ${daysUntil} ימים`}
                       </div>
                     </div>
                     <button
                       onClick={(e) => { e.stopPropagation(); deleteSubscription(sub._id); }}
                       className="absolute top-2 start-2 opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/20 rounded-xl transition-all"
                     >
                       <Trash2 size={16} />
                     </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-50 dark:bg-slate-950 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">הוספת מנוי חדש 🔁</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 pb-8">
                <form onSubmit={handleAddSubscription} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">השירות (לדוגמה Netflix)</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">עלות (₪)</label>
                      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">תדירות חיוב</label>
                      <select value={billingCycle} onChange={(e: any) => setBillingCycle(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium">
                        <option value="monthly">חודשי</option>
                        <option value="yearly">שנתי</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">מועד חיוב קרוב</label>
                    <input type="date" value={nextBillingDate} onChange={e => setNextBillingDate(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100 font-medium" />
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-all shadow-lg flex justify-center items-center">
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "שמור מנוי"}
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
