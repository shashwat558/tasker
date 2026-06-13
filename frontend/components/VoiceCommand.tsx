import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceCommandProps {
  onCommand: (command: string, transcript: string) => void;
}

export function VoiceCommand({ onCommand }: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      if (finalTranscript) {
        processCommand(finalTranscript.toLowerCase().trim());
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setTranscript('');
      }, 3000);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      
      if (event.error !== 'no-speech') {
        setError(`Error: ${event.error}`);
        setTimeout(() => setError(null), 3000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const processCommand = (text: string) => {
    if (text.includes('add task') || text.includes('create task') || text.includes('new task')) {
      let title = text.replace(/.*?(add|create|new) task /i, '').trim();
      onCommand('ADD_TASK', title);
    } else if (text.includes('complete task') || text.includes('finish task')) {
      let title = text.replace(/.*?(complete|finish) task /i, '').trim();
      onCommand('COMPLETE_TASK', title);
    } else if (text.includes('delete task') || text.includes('remove task')) {
      let title = text.replace(/.*?(delete|remove) task /i, '').trim();
      onCommand('DELETE_TASK', title);
    } else if (text.includes('search for') || text.includes('find task')) {
      let query = text.replace(/.*?(search for|find task(s?)) /i, '').trim();
      onCommand('SEARCH', query);
    } else if (text.includes('clear search') || text.includes('reset search')) {
      onCommand('CLEAR_SEARCH', text);
    } else if (text.includes('dark mode')) {
      onCommand('DARK_MODE', text);
    } else if (text.includes('light mode')) {
      onCommand('LIGHT_MODE', text);
    } else if (text.includes('show analytics') || text.includes('view analytics')) {
      onCommand('SHOW_ANALYTICS', text);
    } else if (text.includes('show board') || text.includes('show tasks')) {
      onCommand('SHOW_BOARD', text);
    } else if (text.includes('log out') || text.includes('sign out')) {
      onCommand('LOGOUT', text);
    } else {
      onCommand('UNKNOWN', text);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
      
      <AnimatePresence>
        {(transcript || error) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-none flex max-w-xs flex-col border-2 border-black bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-none"
          >
            {error ? (
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider">{error}</p>
            ) : (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Voice Input</p>
                <p className="text-sm font-semibold text-black dark:text-white truncate">"{transcript}"</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleListening}
        className={`pointer-events-auto flex size-14 items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none dark:border-white dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-none ${
          isListening 
            ? 'bg-red-500 text-white dark:bg-red-500 dark:text-white animate-pulse' 
            : 'bg-white text-black hover:bg-black hover:text-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black'
        }`}
        aria-label={isListening ? "Stop voice command" : "Start voice command"}
      >
        {isListening ? (
          <div className="relative">
             <Mic className="size-6 relative z-10" />
          </div>
        ) : (
          <MicOff className="size-6" />
        )}
      </button>
    </div>
  );
}
