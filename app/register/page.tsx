'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!name || !email || !password) {
      setError('נא למלא את כל השדות.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        setSuccess('ההרשמה בוצעה בהצלחה! מכין את המערכת להעברה...');
        setName('');
        setEmail('');
        setPassword('');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'שגיאה כלשהי בהרשמה.');
      }
    } catch (err) {
      setError('אירעה שגיאה בחיבור לשרת.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-900 dark:text-gray-100 bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* צד אומנותי / פוסטר (מימין במסכים גדולים ב-RTL) - הפוך מדף ההתחברות כדי לייצר תחושת זרימה */}
      <div className="hidden lg:flex lg:w-[45%] p-4">
        <div className="w-full h-full relative rounded-[2.5rem] overflow-hidden bg-gradient-to-tr from-emerald-600 via-teal-700 to-slate-900 flex flex-col items-center justify-center p-16 shadow-2xl group text-center">
          
          <div className="absolute top-1/4 start-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-x-1/2 group-hover:scale-110 transition-transform duration-1000 ease-in-out"></div>
          
          <div className="relative z-10 w-24 h-24 mb-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-xl">
             <div className="w-12 h-12 bg-white rounded-xl rotate-12 transition-transform duration-500 group-hover:rotate-180"></div>
          </div>

          <div className="relative z-10 space-y-6 max-w-sm">
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.2]">
              בוא בנה את העתיד הפיננסי שלך 📈
            </h2>
            <p className="text-teal-100/90 text-lg font-medium leading-relaxed">
              הצטרף עכשיו בחינם למערכת המתקדמת ביותר לניהול תקציב, קביעת יעדי חיסכון בממשק מרהיב, ופונקציונליות חזקה.
            </p>
          </div>
        </div>
      </div>

      {/* צד טופס ההרשמה */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10">
        
        <div className="absolute inset-0 bg-violet-500/5 rounded-full blur-3xl -z-10 lg:hidden" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-10"
        >
          {/* כותרת */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              צור חשבון חדש 🚀
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
              הכנס את הפרטים שלך למטה כדי להתחיל
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50/80 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-2xl text-sm font-semibold border border-red-100 dark:border-red-900/50 backdrop-blur-sm shadow-sm">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-emerald-50/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-2xl text-sm font-semibold border border-emerald-100 dark:border-emerald-900/50 backdrop-blur-sm shadow-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="peer w-full px-5 py-4 pt-7 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-emerald-500 focus:ring-0 transition-all font-medium text-slate-900 dark:text-white outline-none"
                  placeholder=" "
                />
                <label 
                  htmlFor="name"
                  className="absolute start-5 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-emerald-500 peer-focus:font-bold pointer-events-none top-2"
                >
                  שם מלא
                </label>
              </div>

              <div className="relative group">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full px-5 py-4 pt-7 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-emerald-500 focus:ring-0 transition-all font-medium text-slate-900 dark:text-white outline-none"
                  placeholder=" "
                  dir="ltr"
                />
                <label 
                  htmlFor="email"
                  className="absolute start-5 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-emerald-500 peer-focus:font-bold pointer-events-none top-2"
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
                  className="peer w-full px-5 py-4 pt-7 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-emerald-500 focus:ring-0 transition-all font-medium text-slate-900 dark:text-white outline-none"
                  placeholder=" "
                  dir="ltr"
                />
                <label 
                  htmlFor="password"
                  className="absolute start-5 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-emerald-500 peer-focus:font-bold pointer-events-none top-2"
                >
                  סיסמתך הסודית
                </label>
              </div>
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
                    נרשם...
                </>
              ) : 'הרשמה מהירה'}
            </button>
          </form>

          <p className="text-center text-slate-500 dark:text-slate-400 font-medium">
            כבר יש לך חשבון קיים?{' '}
            <Link href="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors underline decoration-2 underline-offset-4">
              התחבר כאן
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
