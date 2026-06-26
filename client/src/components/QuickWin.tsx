import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const QUICK_WINS = [
  { emoji: '🔒', label: 'Escaped mount' },
  { emoji: '🦵', label: 'Hit a sweep' },
  { emoji: '🤙', label: 'Got a submission' },
  { emoji: '🛡️', label: 'Survived a tough round' },
  { emoji: '📐', label: 'Nailed a technique' },
  { emoji: '💨', label: 'Cardio felt great' },
  { emoji: '🧠', label: 'Stayed calm under pressure' },
  { emoji: '🔄', label: 'Tried something new' },
];

export default function QuickWin() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const quickWinMutation = useMutation({
    mutationFn: async (win: string) => {
      return await apiRequest('POST', '/api/notes', {
        title: 'Quick Win 🏆',
        content: win,
        isShared: false,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 2000);
      toast({
        title: 'Quick Win logged! 🔥',
        description: 'Keep stacking those wins.',
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Could not log win. Try again.',
        variant: 'destructive',
      });
    },
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 
          text-white font-bold py-4 rounded-2xl shadow-lg text-lg
          active:scale-95 transition-all duration-150 flex items-center 
          justify-center gap-2"
      >
        <span>🏆</span>
        <span>Log a Quick Win</span>
      </button>
    );
  }

  if (submitted) {
    return (
      <div className="w-full bg-green-500 text-white font-bold py-4 
        rounded-2xl text-center text-lg">
        ✅ Win Logged! Keep rolling!
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 shadow-lg border border-yellow-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="text-white font-bold">What was your win today?</div>
        <button onClick={() => setIsOpen(false)} 
          className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_WINS.map((win) => (
          <button
            key={win.label}
            onClick={() => quickWinMutation.mutate(`${win.emoji} ${win.label}`)}
            disabled={quickWinMutation.isPending}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 
              text-white p-3 rounded-xl text-sm font-medium text-left
              border border-gray-700 hover:border-yellow-500/50
              active:scale-95 transition-all duration-150
              disabled:opacity-50"
          >
            <span className="text-xl">{win.emoji}</span>
            <span>{win.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
