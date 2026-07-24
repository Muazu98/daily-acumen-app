import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Dexie from "dexie";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Wind, ArrowRight, Target, Filter } from "lucide-react";
import confetti from "canvas-confetti";

// ─── Local Database Setup ────────────────────────────────────────────────────
const db = new Dexie("TrackerDB");

// Version 1 (Legacy)
db.version(1).stores({
  tasks: "++id, text, completed, createdAt"
});

// Version 2 (Context Upgrade)
db.version(2).stores({
  tasks: "++id, text, completed, createdAt, context"
}).upgrade(tx => {
  return tx.tasks.toCollection().modify(task => {
    // Default any existing tasks to 'life' so nothing breaks
    if (!task.context) task.context = "life";
  });
});

// ─── Constants & Helpers ─────────────────────────────────────────────────────
const QUICK_CHIPS = [
  "Read 1 paper", "Update log", "Review flashcards", "Exercise", 
  "Drink water", "Call family", "Groceries", "Meditate"
];

const OVERDUE_MS = 24 * 60 * 60 * 1000;

const CONTEXTS = {
  life: { label: "Life", color: "bg-gray-400", activeClass: "bg-gray-500 text-white border-gray-500" },
  Work: { label: "Work", color: "bg-teal-400", activeClass: "bg-teal-500 text-white border-teal-500" },
  study: { label: "Study", color: "bg-indigo-400", activeClass: "bg-indigo-500 text-white border-indigo-500" }
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
      <motion.div
        className="absolute top-16 left-6 md:left-16"
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
          <ellipse cx="60" cy="42" rx="54" ry="18" fill="white" opacity="0.75" />
          <ellipse cx="42" cy="36" rx="28" ry="22" fill="white" opacity="0.8" />
          <ellipse cx="72" cy="34" rx="24" ry="20" fill="white" opacity="0.8" />
          <ellipse cx="56" cy="28" rx="20" ry="16" fill="white" opacity="0.85" />
        </svg>
      </motion.div>
      <motion.div
        className="absolute bottom-28 right-4 md:right-20"
        animate={{ x: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <svg width="80" height="40" viewBox="0 0 80 40" fill="none">
          <ellipse cx="40" cy="28" rx="36" ry="12" fill="white" opacity="0.6" />
          <ellipse cx="28" cy="22" rx="18" ry="14" fill="white" opacity="0.65" />
          <ellipse cx="50" cy="20" rx="16" ry="13" fill="white" opacity="0.65" />
          <ellipse cx="38" cy="16" rx="14" ry="11" fill="white" opacity="0.7" />
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
    { x: "55%", y: "4%",  r: 1.5, delay: 0.3 },
    { x: "70%", y: "10%", r: 2,   delay: 0.8 },
    { x: "85%", y: "6%",  r: 1.5, delay: 1.5 },
    { x: "92%", y: "18%", r: 3,   delay: 0.6 },
    { x: "15%", y: "30%", r: 1.5, delay: 1.8 },
    { x: "5%",  y: "45%", r: 2,   delay: 0.9 },
    { x: "90%", y: "35%", r: 1.5, delay: 1.1 },
    { x: "78%", y: "25%", r: 2,   delay: 0.4 },
    { x: "62%", y: "18%", r: 1.5, delay: 1.6 },
    { x: "47%", y: "22%", r: 1,   delay: 2.0 },
    { x: "30%", y: "19%", r: 1.5, delay: 0.7 },
    { x: "95%", y: "50%", r: 1,   delay: 1.3 },
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
          <circle cx="22" cy="38" r="2" fill="#A5B4FC" opacity="0.4" />
          <circle cx="28" cy="44" r="1.5" fill="#A5B4FC" opacity="0.3" />
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
  
  const isNight = useTimeOfDay();
  const now = Date.now();

  // ─── 4-Hour Nudge Logic ─────────────────────────────────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    const reminderInterval = setInterval(() => {
      if (pendingCount > 0 && Notification.permission === "granted") {
        new Notification("Daily Acumen", {
          body: `You still have ${pendingCount} task${pendingCount > 1 ? 's' : ''} pending. Time to get moving.`,
          icon: "/vite.svg"
        });
      }
    }, FOUR_HOURS);
    return () => clearInterval(reminderInterval);
  }, []);

 // Ask for ALL tasks so we know if they have a history
  const rawTasks = useLiveQuery(() => db.tasks.toArray());
  
  // Filter out the completed ones for the main display
  const tasks = rawTasks?.filter(t => !t.completed) ?? [];
  const totalTasksHistory = rawTasks?.length ?? 0;
  
  const sortedTasks = [...tasks].sort((a, b) => a.createdAt - b.createdAt);
  // Apply contextual filter
  const filteredTasks = activeFilter === "all" 
    ? sortedTasks 
    : sortedTasks.filter(t => (t.context || "life") === activeFilter);

  // Apply focus mode
  const visibleTasks = focusMode ? filteredTasks.slice(0, 1) : filteredTasks;
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

  const completeTask = (id) => {
    if (completingIds.has(id)) return;
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

  const bgClass = isNight ? "bg-gradient-to-br from-indigo-950 to-purple-900" : "bg-gradient-to-br from-blue-50 to-yellow-100";
  const headingClass = isNight ? "text-white" : "text-gray-900";
  const subClass = hasOverdue ? isNight ? "text-red-400/80" : "text-red-400" : isNight ? "text-white/50" : "text-gray-400";
  const cardBorderClass = isNight ? "bg-white/8 border-white/10" : "bg-white/80 border-white/60";
  const inputClass = isNight ? "bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-white/40 focus:ring-white/20" : "bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-100";
  const taskCardClass = isNight ? "bg-white/10 border-white/10 shadow-sm" : "bg-white/90 border-gray-100 shadow-sm";
  const checkBorderClass = isNight ? "border-white/30" : "border-gray-300";
  const emptyIconClass = isNight ? "bg-white/10 text-white/30" : "bg-gray-100 text-gray-300";
  const emptyTextClass = isNight ? "text-white/30" : "text-gray-400";
  const chipClass = isNight ? "bg-white/10 border-white/15 text-white/70 hover:bg-white/20 hover:text-white" : "bg-white/70 border-gray-200 text-gray-500 hover:bg-white hover:text-gray-800";
  
  const focusActiveClass = focusMode ? "bg-indigo-500 text-white border-indigo-500" : isNight ? "bg-white/10 border-white/15 text-white/60 hover:bg-white/20" : "bg-white/70 border-gray-200 text-gray-400 hover:bg-white hover:text-gray-700";
  const filterBtnBase = `text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-200 active:scale-95`;
  const filterBtnInactive = isNight ? "bg-white/10 border-white/15 text-white/60 hover:bg-white/20" : "bg-white/70 border-gray-200 text-gray-400 hover:bg-white hover:text-gray-700";

  return (
    <div className={`relative min-h-[100dvh] w-full flex justify-center transition-all duration-1000 ${bgClass}`}>
      {isNight ? <NightScene /> : <DayScene />}

      <div className="relative z-10 w-full max-w-lg px-6 py-12 md:py-20 flex flex-col">
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <h1 className={`text-4xl md:text-5xl font-bold tracking-tight mb-3 transition-colors duration-700 ${headingClass}`}>
              Hello, {userName}.
            </h1>
            <button
              onClick={onReset}
              className={`mt-2 shrink-0 text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95 ${
                isNight
                  ? "text-white/30 hover:text-white/60 hover:bg-white/8"
                  : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
              }`}
            >
              Change name
            </button>
          </div>
          <p className={`text-lg italic font-light transition-colors duration-500 ${subClass}`}>
            {subHeading}
          </p>
        </header>

        <form onSubmit={handleFormSubmit} className={`mb-3 relative flex items-center rounded-2xl border backdrop-blur-sm shadow-sm ${cardBorderClass}`}>
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

        {/* ── Context Tagger for New Tasks ── */}
        <div className="flex gap-2 mb-6">
          {Object.entries(CONTEXTS).map(([key, config]) => (
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
              <div className={`w-2 h-2 rounded-full ${config.color}`} />
              {config.label}
            </button>
          ))}
        </div>

        {/* ── Quick Chips ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-none">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleAdd(chip)}
              className={`shrink-0 text-sm px-4 py-2 rounded-full border backdrop-blur-sm transition-all duration-150 active:scale-95 ${chipClass}`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* ── Tool Bar: Filters & Focus Mode ── */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <button 
              onClick={() => setActiveFilter("all")} 
              className={`${filterBtnBase} ${activeFilter === "all" ? (isNight ? "bg-white/20 text-white border-white/30" : "bg-gray-800 text-white border-gray-800") : filterBtnInactive}`}
            >
              All
            </button>
            {Object.entries(CONTEXTS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`${filterBtnBase} ${activeFilter === key ? config.activeClass : filterBtnInactive}`}
              >
                {config.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setFocusMode((f) => !f)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-200 active:scale-95 ${focusActiveClass}`}
          >
            <Target size={13} strokeWidth={2.5} />
            {focusMode ? "Focus: on" : "Focus mode"}
          </button>
        </div>

        <div className="flex-1">
         {rawTasks === undefined ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-16 rounded-2xl animate-pulse ${isNight ? "bg-white/10" : "bg-gray-100/80"}`} />
              ))}
            </div>
          ) : visibleTasks.length === 0 && pendingCount === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-48"
            >
              <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center ${emptyIconClass}`}>
                <Wind size={28} />
              </div>
              <p className={`text-sm ${emptyTextClass}`}>
                {activeFilter === "all" ? "You are all caught up." : `No pending ${CONTEXTS[activeFilter].label.toLowerCase()} tasks.`}
              </p>
            </motion.div>
          ) : focusMode && visibleTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center text-sm mt-8 ${emptyTextClass}`}
            >
              Nothing to focus on right now.
            </motion.div>
          ) : (
            <>
              <ul className="space-y-3 pb-4">
                <AnimatePresence mode="popLayout">
                  {visibleTasks.map((task) => {
                    const isCompleting = completingIds.has(task.id);
                    const isOverdue = now - task.createdAt > OVERDUE_MS;
                    const taskContextColor = CONTEXTS[task.context || 'life'].color;

                    const taskTextClass = isCompleting
                      ? isNight ? "text-white/30 line-through" : "text-gray-300 line-through"
                      : isOverdue
                      ? isNight ? "text-red-400/80" : "text-red-400"
                      : isNight ? "text-white/90" : "text-gray-800";

                    return (
                      <motion.li
                        layout
                        key={task.id}
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: isCompleting ? 0 : 1, y: 0, scale: 1, x: isCompleting ? 20 : 0 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={`flex items-center p-4 rounded-2xl border backdrop-blur-sm group ${taskCardClass}`}
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
                        
                        {/* Context Color Indicator */}
                        <div className={`w-2 h-2 rounded-full shrink-0 mr-3 ${taskContextColor} ${isCompleting ? 'opacity-30' : 'opacity-100'}`} />

                        <span className={`text-base flex-1 transition-all duration-200 ${taskTextClass}`}>
                          {task.text}
                        </span>
                        
                        {isOverdue && !isCompleting && (
                          <span className={`ml-3 text-xs font-medium px-2 py-0.5 rounded-full ${isNight ? "bg-red-500/15 text-red-400/80" : "bg-red-50 text-red-400"}`}>
                            overdue
                          </span>
                        )}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>

              {focusMode && pendingCount > 1 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center text-xs mt-2 ${isNight ? "text-white/25" : "text-gray-300"}`}
                >
                  {pendingCount - 1} more task{pendingCount - 1 !== 1 ? "s" : ""} hidden — stay focused.
                </motion.p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Root App Component ──────────────────────────────────────────────────────
export default function App() {
  const [userName, setUserName] = useState(() => localStorage.getItem("userName"));

  const handleReset = () => {
    localStorage.removeItem("userName");
    setUserName(null);
  };

  if (!userName) return <Onboarding onDone={setUserName} />;
  return <Home userName={userName} onReset={handleReset} />;
}