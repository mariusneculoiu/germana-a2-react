import { useState } from "react";
import { BookOpen, Layers, BookA, Menu, X } from "lucide-react";
import VocabularPage from "./pages/Vocabular";
import FrazePage from "./pages/Fraze";
import GramaticaPage from "./pages/Gramatica";
import { cn } from "./lib/utils";

type Tab = "vocab" | "phrases" | "grammar";

const NAV_ITEMS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: "vocab", label: "Vocabular", icon: BookOpen },
  { id: "phrases", label: "Fraze", icon: Layers },
  { id: "grammar", label: "Gramatica", icon: BookA },
];

export default function App() {
  const [active, setActive] = useState<Tab>("vocab");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative md:translate-x-0 transition-transform duration-200 z-40",
          "w-64 bg-slate-900 text-white shadow-2xl min-h-screen flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg font-bold">
              D
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Germana A2</h1>
              <p className="text-xs text-slate-400 -mt-0.5">Inteligent learning</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActive(item.id);
                  setMobileOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all",
                  isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 text-[11px] text-slate-500 text-center border-t border-white/10">
          v1.0 · React + TypeScript
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pt-14 md:pt-8">
          {active === "vocab" && <VocabularPage />}
          {active === "phrases" && <FrazePage />}
          {active === "grammar" && <GramaticaPage />}
        </div>
      </main>
    </div>
  );
}
