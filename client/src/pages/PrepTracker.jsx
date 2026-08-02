import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/axios';

const columns = [
  { proficiency: 'Beginner', label: 'Needs work', color: '#E11D48' },
  { proficiency: 'Intermediate', label: 'Learning', color: '#F59E0B' },
  { proficiency: 'Advanced', label: 'Comfortable', color: '#34D399' },
];

const proficiencyOptions = ['Beginner', 'Intermediate', 'Advanced'];

const easeCurve = [0.32, 0.72, 0, 1];

const inputStyle = { borderColor: 'rgba(249,250,251,0.1)' };
const focusHandlers = {
  onFocus: (e) => (e.target.style.borderColor = '#F59E0B'),
  onBlur: (e) => (e.target.style.borderColor = 'rgba(249,250,251,0.1)'),
};
const inputClass =
  'bg-transparent border rounded-2xl px-4 py-3 font-body text-sm focus:outline-none transition-colors duration-300';

const PrepTracker = () => {
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 'Beginner', status: 'Learning' });
  const [adding, setAdding] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', impactMetric: '', githubUrl: '' });
  const [addingProject, setAddingProject] = useState(false);

  const fetchAll = () => {
    Promise.all([api.get('/prep/skills'), api.get('/prep/projects')])
      .then(([s, p]) => {
        setSkills(s.data.data);
        setProjects(p.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;
    setAdding(true);
    try {
      await api.post('/prep/skills', { ...newSkill, isVisible: true });
      setNewSkill({ name: '', proficiency: 'Beginner', status: 'Learning' });
      fetchAll();
    } finally {
      setAdding(false);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    setAddingProject(true);
    try {
      await api.post('/prep/projects', { ...newProject, techStack: [], isVisible: true });
      setNewProject({ name: '', description: '', impactMetric: '', githubUrl: '' });
      fetchAll();
    } finally {
      setAddingProject(false);
    }
  };

  const updateProficiency = async (skillId, proficiency) => {
    setSkills(skills.map((s) => (s._id === skillId ? { ...s, proficiency } : s)));
    await api.put(`/prep/skills/${skillId}`, { proficiency });
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden" style={{ backgroundColor: '#050505', color: '#F9FAFB' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 15% 10%, rgba(245,158,11,0.06), transparent 40%), radial-gradient(circle at 85% 90%, rgba(52,211,153,0.05), transparent 40%)',
        }}
      />

      <div className="max-w-5xl mx-auto px-6 py-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeCurve }}
          className="mb-16"
        >
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-4"
            style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
          >
            Prep Tracker
          </span>
          <h1 className="font-display font-bold text-4xl tracking-tight">What you're building toward</h1>
        </motion.div>

        {/* SKILLS SECTION */}
        <div className="p-1.5 rounded-[2rem]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="rounded-[calc(2rem-0.375rem)] p-8"
            style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}
          >
            <form onSubmit={handleAdd} className="flex gap-3 mb-10">
              <input
                placeholder="Add a skill or topic"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                className={`${inputClass} flex-1`}
                style={inputStyle}
                {...focusHandlers}
              />
              <button
                type="submit"
                disabled={adding}
                className="group font-body font-medium text-sm rounded-full px-6 py-3 flex items-center gap-2 transition-transform duration-300 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
              >
                Add
                <span className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5" style={{ backgroundColor: 'rgba(10,10,10,0.15)' }}>
                  +
                </span>
              </button>
            </form>

            {loading ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {columns.map((col) => {
                  const items = skills.filter((s) => s.proficiency === col.proficiency);
                  return (
                    <div key={col.proficiency}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                        <h3 className="font-body font-medium text-xs uppercase tracking-wider" style={{ color: '#71717A' }}>
                          {col.label} · {items.length}
                        </h3>
                      </div>
                      <div className="flex flex-col gap-2">
                        <AnimatePresence>
                          {items.length === 0 && (
                            <p className="font-body text-sm" style={{ color: '#52525B' }}>
                              Nothing here yet
                            </p>
                          )}
                          {items.map((skill) => (
                            <motion.div
                              key={skill._id}
                              layout
                              initial={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
                              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                              exit={{ opacity: 0, scale: 0.92 }}
                              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                              className="rounded-2xl p-4"
                              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                              <div className="font-body font-medium text-sm mb-3">{skill.name}</div>
                              <div className="flex gap-1 p-0.5 rounded-full" style={{ backgroundColor: '#050505' }}>
                                {proficiencyOptions.map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => updateProficiency(skill._id, opt)}
                                    className="flex-1 font-mono py-1.5 rounded-full transition-all duration-300"
                                    style={{
                                      fontSize: '10px',
                                      backgroundColor: skill.proficiency === opt ? '#F59E0B' : 'transparent',
                                      color: skill.proficiency === opt ? '#0A0A0A' : '#71717A',
                                    }}
                                  >
                                    {opt.slice(0, 3)}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* PROJECTS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: easeCurve }}
          className="mt-12 p-1.5 rounded-[2rem]"
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
              Projects
            </span>

            {projects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {projects.map((p) => (
                  <div
                    key={p._id}
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="font-body font-semibold text-sm mb-1">{p.name}</div>
                    <div className="font-body text-sm mb-2" style={{ color: '#71717A' }}>{p.description}</div>
                    {p.impactMetric && (
                      <div className="font-mono text-[11px]" style={{ color: '#34D399' }}>{p.impactMetric}</div>
                    )}
                    {p.githubUrl && (
                      <a href={p.githubUrl} target="_blank" rel="noreferrer" className="font-mono text-[11px] block mt-2 underline" style={{ color: '#71717A' }}>
                        {p.githubUrl}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddProject} className="flex flex-col gap-3">
              <input
                placeholder="Project name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className={inputClass} style={inputStyle} {...focusHandlers}
              />
              <textarea
                placeholder="What did you build?"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={2}
                className={`${inputClass} resize-none`} style={inputStyle} {...focusHandlers}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Impact (e.g. Used by 50+ students)"
                  value={newProject.impactMetric}
                  onChange={(e) => setNewProject({ ...newProject, impactMetric: e.target.value })}
                  className={inputClass} style={inputStyle} {...focusHandlers}
                />
                <input
                  placeholder="GitHub link"
                  value={newProject.githubUrl}
                  onChange={(e) => setNewProject({ ...newProject, githubUrl: e.target.value })}
                  className={inputClass} style={inputStyle} {...focusHandlers}
                />
              </div>
              <button
                type="submit"
                disabled={addingProject}
                className="self-start font-body font-medium text-sm rounded-full px-6 py-3 transition-transform duration-300 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#34D399', color: '#0A0A0A' }}
              >
                {addingProject ? 'Adding...' : 'Add project'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrepTracker;