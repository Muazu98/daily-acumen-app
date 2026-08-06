import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Dexie from "dexie";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Wind, ArrowRight, Target, Briefcase, BookOpen, Coffee, RefreshCw, Flame, Pencil } from "lucide-react";
import confetti from "canvas-confetti";

// ─── Local Database Setup ────────────────────────────────────────────────────
const db = new Dexie("TrackerDB");

db.version(1).stores({
  tasks: "++id, text, completed, createdAt"
});

db.version(2).stores({
  tasks: "++id, text, completed, createdAt, context"
}).upgrade(tx => {
  return tx.tasks.toCollection().modify(task => {
    if (!task.context) task.context = "life";
  });
});

// ─── Constants & Helpers ─────────────────────────────────────────────────────
const QUICK_CHIPS = [
  "Read 1 paper", "Update log", "Review flashcards", "Exercise", 
  "Drink water", "Call family", "Groceries"
];

const OVERDUE_MS = 24 * 60 * 60 * 1000;

const CONTEXTS = {
  life: { label: "Life", icon: Coffee, color: "bg-gray-400", textClass: "text-gray-500", activeClass: "bg-gray-500 text-white border-gray-500", tabClass: "border-gray-400 text-gray-500" },
  work: { label: "Work", icon: Briefcase, color: "bg-teal-400", textClass: "text-teal-500", activeClass: "bg-teal-500 text-white border-teal-500", tabClass: "border-teal-400 text-teal-500" },
  study: { label: "Study", icon: BookOpen, color: "bg-indigo-400", textClass: "text-indigo-500", activeClass: "bg-indigo-500 text-white border-indigo-500", tabClass: "border-indigo-400 text-indigo-500" }
};

function getIsNight() {
  const h = new Date().getHours();
  return h < 6 || h >= 18;
}

function useTimeOfDay() {
  const [isNight, setIsNight] = useState(getIsNight);
  useEffect(() => {
    const id = setInterval(() => setIsNight(getIsNight()), 60_000);
    return () => clearInterval(id);
  }, []);
  return isNight;
}

