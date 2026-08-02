import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/axios';

const easeCurve = [0.32, 0.72, 0, 1];

const inputStyle = { borderColor: 'rgba(255,255,255,0.1)' };
const focusHandlers = {
  onFocus: (e) => (e.target.style.borderColor = '#F59E0B'),
  onBlur: (e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)'),
};
const inputClass =
  'bg-transparent border rounded-2xl px-4 py-3 font-body text-sm focus:outline-none w-full transition-colors duration-300';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([api.get('/auth/profile'), api.get('/prep/skills'), api.get('/prep/projects')])
      .then(([p, s, pr]) => {
        setProfile(p.data.data);
        setSkills(s.data.data);
        setProjects(pr.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => setProfile({ ...profile, [field]: value });

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/auth/profile', profile);
      setMessage('Saved');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-[100dvh] p-10" style={{ backgroundColor: '#050505' }}>
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative overflow-hidden" style={{ backgroundColor: '#050505', color: '#F9FAFB' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 15% 10%, rgba(245,158,11,0.06), transparent 40%), radial-gradient(circle at 85% 90%, rgba(52,211,153,0.05), transparent 40%)',
        }}
      />

      <div className="max-w-2xl mx-auto px-6 py-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeCurve }}
          className="mb-12"
        >
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-4"
            style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
          >
            Profile
          </span>
          <h1 className="font-display font-bold text-4xl tracking-tight">Your details</h1>
        </motion.div>

        {/* PERSONAL INFO */}
        <div className="p-1.5 rounded-[2rem] mb-8" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="rounded-[calc(2rem-0.375rem)] p-8"
            style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}
          >
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex flex-col gap-1">
                <label className="font-body text-xs" style={{ color: '#71717A' }}>Name</label>
                <input value={profile.name || ''} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} style={inputStyle} {...focusHandlers} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-body text-xs" style={{ color: '#71717A' }}>College</label>
                <input value={profile.college || ''} onChange={(e) => handleChange('college', e.target.value)} className={inputClass} style={inputStyle} {...focusHandlers} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex flex-col gap-1">
                <label className="font-body text-xs" style={{ color: '#71717A' }}>Phone</label>
                <input value={profile.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} className={inputClass} style={inputStyle} {...focusHandlers} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-body text-xs" style={{ color: '#71717A' }}>CGPA</label>
                <input type="number" step="0.01" value={profile.cgpa || ''} onChange={(e) => handleChange('cgpa', e.target.value)} className={inputClass} style={inputStyle} {...focusHandlers} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="flex flex-col gap-1">
                <label className="font-body text-xs" style={{ color: '#71717A' }}>LinkedIn</label>
                <input value={profile.linkedin || ''} onChange={(e) => handleChange('linkedin', e.target.value)} className={inputClass} style={inputStyle} {...focusHandlers} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-body text-xs" style={{ color: '#71717A' }}>GitHub</label>
                <input value={profile.github || ''} onChange={(e) => handleChange('github', e.target.value)} className={inputClass} style={inputStyle} {...focusHandlers} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-body text-xs" style={{ color: '#71717A' }}>Portfolio</label>
                <input value={profile.portfolio || ''} onChange={(e) => handleChange('portfolio', e.target.value)} className={inputClass} style={inputStyle} {...focusHandlers} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="group font-body font-medium text-sm rounded-full px-6 py-3 flex items-center gap-2 transition-transform duration-300 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
              >
                {saving ? 'Saving...' : 'Save changes'}
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5"
                  style={{ backgroundColor: 'rgba(10,10,10,0.15)' }}
                >
                  ↗
                </span>
              </button>
              {message && (
                <span className="font-mono text-xs" style={{ color: message === 'Saved' ? '#34D399' : '#E11D48' }}>
                  {message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SKILLS */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: easeCurve }}
          className="p-1.5 rounded-[2rem] mb-8"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="rounded-[calc(2rem-0.375rem)] p-8"
            style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}
          >
            <span
              className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-4"
              style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
            >
              Skills · {skills.length}
            </span>
            {skills.length === 0 ? (
              <p className="font-body text-sm" style={{ color: '#52525B' }}>No skills added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span
                    key={s._id}
                    className="font-mono text-xs px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#F9FAFB', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {s.name} · {s.proficiency}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* PROJECTS */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: easeCurve }}
          className="p-1.5 rounded-[2rem]"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="rounded-[calc(2rem-0.375rem)] p-8"
            style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}
          >
            <span
              className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-4"
              style={{ backgroundColor: 'rgba(52,211,153,0.1)', color: '#34D399' }}
            >
              Projects · {projects.length}
            </span>
            {projects.length === 0 ? (
              <p className="font-body text-sm" style={{ color: '#52525B' }}>No projects added yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => (
                  <div
                    key={p._id}
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="font-body font-semibold text-sm mb-1">{p.name}</div>
                    <div className="font-body text-sm" style={{ color: '#71717A' }}>{p.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;