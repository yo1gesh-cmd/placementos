import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import ScoreBlock from '../components/ui/ScoreBlock';

const inputStyle = { borderColor: 'rgba(255,255,255,0.1)' };
const focusHandlers = {
  onFocus: (e) => (e.target.style.borderColor = '#F59E0B'),
  onBlur: (e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)'),
};
const inputClass =
  'bg-transparent border rounded-2xl px-4 py-3 font-body text-sm focus:outline-none w-full transition-colors duration-300';

const easeCurve = [0.32, 0.72, 0, 1];

const JDAnalyzer = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: '', roleTitle: '', jdText: '' });
  const [uploadedResumeText, setUploadedResumeText] = useState('');
  const [jdPdf, setJdPdf] = useState(null);
  const [resumePdf, setResumePdf] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (jdPdf || resumePdf) {
        const fd = new FormData();
        fd.append('companyName', form.companyName);
        fd.append('roleTitle', form.roleTitle);
        fd.append('jdText', form.jdText);
        if (uploadedResumeText) fd.append('uploadedResumeText', uploadedResumeText);
        if (jdPdf) fd.append('jdPdf', jdPdf);
        if (resumePdf) fd.append('resumePdf', resumePdf);
        res = await api.post('/jd/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/jd/analyze', { ...form, uploadedResumeText: uploadedResumeText || undefined });
      }
      setResult(res.data.data);
      setActiveTab(res.data.data.jd.uploadedScore ? 'uploaded' : 'profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const hasUploaded = !!result?.jd?.uploadedScore;

  return (
    <div className="min-h-[100dvh] relative overflow-hidden" style={{ backgroundColor: '#050505', color: '#F9FAFB' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 15% 10%, rgba(245,158,11,0.06), transparent 40%), radial-gradient(circle at 85% 90%, rgba(52,211,153,0.05), transparent 40%)',
        }}
      />

      <div className="max-w-3xl mx-auto px-6 py-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeCurve }}
          className="mb-10"
        >
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-4"
            style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
          >
            JD Analyzer
          </span>
          <h1 className="font-display font-bold text-4xl tracking-tight">Paste a job description</h1>
        </motion.div>

        <div
          className="p-1.5 rounded-[2rem] mb-10"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="rounded-[calc(2rem-0.375rem)] p-8"
            style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Company name"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                  {...focusHandlers}
                  required
                />
                <input
                  placeholder="Role title"
                  value={form.roleTitle}
                  onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                  {...focusHandlers}
                  required
                />
              </div>

              <textarea
                placeholder="Paste the full job description here..."
                value={form.jdText}
                onChange={(e) => setForm({ ...form, jdText: e.target.value })}
                rows={9}
                className={`${inputClass} resize-none font-mono text-xs`}
                style={inputStyle}
                {...focusHandlers}
                required
              />

              <div className="flex flex-col gap-1">
                <label className="font-body text-xs" style={{ color: '#71717A' }}>
                  Or upload JD as PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setJdPdf(e.target.files[0])}
                  className="font-body text-xs file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:font-body file:font-medium"
                  style={{ color: '#F9FAFB' }}
                />
                {jdPdf && (
                  <span className="font-mono text-xs" style={{ color: '#34D399' }}>
                    {jdPdf.name} selected
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-body text-xs" style={{ color: '#71717A' }}>
                  Paste existing resume text (optional — for baseline comparison)
                </label>
                <textarea
                  placeholder="Paste your current resume text here..."
                  value={uploadedResumeText}
                  onChange={(e) => setUploadedResumeText(e.target.value)}
                  rows={5}
                  className={`${inputClass} resize-none font-mono text-xs`}
                  style={inputStyle}
                  {...focusHandlers}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-body text-xs" style={{ color: '#71717A' }}>
                  Or upload resume as PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumePdf(e.target.files[0])}
                  className="font-body text-xs file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:font-body file:font-medium"
                  style={{ color: '#F9FAFB' }}
                />
                {resumePdf && (
                  <span className="font-mono text-xs" style={{ color: '#34D399' }}>
                    {resumePdf.name} selected
                  </span>
                )}
              </div>

              {error && (
                <p className="text-sm font-body" style={{ color: '#E11D48' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group self-start font-body font-medium text-sm rounded-full px-6 py-3 flex items-center gap-2 transition-transform duration-300 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
              >
                {loading ? 'Analyzing...' : 'Analyze'}
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5"
                  style={{ backgroundColor: 'rgba(10,10,10,0.15)' }}
                >
                  →
                </span>
              </button>
            </form>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeCurve }}>
              <div className="flex gap-2 mb-6 p-1 rounded-full w-fit" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="font-body text-sm px-4 py-2 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: activeTab === 'profile' ? '#F59E0B' : 'transparent',
                    color: activeTab === 'profile' ? '#0A0A0A' : '#71717A',
                  }}
                >
                  My Profile
                </button>
                <button
                  onClick={() => hasUploaded && setActiveTab('uploaded')}
                  disabled={!hasUploaded}
                  className="font-body text-sm px-4 py-2 rounded-full transition-colors duration-300 disabled:opacity-40"
                  style={{
                    backgroundColor: activeTab === 'uploaded' ? '#F59E0B' : 'transparent',
                    color: activeTab === 'uploaded' ? '#0A0A0A' : '#71717A',
                  }}
                >
                  Uploaded Resume {!hasUploaded && '(Not provided)'}
                </button>
              </div>

              {activeTab === 'profile' && (
                <ScoreBlock
                  scoreData={result.jd.profileScore}
                  onGenerateResume={() => navigate(`/resume/${result.jd._id}`)}
                />
              )}
              {activeTab === 'uploaded' && hasUploaded && (
                <ScoreBlock
                  scoreData={result.jd.uploadedScore}
                  onGenerateResume={() => navigate(`/resume/${result.jd._id}`)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JDAnalyzer;