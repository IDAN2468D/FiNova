"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Wallet, PlusCircle, LayoutDashboard, Target, Activity, Settings, Bot, Repeat, Menu, X, Building } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || "משתמש אנונימי";
  const userInitial = userName.charAt(0).toUpperCase();
  const userImage = session?.user?.image;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu automatically when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    {
      name: "ראשי",
      href: "/",
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: "שווי נקי",
      href: "/net-worth",
      icon: <Building size={20} />,
    },
    {
      name: "פעילות",
      href: "/transactions",
      icon: <Activity size={20} />,
    },
    {
      name: "יעדים",
      href: "/goals",
      icon: <Target size={20} />,
    },
    {
      name: "מנויים",
      href: "/subscriptions",
      icon: <Repeat size={20} />,
    },
    {
      name: "יועץ חכם",
      href: "/ai",
      icon: <Bot size={20} className="text-violet-500" />,
    },
    {
      name: "ראשי מובייל", 
      href: "/",
      icon: <LayoutDashboard size={22} />,
      mobileOnly: true,
    },
    {
      name: "יעדים מובייל",
      href: "/goals",
      icon: <Target size={22} />,
      mobileOnly: true,
    },
    {
      name: "יועץ מובייל",
      href: "/ai",
      icon: <Bot size={22} className="text-violet-500" />,
      mobileOnly: true,
    },
  ];

  return (
    <>
      {/* Desktop Navbar (Floating Pill) */}
      <nav className="hidden md:flex justify-center sticky top-6 z-50 px-4 mb-8">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-full px-4 py-2 flex items-center gap-8"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 pe-4 border-e border-slate-200 dark:border-slate-700/50">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-full shadow-md shadow-indigo-500/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold bg-gradient-to-l from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              FiNova.
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navLinks.filter(l => !l.mobileOnly).map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 rounded-full transition-all duration-300 group"
                >
                  <div className="flex items-center gap-2 relative z-10">
                    <span className={`${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"}`}>
                      {link.icon}
                    </span>
                    <span className={`font-semibold text-sm ${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                      {link.name}
                    </span>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/20 rounded-full -z-0"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Profile */}
          <div className="ps-4 border-s border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <Link
                href="/add"
                className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full text-sm font-bold transition-all shadow-md"
              >
                <PlusCircle size={18} />
                <span>פעולה חדשה</span>
              </Link>
              <Link href="/settings">
                <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-white font-bold shadow-md shadow-rose-500/20 border-2 border-white dark:border-slate-800 cursor-pointer hover:scale-110 hover:-rotate-3 transition-transform overflow-hidden">
                  {userImage ? (
                    <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ms-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none"
          >
            <Menu size={24} />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 rounded-xl">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              FiNova
            </span>
          </Link>
        </div>
        <Link href="/settings">
          <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-white font-bold shadow-sm hover:scale-105 transition-transform overflow-hidden">
            {userImage ? (
              <img src={userImage} alt={userName} className="w-full h-full object-cover" />
            ) : (
              userInitial
            )}
          </div>
        </Link>
      </div>

      {/* Mobile Hamburger Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }} // Slide in from right (RTL natively targets the start edge logically in framer if you flip, but usually right is 100%)
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="md:hidden fixed top-0 bottom-0 right-0 z-[70] w-[80%] max-w-sm bg-white dark:bg-slate-950 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                   <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl">
                     <Wallet className="w-6 h-6 text-white" />
                   </div>
                   <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                     FiNova
                   </span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors focus:outline-none"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                <Link
                  href="/add"
                  className="flex items-center justify-center gap-2 w-full p-4 mb-6 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 font-bold active:scale-95 transition-transform"
                >
                  <PlusCircle size={20} />
                  <span>פעולה חדשה</span>
                </Link>

                <div className="space-y-1">
                  {[
                    { name: "ראשי", href: "/", icon: <LayoutDashboard size={20} /> },
                    { name: "שווי נקי (Net Worth)", href: "/net-worth", icon: <Building size={20} /> },
                    { name: "רישום פעולות", href: "/transactions", icon: <Activity size={20} /> },
                    { name: "מעקב יעדים", href: "/goals", icon: <Target size={20} /> },
                    { name: "מנויים שלי", href: "/subscriptions", icon: <Repeat size={20} /> },
                    { name: "היועץ החכם", href: "/ai", icon: <Bot size={20} className="text-violet-500" /> },
                    { name: "הגדרות חשבון", href: "/settings", icon: <Settings size={20} /> },
                  ].map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                          isActive 
                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border border-indigo-100 dark:border-indigo-800/50" 
                            : "text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent"
                        }`}
                      >
                        {link.icon}
                        <span className="text-[15px]">{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
