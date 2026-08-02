import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/axios';

const scoreColor = (score) => {
  if (score >= 70) return '#34D399';
  if (score >= 40) return '#F59E0B';
  return '#E11D48';
};

const ResumeGenerate = () => {
  const { jdId } = useParams();
  const [jd, setJd] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [newScore, setNewScore] = useState(null);
  const [loadingJd, setLoadingJd] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/jd/${jdId}`)
      .then((res) => setJd(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoadingJd(false));
  }, [jdId]);

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    try {
      const res = await api.post(`/resume/generate/${jdId}`, null, { responseType: 'blob' });
      const scoreHeader = res.headers['x-final-score'];
      if (scoreHeader) setNewScore(Number(scoreHeader));

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      setError('Resume generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const oldScore = jd?.scores?.finalScore ?? null;

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: '#0A0A0A', color: '#F9FAFB' }}>
      <div className="max-w-2xl mx-auto px-6 py-10">

        <span className="font-mono text-xs tracking-wide" style={{ color: '#F59E0B' }}>RESUME GENERATE</span>
        {loadingJd ? (
          <div className="h-8 w-64 rounded animate-pulse mt-2" style={{ backgroundColor: '#18181B' }} />
        ) : (
          <h1 className="font-display font-bold text-3xl tracking-tight mt-1 mb-8">
            {jd?.roleTitle} at {jd?.companyName}
          </h1>
        )}

        {error && <p className="text-sm font-body mb-4" style={{ color: '#E11D48' }}>{error}</p>}

        <div className="rounded-3xl p-8" style={{ backgroundColor: '#18181B', border: '1px solid rgba(249,250,251,0.08)' }}>
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="font-mono text-xs mb-1" style={{ color: '#71717A' }}>BEFORE</div>
              <div className="font-mono text-4xl font-bold" style={{ color: oldScore !== null ? scoreColor(oldScore) : '#71717A' }}>
                {oldScore ?? '—'}%
              </div>
            </div>
            <div className="font-mono text-2xl" style={{ color: '#71717A' }}>→</div>
            <div className="text-center">
              <div className="font-mono text-xs mb-1" style={{ color: '#71717A' }}>AFTER</div>
              <div className="font-mono text-4xl font-bold" style={{ color: newScore !== null ? scoreColor(newScore) : '#71717A' }}>
                {newScore ?? '—'}%
              </div>
            </div>
          </div>

          {!pdfUrl && (
            <button
              onClick={handleGenerate}
              disabled={generating || loadingJd}
              className="w-full font-body font-medium rounded-lg py-2 active:scale-[0.98] transition disabled:opacity-50"
              style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
            >
              {generating ? 'Generating tailored resume...' : 'Generate tailored resume'}
            </button>
          )}

          {pdfUrl && (
            <div className="flex flex-col gap-3">
            <a
                href={pdfUrl}
                download={`resume-${jd?.companyName}.pdf`}
                className="w-full text-center font-body font-medium rounded-lg py-2 active:scale-[0.98] transition"
                style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
              >
                Download PDF
              </a>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full font-body font-medium rounded-lg py-2 border active:scale-[0.98] transition"
                style={{ borderColor: 'rgba(249,250,251,0.15)' }}
              >
                {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          )}
        </div>

        {pdfUrl && (
          <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(249,250,251,0.08)' }}>
            <iframe src={pdfUrl} className="w-full" style={{ height: '600px', border: 'none' }} title="Resume preview" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeGenerate;