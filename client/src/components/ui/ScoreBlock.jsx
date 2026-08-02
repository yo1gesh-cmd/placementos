const severityColor = { critical: '#E11D48', moderate: '#F59E0B', low: '#34D399' };

const scoreColor = (score) => {
  if (score >= 70) return '#34D399';
  if (score >= 40) return '#F59E0B';
  return '#E11D48';
};

const ScoreBlock = ({ scoreData, onGenerateResume }) => {
  if (!scoreData) {
    return (
      <div className="p-1.5 rounded-[2rem]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="rounded-[calc(2rem-0.375rem)] p-10 text-center" style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}>
          <p className="font-body text-sm" style={{ color: '#71717A' }}>No data available for this view.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="p-1.5 rounded-[2rem]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="rounded-[calc(2rem-0.375rem)] p-10 text-center" style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}>
          <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#71717A' }}>
            Match Score
          </span>
          <div className="font-mono text-6xl font-bold" style={{ color: scoreColor(scoreData.finalScore) }}>
            {scoreData.finalScore}%
          </div>
          <p className="font-body text-sm mt-4" style={{ color: '#71717A' }}>{scoreData.verdict}</p>
          {onGenerateResume && (
            <button
              onClick={onGenerateResume}
              className="group inline-flex items-center gap-2 mt-6 font-body font-medium text-sm rounded-full px-6 py-3 transition-transform duration-300 active:scale-[0.98]"
              style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
            >
              Generate tailored resume
              <span className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5" style={{ backgroundColor: 'rgba(10,10,10,0.15)' }}>→</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-1.5 rounded-[2rem]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="rounded-[calc(2rem-0.375rem)] p-8" style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}>
          <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-5" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
            Section Breakdown
          </span>
          <div className="flex flex-col">
            {Object.entries(scoreData.sectionScores || {}).map(([key, val], i) => (
              <div key={key} className="flex items-center justify-between py-3" style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span className="font-body text-sm capitalize" style={{ color: '#71717A' }}>{key}</span>
                <span className="font-mono font-bold" style={{ color: scoreColor(val * 100) }}>{Math.round(val * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-1.5 rounded-[2rem]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="rounded-[calc(2rem-0.375rem)] p-8" style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}>
          <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-5" style={{ backgroundColor: 'rgba(225,29,72,0.1)', color: '#E11D48' }}>
            Skill Gaps
          </span>
          <div className="flex flex-wrap gap-2">
            {(scoreData.skillGaps || []).map((gap, i) => (
              <span key={i} className="font-mono text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: `${severityColor[gap.severity]}18`, color: severityColor[gap.severity], border: `1px solid ${severityColor[gap.severity]}30` }}>
                {gap.skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {scoreData.matchedSkills?.length > 0 && (
        <div className="p-1.5 rounded-[2rem]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="rounded-[calc(2rem-0.375rem)] p-8" style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}>
            <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-5" style={{ backgroundColor: 'rgba(52,211,153,0.1)', color: '#34D399' }}>
              What You Have
            </span>
            <div className="flex flex-wrap gap-2">
              {scoreData.matchedSkills.map((m, i) => (
                <span key={i} className="font-mono text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: '#34D39918', color: '#34D399', border: '1px solid #34D39930' }}>
                  {m.skill}{m.confidence === 'partial' ? ` (via ${m.matchedVia})` : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {scoreData.strengths?.length > 0 && (
        <div className="p-1.5 rounded-[2rem]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="rounded-[calc(2rem-0.375rem)] p-8" style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}>
            <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#71717A' }}>
              Strengths
            </span>
            <ul className="flex flex-col gap-2">
              {scoreData.strengths.map((s, i) => (
                <li key={i} className="font-body text-sm" style={{ color: '#71717A' }}>— {s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreBlock;