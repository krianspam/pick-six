"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ArrowRight } from "lucide-react";

interface Team {
  id: string;
  code: string;
  name: string;
  flagUrl?: string | null;
}

interface PickNextTeamModalProps {
  open: boolean;
  teams: Team[];
  currentTeamName?: string;
  round: string;
  onPick: (teamId: string) => void;
  onDismiss: () => void;
}

export function PickNextTeamModal({ open, teams, currentTeamName, round, onPick, onDismiss }: PickNextTeamModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = () => {
    if (!selected) return;
    onPick(selected);
    setSelected(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-coral mb-1">Team eliminated</p>
              <h2 className="font-display text-2xl font-bold leading-tight">
                Pick your next team
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                {currentTeamName
                  ? `${currentTeamName} is out. Choose who to follow into ${round}.`
                  : `Choose a team to follow into ${round}.`}
              </p>
            </div>
            <button onClick={onDismiss} className="grid h-9 w-9 place-items-center rounded-xl border border-ink/10 text-ink/40 hover:bg-cream transition shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Team grid */}
          <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
            {teams.map((t) => {
              const isSelected = selected === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    isSelected
                      ? "border-lime bg-lime/8"
                      : "border-ink/10 hover:border-ink/25 hover:bg-cream/50"
                  }`}
                >
                  {t.flagUrl ? (
                    <img src={t.flagUrl} alt={t.name} className="h-8 w-8 object-contain flex-shrink-0" />
                  ) : (
                    <span className="text-2xl flex-shrink-0">⚽</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold truncate">{t.name}</p>
                    <p className="text-[10px] font-bold text-ink/40">{t.code}</p>
                  </div>
                  {isSelected && (
                    <div className="ml-auto h-5 w-5 rounded-full bg-lime flex items-center justify-center flex-shrink-0">
                      <Heart size={10} className="text-forest fill-forest" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Confirm */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-forest px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/30"
            >
              Confirm team <ArrowRight size={15} />
            </button>
          </div>

          <p className="mt-3 text-center text-[10px] text-ink/40 font-semibold">
            Your new team activates at the start of {round}. You can change again only when your new team is eliminated.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
