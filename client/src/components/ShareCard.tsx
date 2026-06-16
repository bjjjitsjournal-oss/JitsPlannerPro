import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

interface ShareCardProps {
  weeklyProgress: number;
  weeklyGoal: number;
  totalClasses: number;
  classBreakdown: Record<string, number>;
  totalHours: number;
  userName?: string;
}

export default function ShareCard({
  weeklyProgress,
  weeklyGoal,
  totalClasses,
  classBreakdown,
  totalHours,
  userName,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const progressPercentage = weeklyGoal > 0
    ? Math.min(Math.round((weeklyProgress / weeklyGoal) * 100), 100)
    : 0;

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'jits-journal-stats.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My BJJ Stats — Jits Journal',
          });
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'jits-journal-stats.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div>
      {/* Hidden card that gets screenshotted */}
      <div
        ref={cardRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
      >
        <div style={{
          width: '400px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: '20px',
          padding: '32px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: 'white',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                🥋 Jits Journal
              </div>
              {userName && (
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                  {userName}'s Stats
                </div>
              )}
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#94a3b8',
            }}>
              This Week
            </div>
          </div>

          {/* Weekly Goal Progress */}
          <div style={{
            background: 'rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
              WEEKLY GOAL
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
              <span style={{ fontSize: '42px', fontWeight: '800', color: '#60a5fa' }}>
                {weeklyProgress}
              </span>
              <span style={{ fontSize: '18px', color: '#64748b' }}>/ {weeklyGoal} classes</span>
            </div>
            {/* Progress bar */}
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '8px' }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '8px',
                borderRadius: '999px',
                background: progressPercentage >= 100
                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                  : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              }} />
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px', textAlign: 'right' }}>
              {progressPercentage}% complete
            </div>
          </div>

          {/* Total Stats Row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#a78bfa' }}>
                {totalClasses}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Total Classes</div>
            </div>
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#34d399' }}>
                {totalHours.toFixed(1)}h
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Total Hours</div>
            </div>
          </div>

          {/* Class Breakdown */}
          {Object.keys(classBreakdown).length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
                CLASS BREAKDOWN
              </div>
              {Object.entries(classBreakdown).map(([type, count]) => (
                <div key={type} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}>
                  <span style={{ fontSize: '14px', color: '#e2e8f0' }}>{type}</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#60a5fa',
                    background: 'rgba(96,165,250,0.15)',
                    padding: '2px 10px',
                    borderRadius: '999px',
                  }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#475569',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '16px',
          }}>
            Track your BJJ journey • jitsjournal.com
          </div>
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 
          text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg 
          hover:opacity-90 active:scale-95 transition-all duration-150"
      >
        <span>📤</span>
        <span>Share Stats</span>
      </button>
    </div>
  );
}