// ─── Atmospheric scenes ──────────────────────────────────────────────────────
function DayScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      <motion.div
        className="absolute top-10 right-12 md:top-14 md:right-24"
        animate={{ y: [0, -6, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <circle cx="36" cy="36" r="20" fill="#FCD34D" opacity="0.9" />
          <circle cx="36" cy="36" r="26" fill="#FCD34D" opacity="0.18" />
          {[0,45,90,135,180,225,270,315].map((deg, i) => (
            <line key={i} x1="36" y1="8" x2="36" y2="2" stroke="#F59E0B"
              strokeWidth="3" strokeLinecap="round"
              transform={`rotate(${deg} 36 36)`} opacity="0.7" />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

function NightScene() {
  const stars = [
    { x: "8%",  y: "12%", r: 2,   delay: 0 },
    { x: "22%", y: "6%",  r: 1.5, delay: 0.5 },
    { x: "38%", y: "9%",  r: 2.5, delay: 1.2 },
    { x: "70%", y: "10%", r: 2,   delay: 0.8 },
    { x: "85%", y: "6%",  r: 1.5, delay: 1.5 },
    { x: "92%", y: "18%", r: 3,   delay: 0.6 },
    { x: "15%", y: "30%", r: 1.5, delay: 1.8 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      <motion.div
        className="absolute top-10 right-12 md:top-14 md:right-24"
        animate={{ y: [0, -5, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" fill="#818CF8" opacity="0.08" />
          <circle cx="32" cy="32" r="22" fill="#C7D2FE" opacity="0.85" />
          <circle cx="43" cy="26" r="17" fill="#1E1B4B" opacity="0.95" />
        </svg>
      </motion.div>
      {stars.map((s, i) => (
        <motion.div key={i} className="absolute" style={{ left: s.x, top: s.y }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 2.5 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
        >
          <svg width={s.r * 8} height={s.r * 8} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r={s.r * 1.5} fill="white" opacity="0.9" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Onboarding ──────────────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  const isNight = useTimeOfDay();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = (e) => {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    localStorage.setItem("userName", name);
    onDone(name);
  };

  const bgClass = isNight
    ? "bg-gradient-to-br from-indigo-950 to-purple-900"
    : "bg-gradient-to-br from-blue-50 to-yellow-100";
  const cardClass = isNight
    ? "bg-white/10 border-white/10 shadow-2xl"
    : "bg-white/70 border-white/60 shadow-xl";
  const labelClass = isNight ? "text-white/60" : "text-gray-500";
  const headingClass = isNight ? "text-white" : "text-gray-900";
  const inputClass = isNight
    ? "bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-white/40 focus:ring-white/20"
    : "bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-100";

  return (
    <div className={`relative min-h-[100dvh] w-full flex items-center justify-center transition-all duration-1000 ${bgClass}`}>
      {isNight ? <NightScene /> : <DayScene />}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className={`relative z-10 w-full max-w-sm mx-6 rounded-3xl border backdrop-blur-md p-10 ${cardClass}`}
      >
        <p className={`text-sm font-medium tracking-widest uppercase mb-6 ${labelClass}`}>Welcome</p>
        <h1 className={`text-3xl font-bold tracking-tight mb-2 ${headingClass}`}>What should I call you?</h1>
        <p className={`text-sm mb-8 ${labelClass}`}>I'll use this to greet you every day.</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            className={`w-full h-14 px-5 rounded-2xl border text-base focus:outline-none focus:ring-2 transition-all duration-200 ${inputClass}`}
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 active:scale-[0.98] transition-all duration-150"
          >
            Let's go <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Home ────────────────────────────────────────────────────────────────────
function Home({ userName, onReset }) {
  const [text, setText] = useState("");
  const [completingIds, setCompletingIds] = useState(new Set());
  const [focusMode, setFocusMode] = useState(false);
  const [newTaskContext, setNewTaskContext] = useState("life");
  const [activeFilter, setActiveFilter] = useState("all");
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem("streak") || "0"));
  
  const isNight = useTimeOfDay();
  const now = Date.now();

  const rawTasks = useLiveQuery(() => db.tasks.toArray());
  const tasks = rawTasks?.filter(t => !t.completed) ?? [];
  const totalTasksHistory = rawTasks?.length ?? 0;
  
  const sortedTasks = [...tasks].sort((a, b) => a.createdAt - b.createdAt);
  
  const filteredTasks = activeFilter === "all" 
    ? sortedTasks 
    : sortedTasks.filter(t => (t.context || "life") === activeFilter);

  const visibleTasks = focusMode ? filteredTasks.slice(0, 1) : filteredTasks;
  const overdueTasks = visibleTasks.filter(t => now - t.createdAt > OVERDUE_MS);
  const todayTasks = visibleTasks.filter(t => now - t.createdAt <= OVERDUE_MS);
  
  const hasOverdue = filteredTasks.some((t) => now - t.createdAt > OVERDUE_MS);
  const pendingCount = filteredTasks.length;

  const subHeading = hasOverdue
    ? "Still ignoring these, huh?"
    : tasks.length === 0 && totalTasksHistory > 0
    ? "You are all caught up for today."
    : tasks.length === 0
    ? "What do you have to do today?"
    : pendingCount <= 5
    ? "Here's what you have for today, you've got this!"
    : "Long day ahead, you've got this.";

  const handleAdd = async (taskText, forceContext = null) => {
    const trimmed = taskText.trim();
    if (!trimmed) return;
    await db.tasks.add({ 
      text: trimmed, 
      completed: false, 
      createdAt: Date.now(),
      context: forceContext || newTaskContext
    });
    setText("");
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleAdd(text);
  };

  const checkAndUpdateStreak = () => {
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem("lastActiveDate");
    let currentStreak = parseInt(localStorage.getItem("streak") || "0");

    if (lastActive === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastActive === yesterday.toDateString()) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    localStorage.setItem("streak", currentStreak.toString());
    localStorage.setItem("lastActiveDate", today);
    setStreak(currentStreak);
  };

  const completeTask = (id) => {
    if (completingIds.has(id)) return;
    checkAndUpdateStreak();
    setCompletingIds((prev) => new Set(prev).add(id));
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"],
    });
    setTimeout(() => {
      db.tasks.update(id, { completed: true });
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 400);
  };

  const handleBump = (id) => {
    db.tasks.update(id, { createdAt: Date.now() });
  };

  // ─── Theme Variables ───────────────────────────────────────────────────────
  const bgClass = isNight ? "bg-gradient-to-br from-indigo-950 to-purple-900" : "bg-gradient-to-br from-blue-50 to-yellow-100";
  const headingClass = isNight ? "text-white" : "text-gray-900";
  const subClass = hasOverdue ? isNight ? "text-red-400/80" : "text-red-400" : isNight ? "text-white/50" : "text-gray-400";
  const cardBorderClass = isNight ? "bg-white/8 border-white/10" : "bg-white/80 border-white/60";
  const inputClass = isNight ? "bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-white/40 focus:ring-white/20" : "bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-100";
  const taskCardClass = isNight ? "bg-white/10 border-white/10 shadow-sm" : "bg-white/90 border-gray-100 shadow-sm";
  const checkBorderClass = isNight ? "border-white/30" : "border-gray-300";
  const emptyIconClass = isNight ? "bg-white/10 text-white/30" : "bg-gray-100 text-gray-300";
  const emptyTextClass = isNight ? "text-white/30" : "text-gray-400";
  
  // Distinguish Quick Chips from tags visually
  const quickChipClass = isNight ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white" : "bg-white/40 border-gray-200/50 text-gray-500 hover:bg-white hover:text-gray-800";
  const focusActiveClass = focusMode ? "bg-indigo-500 text-white border-indigo-500 shadow-md" : isNight ? "bg-white/10 border-white/15 text-white/80 hover:bg-white/20" : "bg-white shadow-sm border-gray-200 text-gray-600 hover:border-gray-300";

  // Tab bases
  const tabBase = `pb-2 text-sm font-medium border-b-2 transition-all duration-200 px-1`;
  const tabInactive = isNight ? "border-transparent text-white/40 hover:text-white/70" : "border-transparent text-gray-400 hover:text-gray-600";

  const renderTaskCard = (task) => {
    const isCompleting = completingIds.has(task.id);
    const isOverdue = now - task.createdAt > OVERDUE_MS;
    const contextConfig = CONTEXTS[task.context || 'life'];
    const TaskIcon = contextConfig.icon;

    const taskTextClass = isCompleting
      ? isNight ? "text-white/30 line-through font-normal" : "text-gray-300 line-through font-normal"
      : isOverdue
      ? isNight ? "text-red-400/90 font-medium" : "text-red-600 font-medium"
      : isNight ? "text-white/90 font-normal" : "text-gray-800 font-normal";

    const cardBaseClass = isOverdue && !isCompleting
      ? isNight ? "bg-red-500/10 border-red-500/20 shadow-sm" : "bg-red-50 border-red-200 shadow-sm"
      : taskCardClass;

    return (
      <motion.li
        layout
        key={task.id}
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: isCompleting ? 0 : 1, y: 0, scale: 1, x: isCompleting ? 20 : 0 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`flex items-center p-5 rounded-2xl border backdrop-blur-sm group ${cardBaseClass}`}
      >
        <button
          onClick={() => completeTask(task.id)}
          className={`shrink-0 w-7 h-7 mr-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            isCompleting
              ? "bg-indigo-500 border-indigo-500 scale-110"
              : isOverdue
              ? "border-red-400/50 hover:border-red-400 hover:bg-red-400/10"
              : `${checkBorderClass} hover:border-indigo-400 hover:bg-indigo-400/10`
          }`}
        >
          <Check size={14} strokeWidth={3} className={`transition-opacity ${isCompleting ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-40 text-indigo-400"}`} />
        </button>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4 transition-opacity ${contextConfig.color} bg-opacity-20 ${isCompleting ? 'opacity-30' : 'opacity-100'}`}>
           <TaskIcon size={14} className={contextConfig.textClass} />
        </div>

        <span className={`text-base leading-relaxed flex-1 transition-all duration-200 ${taskTextClass}`}>
          {task.text}
        </span>
        
        {isOverdue && !isCompleting && (
          <div className="flex items-center gap-2 ml-3">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest ${isNight ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-500"}`}>
              Priority
            </span>
            <button
              onClick={() => handleBump(task.id)}
              title="Bump to today"
              className={`p-1.5 rounded-lg border transition-all active:scale-95 ${isNight ? "border-white/10 text-white/40 hover:bg-white/10 hover:text-white" : "border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-700"}`}
            >
              <RefreshCw size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </motion.li>
    );
  };

  return (
    <div className={`relative min-h-[100dvh] w-full flex justify-center transition-all duration-1000 ${bgClass}`}>
      {isNight ? <NightScene /> : <DayScene />}

      <div className="relative z-10 w-full max-w-lg px-6 py-12 md:py-20 flex flex-col">
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className={`text-4xl md:text-5xl font-bold tracking-tight transition-colors duration-700 flex items-center gap-3 ${headingClass}`}>
                  Hello, {userName}
                  <button
                    onClick={onReset}
                    title="Change Name"
                    className={`shrink-0 p-2 rounded-full transition-all duration-150 active:scale-95 ${
                      isNight ? "text-white/30 hover:text-white/80 hover:bg-white/10" : "text-gray-300 hover:text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Pencil size={18} />
                  </button>
                </h1>
                
                {/* ── Streak Badge (Only shows if > 0) ── */}
                <AnimatePresence>
                  {streak > 0 && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${isNight ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-500"}`}
                    >
                      <Flame size={16} className={`fill-current ${isNight ? "text-orange-400" : "text-orange-500"}`} />
                      <span className="text-sm font-bold">{streak}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className={`text-lg italic font-light transition-colors duration-500 ${subClass}`}>
                {subHeading}
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleFormSubmit} className={`mb-4 relative flex items-center rounded-2xl border backdrop-blur-sm shadow-sm ${cardBorderClass}`}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a new task..."
            className={`w-full h-14 pl-5 pr-14 rounded-2xl text-base focus:outline-none focus:ring-2 transition-all duration-200 bg-transparent ${inputClass}`}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="absolute right-2 w-10 h-10 flex items-center justify-center bg-indigo-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all duration-150"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </form>

        {/* ── Elevated Action Row: Categories & Focus Mode ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2">
            {Object.entries(CONTEXTS).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewTaskContext(key)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    newTaskContext === key 
                      ? config.activeClass 
                      : isNight ? "border-white/15 text-white/50 hover:bg-white/10" : "border-gray-200 text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={12} className={newTaskContext === key ? "text-white" : config.textClass} />
                  {config.label}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setFocusMode((f) => !f)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border transition-all duration-200 active:scale-95 ${focusActiveClass}`}
          >
            <Target size={14} strokeWidth={2.5} />
            {focusMode ? "Focus: ON" : "Focus"}
          </button>
        </div>

        {/* ── Quick Add Section (Differentiated) ── */}
        <div className="mb-8">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ml-1 ${isNight ? "text-white/30" : "text-gray-400"}`}>
            Quick Add
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleAdd(chip)}
                className={`flex items-center gap-1.5 shrink-0 text-sm px-4 py-2 rounded-full border backdrop-blur-sm transition-all duration-150 active:scale-95 ${quickChipClass}`}
              >
                <Plus size={14} className={isNight ? "text-white/40" : "text-gray-400"} />
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* ── Clean Underlined Tabs ── */}
        <div className={`flex gap-6 border-b mb-6 overflow-x-auto scrollbar-none ${isNight ? "border-white/10" : "border-gray-200"}`}>
          <button 
            onClick={() => setActiveFilter("all")} 
            className={`${tabBase} ${activeFilter === "all" ? (isNight ? "border-white text-white" : "border-gray-800 text-gray-900") : tabInactive}`}
          >
            All
          </button>
          {Object.entries(CONTEXTS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`${tabBase} ${activeFilter === key ? (isNight ? config.tabClass : config.tabClass) : tabInactive}`}
              style={activeFilter === key && !isNight ? { borderColor: 'currentColor' } : {}}
            >
              {config.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {rawTasks === undefined ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-16 rounded-2xl animate-pulse ${isNight ? "bg-white/10" : "bg-gray-100/80"}`} />
              ))}
            </div>
          ) : visibleTasks.length === 0 && pendingCount === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-56 mt-4"
            >
              {streak > 0 && activeFilter === "all" ? (
                 <div className="flex flex-col items-center justify-center text-orange-500 mb-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isNight ? 'bg-orange-500/20' : 'bg-orange-50'}`}>
                      <Flame size={40} className={`fill-current ${isNight ? 'text-orange-400' : 'text-orange-500'}`} />
                    </div>
                    <p className={`text-xl font-bold ${isNight ? 'text-white' : 'text-gray-900'}`}>{streak} Day Streak!</p>
                 </div>
              ) : (
                 <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center ${emptyIconClass}`}>
                   <Wind size={28} />
                 </div>
              )}
              <p className={`text-sm ${emptyTextClass}`}>
                {activeFilter === "all" ? "You are all caught up for today." : `No pending ${CONTEXTS[activeFilter].label.toLowerCase()} tasks.`}
              </p>
            </motion.div>
          ) : focusMode ? (
            <div className="space-y-4 pb-4">
               {visibleTasks.length === 0 ? (
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`text-center text-sm mt-8 ${emptyTextClass}`}
                 >
                   Nothing to focus on right now.
                 </motion.div>
               ) : (
                 <>
                   <ul className="space-y-4">
                     <AnimatePresence mode="popLayout">
                       {visibleTasks.map(renderTaskCard)}
                     </AnimatePresence>
                   </ul>
                   {pendingCount > 1 && (
                     <motion.p
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className={`text-center text-xs mt-3 ${isNight ? "text-white/25" : "text-gray-300"}`}
                     >
                       {pendingCount - 1} more task{pendingCount - 1 !== 1 ? "s" : ""} hidden — stay focused.
                     </motion.p>
                   )}
                 </>
               )}
            </div>
          ) : (
            <div className="space-y-8 pb-4">
              {overdueTasks.length > 0 && (
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ml-1 ${isNight ? 'text-red-400/80' : 'text-red-500/80'}`}>Overdue</h3>
                  <ul className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {overdueTasks.map(renderTaskCard)}
                    </AnimatePresence>
                  </ul>
                </div>
              )}
              
              {todayTasks.length > 0 && (
                <div>
                  {overdueTasks.length > 0 && (
                     <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ml-1 mt-6 ${isNight ? 'text-white/40' : 'text-gray-400'}`}>Today</h3>
                  )}
                  <ul className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {todayTasks.map(renderTaskCard)}
                    </AnimatePresence>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [userName, setUserName] = useState(() => localStorage.getItem("userName"));

  const handleReset = () => {
    localStorage.removeItem("userName");
    setUserName(null);
  };

  if (!userName) return <Onboarding onDone={setUserName} />;
  return <Home userName={userName} onReset={handleReset} />;
}