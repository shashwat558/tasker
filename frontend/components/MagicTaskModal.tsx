import React, { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface MagicTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksGenerated: (tasks: any[]) => void;
}

export function MagicTaskModal({ isOpen, onClose, onTasksGenerated }: MagicTaskModalProps) {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/tasks/magic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate tasks');
      }
      
      onTasksGenerated(data.tasks);
      setText('');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isGenerating ? onClose : undefined}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="pointer-events-auto relative w-full max-w-lg border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-950 dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none flex flex-col"
            >
              <button
                onClick={!isGenerating ? onClose : undefined}
                disabled={isGenerating}
                className="absolute right-4 top-4 text-slate-400 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="size-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex size-10 items-center justify-center border-2 border-black dark:border-white bg-indigo-500 text-white">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-widest text-black dark:text-white">
                    Magic Task Breakdown
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Powered by Groq AI
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 border-2 border-red-500 bg-red-50 p-3 text-xs font-bold text-red-500 uppercase tracking-wider dark:bg-red-950/20">
                  {error}
                </div>
              )}

              <div className="mb-6 flex-1">
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                  Paste your meeting notes, email, or brain dump
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isGenerating}
                  placeholder="E.g. We need to launch the new marketing campaign by next Friday. John should prepare the graphics (high priority). Sarah will write the copy (medium priority). Let's also remember to send out the newsletter tomorrow."
                  className="h-48 w-full resize-none border-2 border-black bg-slate-50 p-3 text-sm font-semibold outline-none focus:ring-0 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-indigo-400 rounded-none transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={onClose}
                  disabled={isGenerating}
                  variant="outline"
                  className="border-black dark:border-white text-xs font-bold uppercase tracking-widest rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 border-2 border-transparent text-xs font-bold uppercase tracking-widest rounded-none min-w-[120px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Generating
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
