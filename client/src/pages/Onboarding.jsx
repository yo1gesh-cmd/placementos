import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';

const stepMeta = {
  1: { label: 'EDUCATION', title: "Where'd you study?", sub: 'This feeds your resume header and score baseline.' },
  2: { label: 'SKILLS', title: 'What can you actually do?', sub: 'Only real skills — the AI won\'t fabricate what isn\'t here.' },
  3: { label: 'PROJECT', title: 'Show your best work', sub: 'One solid project beats five vague ones.' },
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [education, setEducation] = useState({ degree: '', field: '', institution: '', startYear: '', endYear: '', cgpa: '' });
  const [skills, setSkills] = useState([{ name: '', proficiency: 'Intermediate' }]);
  const [project, setProject] = useState({ name: '', description: '', impactMetric: '' });

  const handleSkillChange = (i, field, value) => {
    const updated = [...skills];
    updated[i][field] = value;
    setSkills(updated);
  };

  const addSkillRow = () => setSkills([...skills, { name: '', proficiency: 'Intermediate' }]);

  const handleFinish = async () => {
    setError('');
    setLoading(true);
    try {
      await api.put('/auth/profile', { education: [education] });

      for (const skill of skills) {
        if (skill.name.trim()) {
          await api.post('/prep/skills', { ...skill, status: 'Comfortable', isVisible: true });
        }
      }

      if (project.name.trim()) {
        await api.post('/prep/projects', { ...project, techStack: [], isVisible: true });
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { borderColor: 'rgba(249,250,251,0.15)' };
  const focusHandlers = {
    onFocus: (e) => e.target.style.borderColor = '#F59E0B',
    onBlur: (e) => e.target.style.borderColor = 'rgba(249,250,251,0.15)',
  };
  const inputClass = "bg-transparent border rounded-lg px-3 py-2 font-body focus:outline-none";

  const meta = stepMeta[step];

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-8" style={{ backgroundColor: '#0A0A0A', color: '#F9FAFB' }}>
      <div className="w-full max-w-lg p-8 rounded-3xl" style={{ backgroundColor: '#18181B', border: '1px solid rgba(249,250,251,0.08)' }}>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-all"
              style={{ backgroundColor: s <= step ? '#F59E0B' : 'rgba(249,250,251,0.15)' }}
            />
          ))}
        </div>

        <div className="mb-6">
          <span className="font-mono text-xs tracking-wide" style={{ color: '#F59E0B' }}>STEP {step} — {meta.label}</span>
          <h3 className="font-display font-bold text-2xl tracking-tight mt-1">{meta.title}</h3>
          <p className="font-body text-sm mt-1" style={{ color: '#71717A' }}>{meta.sub}</p>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Degree (e.g. B.Tech)" value={education.degree} onChange={(e) => setEducation({ ...education, degree: e.target.value })} className={inputClass} style={inputStyle} {...focusHandlers} />
              <input placeholder="Field (e.g. Computer Science)" value={education.field} onChange={(e) => setEducation({ ...education, field: e.target.value })} className={inputClass} style={inputStyle} {...focusHandlers} />
            </div>
            <input placeholder="Institution" value={education.institution} onChange={(e) => setEducation({ ...education, institution: e.target.value })} className={inputClass} style={inputStyle} {...focusHandlers} />
            <div className="grid grid-cols-3 gap-3">
              <input type="number" placeholder="Start year" value={education.startYear} onChange={(e) => setEducation({ ...education, startYear: e.target.value })} className={inputClass} style={inputStyle} {...focusHandlers} />
              <input type="number" placeholder="End year" value={education.endYear} onChange={(e) => setEducation({ ...education, endYear: e.target.value })} className={inputClass} style={inputStyle} {...focusHandlers} />
              <input type="number" step="0.01" placeholder="CGPA" value={education.cgpa} onChange={(e) => setEducation({ ...education, cgpa: e.target.value })} className={inputClass} style={inputStyle} {...focusHandlers} />
            </div>
            <button onClick={() => setStep(2)} className="font-body font-medium rounded-lg py-2 mt-2 active:scale-[0.98] transition" style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}>
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            {skills.map((skill, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <input placeholder="Skill (e.g. React)" value={skill.name} onChange={(e) => handleSkillChange(i, 'name', e.target.value)} className={inputClass} style={inputStyle} {...focusHandlers} />
                <select value={skill.proficiency} onChange={(e) => handleSkillChange(i, 'proficiency', e.target.value)} className={inputClass} style={inputStyle}>
                  <option style={{ color: '#0A0A0A' }}>Beginner</option>
                  <option style={{ color: '#0A0A0A' }}>Intermediate</option>
                  <option style={{ color: '#0A0A0A' }}>Advanced</option>
                </select>
              </div>
            ))}
            <button onClick={addSkillRow} className="font-body text-sm text-left" style={{ color: '#F59E0B' }}>+ Add another skill</button>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(1)} className="font-body font-medium rounded-lg py-2 px-4 border" style={{ borderColor: 'rgba(249,250,251,0.15)' }}>Back</button>
              <button onClick={() => setStep(3)} className="flex-1 font-body font-medium rounded-lg py-2 active:scale-[0.98] transition" style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}>Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <input placeholder="Project name" value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} className={inputClass} style={inputStyle} {...focusHandlers} />
            <textarea placeholder="What did you build?" value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} rows={3} className={`${inputClass} resize-none`} style={inputStyle} {...focusHandlers} />
            <input placeholder="Impact (e.g. Used by 50+ students)" value={project.impactMetric} onChange={(e) => setProject({ ...project, impactMetric: e.target.value })} className={inputClass} style={inputStyle} {...focusHandlers} />

            {error && <p className="text-sm font-body" style={{ color: '#E11D48' }}>{error}</p>}

            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(2)} className="font-body font-medium rounded-lg py-2 px-4 border" style={{ borderColor: 'rgba(249,250,251,0.15)' }}>Back</button>
              <button onClick={handleFinish} disabled={loading} className="flex-1 font-body font-medium rounded-lg py-2 active:scale-[0.98] transition disabled:opacity-50" style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}>
                {loading ? 'Saving...' : 'Finish setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;