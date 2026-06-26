import React, { useEffect, useState } from 'react';

export interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  earned: boolean;
}

export const ALL_BADGES: Badge[] = [
  { id: 'first_class', icon: '🥋', title: 'First Step', description: 'Logged your first class', earned: false },
  { id: 'five_classes', icon: '🔥', title: 'Getting Warm', description: '5 classes logged', earned: false },
  { id: 'twenty_classes', icon: '💪', title: 'Mat Rat', description: '20 classes logged', earned: false },
  { id: 'fifty_classes', icon: '⚡', title: 'Dedicated Grappler', description: '50 classes logged', earned: false },
  { id: 'hundred_classes', icon: '🏆', title: 'Black Belt Mentality', description: '100 classes logged', earned: false },
  { id: 'first_note', icon: '📝', title: 'Technique Collector', description: 'First note written', earned: false },
  { id: 'weekly_goal', icon: '🎯', title: 'Goal Setter', description: 'Completed your first weekly goal', earned: false },
  { id: 'seven_day_streak', icon: '📅', title: 'Consistent', description: '7 days training in a week', earned: false },
  { id: 'belt_promotion', icon: '🎽', title: 'Promoted', description: 'Logged a belt promotion', earned: false },
];

export function computeBadges(
  totalClasses: number,
  hasNote: boolean,
  weeklyGoalCompleted: boolean,
  trainingDaysThisWeek: number,
  hasBeltPromotion: boolean,
): Badge[] {
  return ALL_BADGES.map(badge => {
    let earned = false;
    switch (badge.id) {
      case 'first_class': earned = totalClasses >= 1; break;
      case 'five_classes': earned = totalClasses >= 5; break;
      case 'twenty_classes': earned = totalClasses >= 20; break;
      case 'fifty_classes': earned = totalClasses >= 50; break;
      case 'hundred_classes': earned = totalClasses >= 100; break;
      case 'first_note': earned = hasNote; break;
      case 'weekly_goal': earned = weeklyGoalCompleted; break;
      case 'seven_day_streak': earned = trainingDaysThisWeek >= 7; break;
      case 'belt_promotion': earned = hasBeltPromotion; break;
    }
    return { ...badge, earned };
  });
}

interface BadgePopupProps {
  badge: Badge;
  onClose: () => void;
}

export function BadgePopup({ badge, onClose }: BadgePopupProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl p-8 max-w-xs w-full text-center shadow-2xl 
          border border-yellow-500/30 animate-bounce-once"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">{badge.icon}</div>
        <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">
          Achievement Unlocked!
        </div>
        <div className="text-white text-xl font-bold mb-2">{badge.title}</div>
        <div className="text-gray-400 text-sm">{badge.description}</div>
        <button
          onClick={onClose}
          className="mt-6 bg-yellow-500 text-black font-bold px-6 py-2 rounded-xl text-sm"
        >
          Let's Go! 🔥
        </button>
      </div>
    </div>
  );
}

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {badges.map(badge => (
        <div
          key={badge.id}
          className={`rounded-xl p-3 text-center transition-all ${
            badge.earned
              ? 'bg-gray-800 border border-yellow-500/40 shadow-lg'
              : 'bg-gray-900 border border-gray-700 opacity-40'
          }`}
        >
          <div className="text-3xl mb-1">{badge.icon}</div>
          <div className={`text-xs font-bold ${badge.earned ? 'text-yellow-400' : 'text-gray-500'}`}>
            {badge.title}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 leading-tight">
            {badge.description}
          </div>
          {badge.earned && (
            <div className="text-yellow-500 text-xs mt-1">✓ Earned</div>
          )}
        </div>
      ))}
    </div>
  );
}
