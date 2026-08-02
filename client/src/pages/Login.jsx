import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ScoreReveal from '../components/ui/ScoreReveal';

const easeCurve = [0.32, 0.72, 0, 1];

const inputStyle = { borderColor: 'rgba(255,255,255,0.1)' };
const focusHandlers = {
  onFocus: (e) => (e.target.style.borderColor = '#F59E0B'),
  onBlur: (e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)'),
};
const inputClass =
  'bg-transparent border rounded-2xl px-4 py-3 font-body text-sm focus:outline-none w-full transition-colors duration-300';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden grid grid-cols-1 md:grid-cols-2" style={{ backgroundColor: '#050505', color: '#F9FAFB' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 15% 10%, rgba(245,158,11,0.07), transparent 40%), radial-gradient(circle at 85% 90%, rgba(52,211,153,0.05), transparent 40%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: easeCurve }}
        className="hidden md:flex flex-col justify-between p-14 relative"
      >
        <span className="font-body font-bold text-lg tracking-tight">
          Placement<span style={{ color: '#F59E0B' }}>OS</span>
        </span>
        <div>
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-5"
            style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
          >
            The core loop
          </span>
          <h1 className="font-display font-bold text-4xl tracking-tight leading-tight mb-4">
            Know your match before they do.
          </h1>
          <p className="font-body text-sm mb-10" style={{ color: '#71717A' }}>
            Score your profile against any JD, close the gaps, generate a tailored resume.
          </p>
          <div className="p-1.5 rounded-3xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="rounded-[calc(1.5rem-0.375rem)] p-6" style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}>
              <ScoreReveal />
            </div>
          </div>
        </div>
        <div />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: easeCurve, delay: 0.1 }}
        className="flex items-center justify-center p-8 relative"
      >
        <div className="w-full max-w-sm p-1.5 rounded-[2rem]" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <form onSubmit={handleSubmit} className="rounded-[calc(2rem-0.375rem)] p-8 flex flex-col gap-4" style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}>
            <h2 className="font-display font-bold text-2xl tracking-tight mb-1">Sign in</h2>

            <div className="flex flex-col gap-1">
              <label className="font-body text-xs" style={{ color: '#71717A' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass} style={inputStyle} {...focusHandlers}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-body text-xs" style={{ color: '#71717A' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass} style={inputStyle} {...focusHandlers}
                required
              />
            </div>

            {error && <p className="text-sm font-body" style={{ color: '#E11D48' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="group font-body font-medium text-sm rounded-full py-3 mt-2 flex items-center justify-center gap-2 transition-transform duration-300 active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && (
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5"
                  style={{ backgroundColor: 'rgba(10,10,10,0.15)' }}
                >
                  →
                </span>
              )}
            </button>

            <p className="text-sm font-body text-center mt-2" style={{ color: '#71717A' }}>
              No account? <Link to="/register" style={{ color: '#F59E0B' }} className="font-medium">Register</Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;