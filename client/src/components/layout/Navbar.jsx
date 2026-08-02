import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/jd-analyzer', label: 'JD Analyzer' },
  { to: '/prep-tracker', label: 'Prep Tracker' },
  { to: '/profile', label: 'Profile' },
  { to: '/voice-interview', label: 'VoiceInterview' },
];

const easeCurve = [0.32, 0.72, 0, 1];

const Navbar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="relative z-40 flex justify-center pt-6 pb-2" style={{ backgroundColor: '#050505' }}>
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeCurve }}
        className="flex items-center gap-6 px-6 py-3 rounded-full"
        style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px -8px rgba(0,0,0,0.4)',
        }}
      >
        <Link to="/dashboard" className="flex items-baseline gap-1">
          <span className="font-body font-bold text-lg tracking-tight" style={{ color: '#F9FAFB' }}>
            Placement
          </span>
          <span className="font-body font-bold text-lg tracking-tight" style={{ color: '#F59E0B' }}>
            OS
          </span>
        </Link>

        <div className="h-5 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
            return (
              <Link
                key={link.to}
                to={link.to}
                className="relative font-body text-sm px-3 py-1.5 rounded-full transition-colors duration-300"
                style={{
                  color: active ? '#0A0A0A' : '#71717A',
                  backgroundColor: active ? '#F59E0B' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <button
          onClick={logout}
          className="font-body font-medium text-xs px-4 py-1.5 rounded-full transition-transform duration-300 active:scale-[0.98]"
          style={{ backgroundColor: 'rgba(225,29,72,0.12)', color: '#E11D48' }}
        >
          Logout
        </button>
      </motion.nav>
    </div>
  );
};

export default Navbar;