'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { PiggyBank, Plus, Target, Plane, Car, Laptop, ArrowLeft, Loader2, X, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface GoalData {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline?: string;
}

/** מיפוי אייקונים לפי שם */
const iconMap: Record<string, React.ReactNode> = {
  plane: <Plane size={24} className="text-pink-600 dark:text-pink-400" />,
  target: <Target size={24} className="text-emerald-600 dark:text-emerald-400" />,
  car: <Car size={24} className="text-blue-600 dark:text-blue-400" />,
  laptop: <Laptop size={24} className="text-amber-600 dark:text-amber-400" />,
  piggybank: <PiggyBank size={24} className="text-violet-600 dark:text-violet-400" />,
};

const colorOptions = [
  { label: "ורוד", value: "from-pink-500 to-rose-400", bg: "bg-pink-100 dark:bg-pink-500/20" },
  { label: "ירוק", value: "from-emerald-500 to-teal-400", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
  { label: "כחול", value: "from-blue-500 to-indigo-400", bg: "bg-blue-100 dark:bg-blue-500/20" },
  { label: "כתום", value: "from-amber-400 to-orange-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
  { label: "סגול", value: "from-violet-500 to-indigo-400", bg: "bg-violet-100 dark:bg-violet-500/20" },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // שדות טופס יעד חדש
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newCurrent, setNewCurrent] = useState("0");
  const [newIcon, setNewIcon] = useState("target");
  const [newColor, setNewColor] = useState("from-violet-500 to-indigo-400");
  const [newDeadline, setNewDeadline] = useState("");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (err) {
      console.error("שגיאה בטעינת יעדים:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    // Prepare the body according to creation or editing
    const body: any = {
      title: newTitle,
      targetAmount: Number(newTarget),
      currentAmount: Number(newCurrent),
      icon: newIcon,
      color: newColor,
    };
    
    // In creation, empty deadline shouldn't be overridden if not existing
    if (newDeadline) {
      body.deadline = newDeadline;
    } else if (editingGoalId) {
       // if we are editing and empty deadline was passed, we might need a way to clear it 
       // but for simplicity, let's either pass it or leave undefined.
       // The API supports replacing deadline if passed.
    }

    try {
      if (editingGoalId) {
        body.id = editingGoalId;
        const res = await fetch("/api/goals", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast.success("היעד עודכן בהצלחה!");
          closeForm();
          fetchGoals();
        } else {
          toast.error("שגיאה בעדכון יעד");
        }
      } else {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast.success("היעד נוצר בהצלחה!");
          closeForm();
          fetchGoals();
        } else {
          toast.error("שגיאה ביצירת יעד");
        }
      }
    } catch (err) {
      toast.error("שגיאת רשת בשמירת יעד");
      console.error("שגיאה בשמירת יעד:", err);
    } finally {
      setFormLoading(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGoalId(null);
    setNewTitle("");
    setNewTarget("");
    setNewCurrent("0");
    setNewDeadline("");
    setNewIcon("target");
    setNewColor("from-violet-500 to-indigo-400");
  };

  const startEditing = (goal: GoalData) => {
    setEditingGoalId(goal._id);
    setNewTitle(goal.title);
    setNewTarget(goal.targetAmount.toString());
    setNewCurrent(goal.currentAmount.toString());
    setNewIcon(goal.icon);
    setNewColor(goal.color);
    setNewDeadline(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeposit = async (goalId: string, currentAmount: number) => {
    const input = prompt("כמה ברצונך להפקיד? (₪)");
    if (!input) return;
    const depositAmount = Number(input);
    if (isNaN(depositAmount) || depositAmount <= 0) return;

    try {
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goalId, currentAmount: currentAmount + depositAmount }),
      });
      if (res.ok) {
        toast.success("ההפקדה בוצעה בהצלחה!");
        fetchGoals();
      } else {
        toast.error("שגיאה בהפקדה");
      }
    } catch (err) {
      toast.error("שגיאה בהפקדה");
      console.error("שגיאה בהפקדה:", err);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("בטוח שברצונך למחוק את היעד?")) return;
    try {
      const res = await fetch(`/api/goals?id=${goalId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("היעד נמחק");
        setGoals(prev => prev.filter(g => g._id !== goalId));
      } else {
        toast.error("שגיאה במחיקה");
      }
    } catch (err) {
      toast.error("שגיאה במחיקה");
      console.error("שגיאה במחיקה:", err);
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalCompleted = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto space-y-8 px-6 py-8 pb-12">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-2xl text-pink-600 dark:text-pink-400">
                <PiggyBank size={32} />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                יעדי חיסכון ✨
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium md:ms-16">
              תכנון פיננסי חכם למטרות שלך. הזרם כספים ליעדים וממש את החלומות שלך!
            </p>
          </div>

          <button
            onClick={() => { closeForm(); setShowForm(true); }}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl font-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
          >
            <Plus size={20} />
            <span>יעד חיסכון חדש</span>
          </button>
        </header>

        {/* טופס יצירת יעד חדש */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-lg border-2 border-violet-200 dark:border-violet-900/50"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingGoalId ? 'עריכת יעד חיסכון' : 'יצירת יעד חיסכון חדש'}
              </h2>
              <button onClick={closeForm} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmitGoal} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">שם היעד</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required placeholder="לדוגמה: חופשה בחו״ל" className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-violet-500 transition-all font-medium text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">סכום יעד (₪)</label>
                <input type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} required min="1" placeholder="15000" className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-violet-500 transition-all font-medium text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">סכום התחלתי (₪)</label>
                <input type="number" value={newCurrent} onChange={(e) => setNewCurrent(e.target.value)} min="0" placeholder="0" className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-violet-500 transition-all font-medium text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">תאריך יעד (אופציונלי)</label>
                <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-violet-500 transition-all font-medium text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">אייקון</label>
                <div className="flex gap-2">
                  {Object.keys(iconMap).map((key) => (
                    <button key={key} type="button" onClick={() => setNewIcon(key)} className={`p-3 rounded-xl border-2 transition-all ${newIcon === key ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
                      {iconMap[key]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 pt-4">
                <button type="submit" disabled={formLoading || !newTitle || !newTarget} className="px-8 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-lg">
                  {formLoading ? 'שומר יעד...' : (editingGoalId ? '💾 שמור שינויים' : '✨ צור יעד חיסכון')}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* באנר סטטיסטיקה */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden flex flex-col sm:flex-row gap-6 justify-between items-center">
          <div className="absolute -top-24 -end-24 w-64 h-64 bg-white/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
          <div className="relative z-10 space-y-2">
            <h2 className="text-xl font-bold text-white/90">סה&quot;כ נחסך בכל היעדים:</h2>
            <div className="text-4xl sm:text-5xl font-black">₪{totalSaved.toLocaleString()}</div>
            <p className="text-indigo-200 font-medium">
              {totalCompleted > 0 ? `🎉 כל הכבוד! השלמת ${totalCompleted} יעדים!` : 'המשך כך! אתה קרוב להשיג את המטרות שלך.'}
            </p>
          </div>
          <div className="relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-center flex-shrink-0 min-w-40">
            <div className="text-sm text-indigo-100 mb-1">הושלמו בהצלחה</div>
            <div className="text-3xl font-bold flex items-center justify-center gap-2">
              <Target size={24} className="text-amber-300" />
              <span>{totalCompleted} / {goals.length}</span>
            </div>
          </div>
        </div>

        {/* טעינה */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-violet-500" size={40} />
          </div>
        )}

        {/* רשימת יעדים */}
        {!loading && goals.length === 0 && (
          <div className="p-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="text-5xl">🎯</div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">עדיין לא יצרת יעדי חיסכון</p>
            <p className="text-slate-400 dark:text-slate-500 font-medium">לחץ על &quot;יעד חיסכון חדש&quot; כדי להתחיל לחסוך!</p>
          </div>
        )}

        {!loading && goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {goals.map((goal, idx) => {
              const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const goalColor = colorOptions.find(c => c.value === goal.color);
              const bgColor = goalColor?.bg || "bg-violet-100 dark:bg-violet-500/20";

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  key={goal._id}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div className={`absolute top-0 end-0 w-32 h-32 ${bgColor} rounded-bl-full opacity-0 group-hover:opacity-50 transition-opacity blur-2xl`}></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center shrink-0`}>
                        {iconMap[goal.icon] || <Target size={24} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {goal.title}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">
                          {goal.deadline ? `יעד: ${new Date(goal.deadline).toLocaleDateString("he-IL", { month: "long", year: "numeric" })}` : "ללא תאריך יעד"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditing(goal)} className="p-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all" title="ערוך יעד">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(goal._id)} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all" title="מחק יעד">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-end">
                      <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                        ₪{goal.currentAmount.toLocaleString()}
                      </div>
                      <div className="text-slate-400 font-bold text-sm bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg">
                        יעד: ₪{goal.targetAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-4 border border-slate-200/50 dark:border-slate-700/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.3 + (idx * 0.1), ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${goal.color} rounded-full`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold text-slate-500 pt-2">
                      <span className={`px-2 py-0.5 rounded-md ${percentage >= 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}`}>
                        {Math.round(percentage)}% הושלם
                      </span>
                      <button
                        onClick={() => handleDeposit(goal._id, goal.currentAmount)}
                        className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        הפקד כספים <ArrowLeft size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
