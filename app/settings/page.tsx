"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { User, Bell, Shield, Palette, Lock, Eye, EyeOff, Trash2, BellRing, BellOff, Mail, Smartphone, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Camera, Loader2 } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import Navbar from "@/components/Navbar";

/**
 * ToggleSwitch - קומפוננטת מתג הפעלה/כיבוי מעוצבת
 */
interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

const ToggleSwitch = ({ enabled, onToggle, label, description, icon }: ToggleSwitchProps) => (
  <div className="flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all group">
    <div className="flex items-center gap-4">
      {icon && (
        <div className={`p-2.5 rounded-xl transition-colors ${enabled ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
          {icon}
        </div>
      )}
      <div>
        <span className="font-bold text-slate-800 dark:text-white block">{label}</span>
        {description && <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{description}</span>}
      </div>
    </div>
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${enabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out mt-[1px] ${enabled ? '-translate-x-5' : 'translate-x-[1px]'}`}
        style={{ width: '22px', height: '22px' }}
      />
    </button>
  </div>
);

export default function SettingsPage() {
  const { data: session, update } = useSession();

  // State for profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // State for theme
  const [theme, setTheme] = useState("light");

  // State for notifications
  const [notifExpenseAlert, setNotifExpenseAlert] = useState(true);
  const [notifIncomeAlert, setNotifIncomeAlert] = useState(true);
  const [notifGoalReached, setNotifGoalReached] = useState(true);
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // State for security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
    if (session?.user?.email) setEmail(session.user.email);
    if (session?.user?.image) setImage(session.user.image);

    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");

      // טעינת העדפות התראות מ-localStorage
      const savedNotifs = localStorage.getItem("notifPrefs");
      if (savedNotifs) {
        const prefs = JSON.parse(savedNotifs);
        setNotifExpenseAlert(prefs.expenseAlert ?? true);
        setNotifIncomeAlert(prefs.incomeAlert ?? true);
        setNotifGoalReached(prefs.goalReached ?? true);
        setNotifWeeklyReport(prefs.weeklyReport ?? false);
        setNotifEmail(prefs.email ?? true);
        setNotifPush(prefs.push ?? false);
      }
    }
  }, [session]);

  // --- Profile handlers ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("התמונה ענקית. אנא בחר תמונה עד 5MB.");
      return;
    }

    setIsUploadingImage(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 300; // Resize to max 300x300 avatar 
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = Math.floor(width);
          canvas.height = Math.floor(height);
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Get high-quality compressed JPEG (significantly smaller base64!)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.9);

          const res = await fetch("/api/user/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: compressedBase64 })
          });
          
          if (res.ok) {
            setImage(compressedBase64); // Fast local render
            const avatarUrl = `/api/user/avatar?t=${Date.now()}`;
            await update({ image: avatarUrl }); // Update NextAuth session properly
            setSuccess("תמונת הפרופיל עודכנה בהצלחה! 📸");
          } else {
            setError("שגיאת גודל. התמונה לא נשמרה בשרת.");
          }
          setIsUploadingImage(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setError("שגיאה בקריאת הקובץ.");
        setIsUploadingImage(false);
      }
      reader.readAsDataURL(file);
    } catch {
      setError("שגיאת רשת. נסו שוב.");
      setIsUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "שגיאה בעדכון הפרופיל.");
      } else {
        setSuccess("ההגדרות עודכנו בהצלחה במערכת!");
        await update({ name: data.user.name, email: data.user.email });
      }
    } catch {
      setError("שגיאה קריטית בעת השמירה.");
    } finally {
      setLoading(false);
    }
  };

  // --- Theme handlers ---
  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // --- Notifications handler ---
  const handleSaveNotifications = () => {
    const prefs = {
      expenseAlert: notifExpenseAlert,
      incomeAlert: notifIncomeAlert,
      goalReached: notifGoalReached,
      weeklyReport: notifWeeklyReport,
      email: notifEmail,
      push: notifPush,
    };
    localStorage.setItem("notifPrefs", JSON.stringify(prefs));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  // --- Security handlers ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError("");
    setSecuritySuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityError("נא למלא את כל שדות הסיסמה.");
      return;
    }
    if (newPassword.length < 6) {
      setSecurityError("הסיסמה החדשה חייבת להכיל לפחות 6 תווים.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError("הסיסמאות החדשות אינן זהות. נסה שוב.");
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSecurityError(data.message || "שגיאה בעדכון הסיסמה.");
      } else {
        setSecuritySuccess("הסיסמה שונתה בהצלחה! 🔒");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setSecurityError("שגיאת שרת. נסה שוב מאוחר יותר.");
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/login" });
      }
    } catch {
      setSecurityError("לא הצלחנו למחוק את החשבון. נסה שוב.");
    }
  };

  const userInitial = name ? name.charAt(0).toUpperCase() : "ד";

  const sidebarItems = [
    { id: "profile", label: "הפרופיל שלי", icon: <User size={22} /> },
    { id: "appearance", label: "מראה ועיצוב", icon: <Palette size={22} /> },
    { id: "notifications", label: "התראות", icon: <Bell size={22} /> },
    { id: "security", label: "פרטיות ואבטחה", icon: <Shield size={22} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 md:py-12 space-y-10 pb-12">
        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">הגדרות חשבון ⚙️</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium pb-4">
            אתה שולט בהכל מפה. ערוך מידע, שנה מראה מערכת ונהל אבטחה.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">

          {/* תפריט צד אינטראקטיבי */}
          <aside className="md:col-span-1 space-y-2">
            <nav className="flex flex-col gap-2 relative">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all shadow-sm ${activeTab === item.id ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                >
                  {item.icon} {item.label}
                </button>
              ))}

              <div className="my-6 border-t-2 border-slate-200 dark:border-slate-800 w-full"></div>

              <LogoutButton />
            </nav>
          </aside>

          {/* אזור תוכן מרכזי תלוי טאב */}
          <section className="md:col-span-3 space-y-8">

            {/* ===== טאב: הפרופיל שלי ===== */}
            {activeTab === "profile" && (
              <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-sm border-2 border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-800 dark:text-white">
                  <User className="text-violet-500 p-1 bg-violet-100 dark:bg-violet-900/30 rounded-lg" size={32} />
                  עדכון פרטים אישיים
                </h2>

                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-2xl text-sm font-semibold border border-red-100 dark:border-red-900/50">{error}</div>}
                {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-2xl text-sm font-semibold border border-emerald-100 dark:border-emerald-900/50">{success}</div>}

                <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white text-4xl font-black shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform overflow-hidden">
                      {isUploadingImage ? (
                        <Loader2 className="animate-spin text-white" size={32} />
                      ) : image ? (
                        <img src={image} alt={name} className="w-full h-full object-cover transform -rotate-3 group-hover:rotate-0 transition-transform" />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rotate-3 group-hover:rotate-0">
                      <Camera className="text-white mb-1" size={24} />
                      <span className="text-white text-[10px] font-bold">החלף תמונה</span>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  </div>
                  <div className="space-y-1 text-center sm:text-right">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{name || 'טוען...'}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{session?.user?.email || 'טוען...'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label htmlFor="settingsName" className="text-sm font-bold text-slate-700 dark:text-slate-300">שם תצוגה מקורי בחשבון</label>
                      <input
                        id="settingsName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-violet-500 focus:ring-0 transition-all outline-none font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="settingsEmail" className="text-sm font-bold text-slate-700 dark:text-slate-300">כתובת אימייל מקושרת</label>
                      <input
                        id="settingsEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-violet-500 focus:ring-0 transition-all outline-none font-medium text-slate-900 dark:text-white"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">* ניתן לשנות את השם והאימייל בכל זמן. לאחר העדכון יש לרענן את המסך כדי לראות את השינוי בפרופיל.</p>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="submit"
                      disabled={loading || !name}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed text-lg"
                    >
                      {loading ? 'מבצע גיבוי ושמירה...' : 'שמור שינויים במערכת'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ===== טאב: מראה ועיצוב ===== */}
            {activeTab === "appearance" && (
              <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-sm border-2 border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-800 dark:text-white">
                  <Palette className="text-emerald-500 p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg" size={32} />
                  עיצוב מראה המערכת
                </h2>

                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                  בחר את סגנון התצוגה המועדף עליך שישלוט על כל העמודים בפלטפורמה. אנחנו שומרים את ההעדפה שלך בדפדפן!
                </p>

                <div className="flex flex-col sm:flex-row gap-6">
                  <button
                    onClick={() => handleThemeChange("light")}
                    className={`flex-1 py-6 flex flex-col items-center gap-4 border-[3px] rounded-[1.5rem] font-black transition-all shadow-sm
                      ${theme === 'light' ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                  >
                    <span className="text-4xl filter drop-shadow-sm">☀️</span>
                    <span className="text-lg tracking-tight">תצוגת יום מאירה</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={`flex-1 py-6 flex flex-col items-center gap-4 border-[3px] rounded-[1.5rem] font-black transition-all shadow-sm
                      ${theme === 'dark' ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                  >
                    <span className="text-4xl filter drop-shadow-sm">🌙</span>
                    <span className="text-lg tracking-tight">מצב לילה אלגנטי</span>
                  </button>
                </div>
              </div>
            )}

            {/* ===== טאב: התראות ===== */}
            {activeTab === "notifications" && (
              <div className="space-y-8">
                {/* כרטיס התראות פיננסיות */}
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-sm border-2 border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                  <h2 className="text-2xl font-bold mb-3 flex items-center gap-3 text-slate-800 dark:text-white">
                    <BellRing className="text-amber-500 p-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg" size={32} />
                    התראות פיננסיות
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                    בחר איזה סוגי עדכונים תרצה לקבל כשמתרחשות פעולות בחשבון שלך.
                  </p>

                  <div className="space-y-4">
                    <ToggleSwitch
                      enabled={notifExpenseAlert}
                      onToggle={() => setNotifExpenseAlert(!notifExpenseAlert)}
                      label="התראת הוצאה חריגה"
                      description="קבל עדכון כשהוצאה חד-פעמית חורגת מהממוצע החודשי שלך"
                      icon={<TrendingDown size={20} />}
                    />
                    <ToggleSwitch
                      enabled={notifIncomeAlert}
                      onToggle={() => setNotifIncomeAlert(!notifIncomeAlert)}
                      label="התראה על הכנסה חדשה"
                      description="קבל עדכון בכל פעם שנוספת הכנסה לחשבון"
                      icon={<TrendingUp size={20} />}
                    />
                    <ToggleSwitch
                      enabled={notifGoalReached}
                      onToggle={() => setNotifGoalReached(!notifGoalReached)}
                      label="הגעה ליעד חיסכון"
                      description="עדכון מיוחד כשמגיעים ל-100% ביעד חיסכון 🎉"
                      icon={<CheckCircle2 size={20} />}
                    />
                    <ToggleSwitch
                      enabled={notifWeeklyReport}
                      onToggle={() => setNotifWeeklyReport(!notifWeeklyReport)}
                      label="דיווח שבועי מסכם"
                      description="סקירה שבועית על כלל ההוצאות וההכנסות שלך"
                      icon={<Bell size={20} />}
                    />
                  </div>
                </div>

                {/* כרטיס ערוצי מסירה */}
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-sm border-2 border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                  <h2 className="text-2xl font-bold mb-3 flex items-center gap-3 text-slate-800 dark:text-white">
                    <Mail className="text-blue-500 p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg" size={32} />
                    ערוצי מסירת ההתראות
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                    באיזה דרכים לשלוח לך את העדכונים שהפעלת למעלה?
                  </p>

                  <div className="space-y-4">
                    <ToggleSwitch
                      enabled={notifEmail}
                      onToggle={() => setNotifEmail(!notifEmail)}
                      label="אימייל"
                      description={`ישלח לכתובת ${session?.user?.email || 'המקושרת'}`}
                      icon={<Mail size={20} />}
                    />
                    <ToggleSwitch
                      enabled={notifPush}
                      onToggle={() => setNotifPush(!notifPush)}
                      label="התראות מערכת (Push)"
                      description="התראות ישירות בדפדפן אפילו כשהלשונית סגורה"
                      icon={<Smartphone size={20} />}
                    />
                  </div>

                  <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleSaveNotifications}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-lg"
                    >
                      {notifSaved ? '✅ נשמר בהצלחה!' : 'שמור העדפות התראות'}
                    </button>
                    {notifSaved && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">ההעדפות נשמרו בדפדפן שלך.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== טאב: פרטיות ואבטחה ===== */}
            {activeTab === "security" && (
              <div className="space-y-8">
                {/* כרטיס שינוי סיסמה הפרימיום */}
                <form onSubmit={handleChangePassword} className="glass-card relative overflow-hidden p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-all hover:shadow-2xl group">
                  {/* אפקטי תאורה (Glows) */}
                  <div className="absolute top-0 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none mix-blend-screen opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute bottom-0 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none mix-blend-screen opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

                  <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-3 flex items-center gap-3 text-slate-900 dark:text-white tracking-tight">
                      <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl shadow-lg shadow-indigo-500/30">
                        <Lock className="text-white" size={28} />
                      </div>
                      ניהול ואבטחת סיסמה
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 text-lg">
                      החלף סיסמה בתדירות קבועה כדי לשמור על רמת אבטחה מקסימלית (6 תווים לפחות).
                    </p>

                    {securityError && (
                      <div className="mb-8 p-4 bg-rose-50/80 dark:bg-rose-900/20 backdrop-blur-md text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-bold border border-rose-200 dark:border-rose-800/50 flex items-center gap-2 shadow-sm">
                        <AlertTriangle size={18} /> {securityError}
                      </div>
                    )}
                    {securitySuccess && (
                      <div className="mb-8 p-4 bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur-md text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm font-bold border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 shadow-sm">
                        <CheckCircle2 size={18} /> {securitySuccess}
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label htmlFor="currentPassword" className="text-sm font-bold text-slate-700 dark:text-slate-300">סיסמה נוכחית אישית</label>
                        <div className="relative group/input">
                          <input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="הקלד/י את הסיסמה הישנה..."
                            className="w-full px-5 py-4 pl-14 rounded-2xl border-2 border-slate-200/60 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner group-hover/input:border-slate-300 dark:group-hover/input:border-slate-600"
                            dir="rtl"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {showCurrentPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label htmlFor="newPassword" className="text-sm font-bold text-slate-700 dark:text-slate-300">סיסמה חדשה וחזקה</label>
                          <div className="relative group/input">
                            <input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="לפחות 6 תווים"
                              className="w-full px-5 py-4 pl-14 rounded-2xl border-2 border-slate-200/60 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner group-hover/input:border-slate-300 dark:group-hover/input:border-slate-600"
                              dir="rtl"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {showNewPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700 dark:text-slate-300">אימות חוזר לסיסמה</label>
                          <div className="relative group/input">
                            <input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="הקלד שוב לאימות"
                              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200/60 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner group-hover/input:border-slate-300 dark:group-hover/input:border-slate-600"
                              dir="rtl"
                            />
                          </div>
                        </div>
                      </div>

                      {/* מד חוזק סיסמה אינטראקטיבי */}
                      {newPassword && (
                        <div className="space-y-2 mt-4 bg-white/30 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                          <div className="flex justify-between text-sm font-bold items-center">
                            <span className="text-slate-600 dark:text-slate-400">הערכת מורכבות ההצפנה:</span>
                            <span className={`px-3 py-1 rounded-xl text-xs font-black shadow-sm ${newPassword.length >= 10 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200' : newPassword.length >= 6 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border border-rose-200'}`}>
                              {newPassword.length >= 10 ? 'מצוינת 💪' : newPassword.length >= 6 ? 'סבירה ⚡' : 'חלשה ⚠️'}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200/50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${newPassword.length >= 10 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 w-full' : newPassword.length >= 6 ? 'bg-gradient-to-r from-amber-400 to-amber-500 w-2/3' : 'bg-gradient-to-r from-rose-400 to-rose-500 w-1/3'}`}
                            />
                          </div>
                        </div>
                      )}

                      <div className="pt-8 mt-4">
                        <button
                          type="submit"
                          disabled={securityLoading}
                          className="w-full sm:w-auto inline-flex justify-center items-center gap-3 px-10 py-4 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed text-lg"
                        >
                          {securityLoading ? (
                            <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <Lock size={22} className="opacity-90" />
                          )}
                          {securityLoading ? 'מפעיל פרוטוקול הצפנה...' : 'בצע שינוי סיסמה עכשיו'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* כרטיס מידע אבטחה */}
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-sm border-2 border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-800 dark:text-white">
                    <Shield className="text-teal-500 p-1 bg-teal-100 dark:bg-teal-900/30 rounded-lg" size={32} />
                    אבטחת חשבון
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">סיסמה מוצפנת</span>
                      </div>
                      <p className="text-sm text-emerald-600/80 dark:text-emerald-400/70 font-medium">הסיסמה שלך מוצפנת ב-bcrypt ולא ניתנת לחילוץ.</p>
                    </div>
                    <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="text-blue-600 dark:text-blue-400" size={20} />
                        <span className="font-bold text-blue-700 dark:text-blue-400">JWT Session</span>
                      </div>
                      <p className="text-sm text-blue-600/80 dark:text-blue-400/70 font-medium">המפתח מוגן וחתום דיגיטלית בכל בקשה.</p>
                    </div>
                  </div>
                </div>

                {/* כרטיס אזור מסוכן */}
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-sm border-2 border-red-100 dark:border-red-900/30 transition-all">
                  <h2 className="text-2xl font-bold mb-3 flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertTriangle className="p-1 bg-red-100 dark:bg-red-900/30 rounded-lg" size={32} />
                    אזור מסוכן
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
                    פעולות אלו הן בלתי הפיכות. אנא קרא בעיון לפני ביצוע.
                  </p>

                  {!deleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(true)}
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/30 font-black rounded-2xl transition-all"
                    >
                      <Trash2 size={18} /> מחק חשבון לצמיתות
                    </button>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border-2 border-red-200 dark:border-red-800 space-y-4">
                      <p className="font-bold text-red-700 dark:text-red-400 text-lg">⚠️ בטוח שברצונך למחוק את החשבון?</p>
                      <p className="text-sm text-red-600/80 dark:text-red-400/70 font-medium">כל הנתונים שלך (הוצאות, הכנסות, יעדים) יימחקו לצמיתות ולא ניתן יהיה לשחזר אותם.</p>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all shadow-lg"
                        >
                          כן, מחק הכל
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(false)}
                          className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}
