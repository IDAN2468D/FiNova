'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('נא למלא אימייל וסיסמה.');
      setLoading(false);
      return;
    }

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('פרטי ההתחברות עשויים להיות שגויים. נסה שוב.');
        setLoading(false);
      } else if (res?.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('אירעה פנימית שגיאה. בדוק חיבור לשרת או פנה לתמיכה.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-900 dark:text-gray-100 bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* צד טופס ההתחברות (מימין במסכים גדולים ב-RTL) */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10">
        
        {/* עיגול דקורטיבי רקע (Mobile mostly) */}
        <div className="absolute top-0 right-0 -m-16 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -z-10 lg:hidden" />
        <div className="absolute bottom-0 left-0 -m-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10 lg:hidden" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md space-y-10"
        >
          {/* כותרת */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              ברוך שובך! 👋
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
              שמחים לראות אותך. התחבר לחשבון כדי להמשיך לנהל את הכסף בחכמה 💸
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="p-4 bg-red-50/80 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-2xl text-sm font-semibold border border-red-100 dark:border-red-900/50 backdrop-blur-sm shadow-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="relative group">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full px-5 py-4 pt-7 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-violet-500 focus:ring-0 transition-all font-medium text-slate-900 dark:text-white outline-none"
                  placeholder=" "
                  dir="ltr"
                />
                <label 
                  htmlFor="email"
                  className="absolute start-5 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-violet-500 peer-focus:font-bold pointer-events-none top-2"
                >
                  כתובת אימייל
                </label>
              </div>

              <div className="relative group">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full px-5 py-4 pt-7 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-violet-500 focus:ring-0 transition-all font-medium text-slate-900 dark:text-white outline-none"
                  placeholder=" "
                  dir="ltr"
                />
                <label 
                  htmlFor="password"
                  className="absolute start-5 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-violet-500 peer-focus:font-bold pointer-events-none top-2"
                >
                  סיסמה
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="w-5 h-5 rounded-[0.4rem] border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer transition-colors" />
                <label htmlFor="remember" className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">זכור אותי במחשב זה</label>
              </div>
              <a href="#" className="text-sm font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors">שכחת סיסמה?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed text-lg flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                   <svg className="animate-spin -ms-1 me-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    מאמת נתונים...
                </>
              ) : 'כניסה למערכת'}
            </button>
          </form>

          <p className="text-center text-slate-500 dark:text-slate-400 font-medium">
            משתמש חדש?{' '}
            <Link href="/register" className="font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors underline decoration-2 underline-offset-4">
              צור חשבון בחינם
            </Link>
          </p>
        </motion.div>
      </div>

      {/* צד אומנותי / פוסטר (משמאל ב-RTL) */}
      <div className="hidden lg:flex lg:w-[45%] p-4">
        <div className="w-full h-full relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-700 to-slate-900 flex flex-col justify-between p-16 shadow-2xl group">
          
          {/* אלמנטים גרפיים צפים ברקע */}
          <div className="absolute top-0 end-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-1000 ease-in-out"></div>
          <div className="absolute bottom-0 start-0 w-[30rem] h-[30rem] bg-indigo-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 group-hover:scale-110 transition-transform duration-1000 ease-out"></div>
          
          <div className="relative z-10 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
             {/* Logo Icon Mockup */}
             <div className="w-8 h-8 bg-white rounded-lg rotate-12 transition-transform duration-500 group-hover:rotate-45"></div>
             <div className="absolute w-8 h-8 bg-violet-300 rounded-lg -rotate-12 mix-blend-multiply transition-transform duration-500 group-hover:-rotate-45"></div>
          </div>

          <div className="relative z-10 space-y-6 max-w-lg mb-12">
            <h2 className="text-5xl lg:text-6xl font-black text-white leading-[1.15]">
              השתלט על התקציב שלך
              <span className="text-violet-300 block mt-2">בקלות וביעילות.</span>
            </h2>
            <p className="text-indigo-100/80 text-lg font-medium leading-relaxed">
              מערכת חכמה לניהול תקציב חודשי, פילוח יעדים אסטרטגיים ומעקב פעילויות. 
              הצטרף לעשרות המשתמשים שכבר לקחו שליטה על התזרים הפיננסי שלהם.
            </p>
          </div>

          {/* User Review Mockup */}
          <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl max-w-sm transform group-hover:-translate-y-2 transition-transform duration-500">
            <div className="flex gap-1 mb-4 text-amber-400">
              {/* 5 Stars */}
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              ))}
            </div>
            <p className="text-white/90 font-medium italic mb-4 leading-relaxed">"הממשק פשוט וואו. קל מאוד להבין לאן הכסף הולך, העיצוב עושה חשק להתמיד בשמירה על התקציב."</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-amber-200 to-amber-500 rounded-full border-2 border-white/50"></div>
              <div>
                <p className="text-white font-bold text-sm">דניאל</p>
                <p className="text-indigo-200/80 text-xs">מנכ"ל ומתכנת ראשי</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
