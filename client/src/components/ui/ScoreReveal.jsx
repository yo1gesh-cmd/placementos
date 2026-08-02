import { useState, useEffect } from 'react';

const steps = [
  { text: 'Parsing job description...', score: null },
  { text: 'Embedding skills section...', score: null },
  { text: 'Semantic match: 0.56', score: null },
  { text: 'LLM quality check...', score: null },
  { text: 'Keyword overlap: 0.20', score: null },
  { text: 'Computing final score...', score: 39 },
  { text: 'Tailoring resume...', score: null },
  { text: 'Re-scoring against JD...', score: 78 },
];

const ScoreReveal = () => {
  const [visibleLines, setVisibleLines] = useState([]);
  const [displayScore, setDisplayScore] = useState(null);

  useEffect(() => {
    let i = 0;
    let cycleTimeout;

    const runCycle = () => {
      setVisibleLines([]);
      setDisplayScore(null);
      i = 0;

      const tick = () => {
        if (i >= steps.length) {
          cycleTimeout = setTimeout(runCycle, 2500);
          return;
        }
        const step = steps[i];
        setVisibleLines((prev) => [...prev.slice(-4), step.text]);
        if (step.score !== null) setDisplayScore(step.score);
        i++;
        setTimeout(tick, 500);
      };
      tick();
    };

    runCycle();
    return () => clearTimeout(cycleTimeout);
  }, []);

  return (
    <div className="font-mono text-sm">
      <div className="flex flex-col gap-1 h-40 justify-end mb-3">
        {visibleLines.map((line, idx) => (
          <div
            key={idx}
            className="text-paper/50"
            style={{ opacity: 0.4 + (idx / visibleLines.length) * 0.6 }}
          >
            {line}
          </div>
        ))}
      </div>
      {displayScore !== null && (
        <div className="flex items-baseline gap-2">
          <span className="text-paper/40">Match score</span>
          <span className="text-marigold text-3xl font-bold">{displayScore}%</span>
        </div>
      )}
    </div>
  );
};

export default ScoreReveal;