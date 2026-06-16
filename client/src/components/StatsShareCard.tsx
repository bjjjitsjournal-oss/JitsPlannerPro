import React, { useRef } from 'react';
import { shareElementAsImage } from '@/lib/shareImage';

interface StatsShareCardProps {
  totalClasses: number;
  totalHours: number;
  classBreakdown: Record<string, number>;
  bestSessionSubs: number;
  bestWeekSubs: number;
  belt?: string;
  stripes?: number;
  userName?: string;
}

const BELT_COLORS: Record<string, string> = {
  white: '#e2e8f0',
  blue: '#3b82f6',
  purple: '#a78bfa',
  brown: '#a16207',
  black: '#1e293b',
};

export default function StatsShareCard({
  totalClasses,
  totalHours,
  classBreakdown,
  bestSessionSubs,
  bestWeekSubs,
  belt,
  stripes = 0,
  userName,
}: StatsShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!cardRef.current) return;
    await shareElementAsImage(cardRef.current, {
      title: 'My BJJ Stats — Jits Journal',
      text: 'Check out my all-time BJJ training stats from Jits Journal! 🥋',
      fileName: 'jits-journal-stats',
    });
  };

  const beltColor = belt ? (BELT_COLORS[belt.toLowerCase()] || '#64748b') : null;

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
              All Time
            </div>
          </div>

          {/* Belt */}
          {belt && (
            <div style={{
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '64px',
                height: '18px',
                borderRadius: '4px',
                background: beltColor || '#64748b',
                border: belt.toLowerCase() === 'white' ? '1px solid #94a3b8' : 'none',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '4px',
                gap: '2px',
              }}>
                {Array.from({ length: stripes }).map((_, i) => (
                  <div key={i} style={{ width: '3px', height: '12px', background: '#cbd5e1', borderRadius: '1px' }} />
                ))}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', textTransform: 'capitalize' }}>
                {belt} Belt{stripes > 0 ? ` · ${stripes} stripe${stripes !== 1 ? 's' : ''}` : ''}
              </div>
            </div>
          )}

          {/* Total Stats Row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#34d399' }}>
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
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#fb923c' }}>
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
              marginBottom: '16px',
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

          {/* Submission Stats */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#a78bfa' }}>
                {bestSessionSubs}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Best Session Subs</div>
            </div>
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#f472b6' }}>
                {bestWeekSubs}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Best Week Subs</div>
            </div>
          </div>

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
        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 
          text-white px-4 py-3 rounded-2xl text-sm font-medium shadow-lg 
          hover:opacity-90 active:scale-95 transition-all duration-150"
      >
        <span>📤</span>
        <span>Share My Stats</span>
      </button>
    </div>
  );
}
