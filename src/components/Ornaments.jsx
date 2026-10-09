import { motion } from 'framer-motion';

export function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lg-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a6418" /><stop offset=".3" stopColor="#f6dc7a" />
          <stop offset=".55" stopColor="#c8982c" /><stop offset=".75" stopColor="#fff1b0" /><stop offset="1" stopColor="#7d5a14" />
        </linearGradient>
      </defs>
      <path d="M32 4 L58 14 V32 C58 46 46 56 32 60 C18 56 6 46 6 32 V14 Z" fill="#2d1b0e" stroke="url(#lg-gold)" strokeWidth="3" />
      <path d="M22 44 L40 20 M40 20 l3 -6 l-6 3 M24 22 L42 44" stroke="url(#lg-gold)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="32" r="4" fill="url(#lg-gold)" />
    </svg>
  );
}

export function Flourish({ width = 180 }) {
  return (
    <div className="flourish" aria-hidden="true">
      <svg width={width} height="18" viewBox="0 0 180 18" fill="none" stroke="currentColor" strokeWidth="1.1">
        <path d="M2 9 H64 M116 9 H178" />
        <path d="M64 9 C72 1 82 1 90 9 C98 17 108 17 116 9" />
        <path d="M64 9 C72 17 82 17 90 9 C98 1 108 1 116 9" />
        <circle cx="90" cy="9" r="2.4" fill="currentColor" />
        <circle cx="40" cy="9" r="1.2" fill="currentColor" /><circle cx="140" cy="9" r="1.2" fill="currentColor" />
      </svg>
    </div>
  );
}

export function Stars({ count }) {
  const full = Math.floor(count);
  const half = count % 1 !== 0;
  return <span className="stars" aria-label={`${count} stars`}>{'★'.repeat(full)}{half ? '½' : ''}</span>;
}

/** Wax-seal check mark used on quest cards. */
export function SealGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 L10 17 L19 7" />
    </svg>
  );
}

/** The underline flourish drawn when a contract is signed. */
export function SignatureStroke({ draw }) {
  return (
    <svg viewBox="0 0 160 30" fill="none">
      <motion.path
        d="M4 18 C30 4 40 28 62 16 S96 2 110 18 S140 26 156 10"
        stroke="#8b2500" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: draw ? 1 : 0 }} transition={{ duration: .7, ease: 'easeInOut' }}
      />
    </svg>
  );
}

/**
 * Treasure chest. `state`: 'closed' | 'shaking' | 'open'. `glow` is the tier
 * colour that spills out when it opens. `size` small renders the wooden box.
 */
export function Chest({ state = 'closed', glow = '#ffd76a', small = false, width = 200 }) {
  const wood1 = small ? '#8a5a32' : '#6b3d1f';
  const wood2 = small ? '#5e3a22' : '#4a2a14';
  const band = small ? '#3a2412' : 'url(#chest-gold)';
  const open = state === 'open';
  return (
    <motion.svg
      width={width} viewBox="0 0 200 170" style={{ overflow: 'visible' }}
      animate={state === 'shaking' ? { rotate: [0, -4, 4, -3, 3, -2, 2, 0], y: [0, -2, 0, -3, 0] } : { rotate: 0, y: 0 }}
      transition={state === 'shaking' ? { duration: .55, repeat: Infinity, repeatDelay: .1 } : { duration: .3 }}
    >
      <defs>
        <linearGradient id="chest-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a6418" /><stop offset=".35" stopColor="#f6dc7a" /><stop offset=".6" stopColor="#c8982c" /><stop offset="1" stopColor="#7d5a14" />
        </linearGradient>
        <linearGradient id="chest-beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={glow} stopOpacity=".8" /><stop offset="1" stopColor={glow} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="chest-glow">
          <stop offset="0" stopColor={glow} stopOpacity=".95" /><stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* light pouring out */}
      <motion.ellipse cx="100" cy="70" rx="130" ry="100" fill="url(#chest-glow)"
        initial={{ opacity: 0, scale: .3 }} animate={{ opacity: open ? 1 : 0, scale: open ? 1 : .3 }}
        transition={{ duration: .6, ease: 'easeOut' }} />
      <motion.path d="M40 82 L-10 -60 L60 -70 L100 82 Z M100 82 L140 -70 L210 -60 L160 82 Z M70 82 L80 -90 L120 -90 L130 82 Z"
        fill="url(#chest-beam)" initial={{ opacity: 0 }} animate={{ opacity: open ? .85 : 0 }} transition={{ duration: .5, delay: .1 }} />

      {/* body */}
      <rect x="22" y="80" width="156" height="78" rx="6" fill={wood2} />
      {[0, 1, 2, 3].map(i => <line key={i} x1="26" x2="174" y1={96 + i * 16} y2={96 + i * 16} stroke={wood1} strokeWidth="2" opacity=".6" />)}
      {open && <rect x="26" y="76" width="148" height="10" rx="4" fill={glow} style={{ filter: `drop-shadow(0 0 10px ${glow})` }} />}
      <rect x="22" y="80" width="156" height="10" fill={band} />
      <rect x="40" y="80" width="12" height="78" fill={band} />
      <rect x="148" y="80" width="12" height="78" fill={band} />
      <rect x="22" y="150" width="156" height="8" rx="3" fill={band} />
      <rect x="88" y="86" width="24" height="30" rx="4" fill={band} />
      <circle cx="100" cy="99" r="4" fill="#1a0e06" />
      <rect x="98.5" y="99" width="3" height="9" fill="#1a0e06" />

      {/* lid, hinged at the back */}
      <motion.g
        style={{ originX: '100px', originY: '80px' }}
        initial={false}
        animate={open ? { rotate: -7, y: -34, scaleY: .5 } : { rotate: 0, y: 0, scaleY: 1 }}
        transition={{ type: 'spring', stiffness: 170, damping: 13 }}
      >
        <path d="M22 80 V58 C22 34 58 22 100 22 C142 22 178 34 178 58 V80 Z" fill={open ? '#2a170a' : wood1} />
        <path d="M22 80 V58 C22 34 58 22 100 22 C142 22 178 34 178 58 V80 Z" fill="none" stroke={band} strokeWidth="5" />
        <path d="M40 80 V44 C40 36 46 30 52 28 V80 Z" fill={band} />
        <path d="M160 80 V44 C160 36 154 30 148 28 V80 Z" fill={band} />
        <rect x="22" y="72" width="156" height="8" fill={band} />
      </motion.g>
    </motion.svg>
  );
}
