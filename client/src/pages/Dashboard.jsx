import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const easeCurve = [0.32, 0.72, 0, 1];

const scoreColor = (score) => {
  if (score >= 70) return '#34D399';
  if (score >= 40) return '#F59E0B';
  return '#E11D48';
};

const Dashboard = () => {
  const { user } = useAuth();
  const [jds, setJds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/jd')
      .then((res) => setJds(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const avgScore = jds.length
    ? Math.round(jds.reduce((sum, jd) => sum + (jd.profileScore?.finalScore || 0), 0) / jds.length)
    : null;

  return (
    <div className="min-h-[100dvh] relative overflow-hidden" style={{ backgroundColor: '#050505', color: '#F9FAFB' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 15% 10%, rgba(245,158,11,0.06), transparent 40%), radial-gradient(circle at 85% 90%, rgba(52,211,153,0.05), transparent 40%)',
        }}
      />

      <div className="max-w-4xl mx-auto px-6 py-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeCurve }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <span
              className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-4"
              style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
            >
              Dashboard
            </span>
            <h1 className="font-display font-bold text-4xl tracking-tight">
              Welcome back{user?.name ? `, ${user.name}` : ''}
            </h1>
          </div>
          <Link
            to="/jd-analyzer"
            className="group inline-flex items-center gap-2 font-body font-medium text-sm rounded-full px-6 py-3 transition-transform duration-300 active:scale-[0.98]"
            style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
          >
            Analyze new JD
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5"
              style={{ backgroundColor: 'rgba(10,10,10,0.15)' }}
            >
              +
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeCurve, delay: 0.1 }}
          className="p-1.5 rounded-[2rem] mb-12"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="rounded-[calc(2rem-0.375rem)] grid grid-cols-3 divide-x"
            style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="p-8">
              <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: '#71717A' }}>JDs Analyzed</div>
              <div className="font-mono text-4xl font-bold">{jds.length}</div>
            </div>
            <div className="p-8">
              <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: '#71717A' }}>Avg Match Score</div>
              <div className="font-mono text-4xl font-bold" style={{ color: avgScore !== null ? scoreColor(avgScore) : '#F9FAFB' }}>
                {avgScore !== null ? `${avgScore}%` : '—'}
              </div>
            </div>
            <div className="p-8">
              <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: '#71717A' }}>Resumes Generated</div>
              <div className="font-mono text-4xl font-bold">
                {jds.filter((jd) => jd.generatedResume?.finalScore > 0).length}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: easeCurve }}
        >
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#71717A' }}
          >
            Recent Analyses
          </span>

          {loading && (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          )}

          {error && <p className="font-body text-sm" style={{ color: '#E11D48' }}>{error}</p>}

          {!loading && !error && jds.length === 0 && (
            <div className="p-1.5 rounded-[2rem]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="rounded-[calc(2rem-0.375rem)] p-10 text-center" style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}>
                <p className="font-display font-semibold text-lg mb-2">No JDs analyzed yet</p>
                <p className="font-body text-sm mb-5" style={{ color: '#71717A' }}>
                  Paste a job description to see your match score and skill gaps.
                </p>
                <Link
                  to="/jd-analyzer"
                  className="inline-flex items-center gap-2 font-body font-medium text-sm rounded-full px-6 py-3 transition-transform duration-300 active:scale-[0.98]"
                  style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
                >
                  Analyze your first JD
                </Link>
              </div>
            </div>
          )}

          {!loading && jds.length > 0 && (
            <div className="p-1.5 rounded-[2rem]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="rounded-[calc(2rem-0.375rem)] p-2" style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}>
                {jds.map((jd) => (
                  <Link
                    key={jd._id}
                    to={`/jd-analyzer/${jd._id}`}
                    className="flex items-center justify-between p-4 rounded-2xl transition-colors duration-300 hover:bg-white/[0.03]"
                  >
                    <div>
                      <div className="font-body font-medium text-sm">{jd.roleTitle}</div>
                      <div className="font-body text-xs" style={{ color: '#71717A' }}>{jd.companyName}</div>
                    </div>
                    <div className="font-mono text-lg font-bold" style={{ color: scoreColor(jd.profileScore?.finalScore || 0) }}>
                      {jd.profileScore?.finalScore ?? 0}%
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;