import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import ScoreBlock from '../components/ui/ScoreBlock';

const easeCurve = [0.32, 0.72, 0, 1];

const JDResult = () => {
  const { jdId } = useParams();
  const navigate = useNavigate();
  const [jd, setJd] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/jd/${jdId}`)
      .then((res) => {
        setJd(res.data.data);
        setActiveTab(res.data.data.uploadedScore ? 'uploaded' : 'profile');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [jdId]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] p-10" style={{ backgroundColor: '#050505' }}>
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      </div>
    );
  }

  if (error || !jd) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: '#050505', color: '#F9FAFB' }}>
        <p className="font-body" style={{ color: '#E11D48' }}>{error || 'Not found'}</p>
      </div>
    );
  }

  const hasUploaded = !!jd.uploadedScore;

  return (
    <div className="min-h-[100dvh] relative overflow-hidden" style={{ backgroundColor: '#050505', color: '#F9FAFB' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 15% 10%, rgba(245,158,11,0.06), transparent 40%), radial-gradient(circle at 85% 90%, rgba(52,211,153,0.05), transparent 40%)' }} />

      <div className="max-w-3xl mx-auto px-6 py-16 relative">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: easeCurve }}>
          <Link to="/dashboard" className="font-mono text-xs" style={{ color: '#71717A' }}>← Back to dashboard</Link>

          <div className="mt-6 mb-8">
            <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#71717A' }}>
              JD Result
            </span>
            <h1 className="font-display font-bold text-4xl tracking-tight mb-1">{jd.roleTitle}</h1>
            <p className="font-body text-sm" style={{ color: '#71717A' }}>{jd.companyName}</p>
          </div>

          <div className="flex gap-2 mb-8 p-1 rounded-full w-fit" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setActiveTab('profile')}
              className="font-body text-sm px-4 py-2 rounded-full transition-colors duration-300"
              style={{ backgroundColor: activeTab === 'profile' ? '#F59E0B' : 'transparent', color: activeTab === 'profile' ? '#0A0A0A' : '#71717A' }}
            >
              My Profile
            </button>
            <button
              onClick={() => hasUploaded && setActiveTab('uploaded')}
              disabled={!hasUploaded}
              className="font-body text-sm px-4 py-2 rounded-full transition-colors duration-300 disabled:opacity-40"
              style={{ backgroundColor: activeTab === 'uploaded' ? '#F59E0B' : 'transparent', color: activeTab === 'uploaded' ? '#0A0A0A' : '#71717A' }}
            >
              Uploaded Resume {!hasUploaded && '(Not provided)'}
            </button>
          </div>
        </motion.div>

        {activeTab === 'profile' && <ScoreBlock scoreData={jd.profileScore} onGenerateResume={() => navigate(`/resume/${jd._id}`)} />}
        {activeTab === 'uploaded' && hasUploaded && <ScoreBlock scoreData={jd.uploadedScore} onGenerateResume={() => navigate(`/resume/${jd._id}`)} />}
      </div>
    </div>
  );
};

export default JDResult;