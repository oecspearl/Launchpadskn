import { Link } from 'react-router-dom';
import {
  FaRocket, FaBrain, FaChartLine, FaGraduationCap,
  FaChalkboardTeacher, FaLaptopCode, FaArrowRight,
  FaBookOpen, FaUsers, FaCertificate
} from 'react-icons/fa';
import CurriculumAccess from '../components/common/CurriculumAccess';

// ─────────────────────────────────────────
// DESIGN TOKENS (matches LaunchPadSKNDashboard)
// ─────────────────────────────────────────
const T = {
  sknGreen:  '#009e60',
  sknRed:    '#c8001e',
  sknYellow: '#fcd116',
  sknBlack:  '#000000',
  forest:    '#006b40',
  crimson:   '#9a0017',
  amber:     '#c9a500',
  ink:       '#0f0f0f',
  charcoal:  '#1e2028',
  slate:     '#2c3140',
  stone:     '#f2ede4',
  parchment: '#faf7f2',
  mist:      '#e8e2d8',
  fog:       '#d4cec4',
};

const FONTS = {
  serif:     "'Source Serif 4', Georgia, serif",
  mono:      "'IBM Plex Mono', monospace",
  condensed: "'Barlow Condensed', sans-serif",
};

// ─────────────────────────────────────────
// INJECTED STYLES
// ─────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    /* Scoped to .homepage-root — no global leaks */
    .homepage-root *, .homepage-root *::before, .homepage-root *::after {
      margin: 0; padding: 0; box-sizing: border-box; border-radius: 0 !important;
    }
    .homepage-root {
      font-family: ${FONTS.serif};
      background: ${T.stone};
      color: ${T.ink};
    }
    .homepage-root a { text-decoration: none; color: inherit; }
    .homepage-root button { cursor: pointer; border: none; background: none; font-family: inherit; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(0.85); }
    }

    .hp-fade-1 { animation: fadeUp 0.5s ease both; animation-delay: 0.05s; }
    .hp-fade-2 { animation: fadeUp 0.5s ease both; animation-delay: 0.15s; }
    .hp-fade-3 { animation: fadeUp 0.5s ease both; animation-delay: 0.25s; }
    .hp-fade-4 { animation: fadeUp 0.5s ease both; animation-delay: 0.35s; }
    .hp-slide  { animation: slideIn 0.6s ease both; animation-delay: 0.2s; }

    .hp-nav-item { transition: color 0.12s, background 0.12s; }
    .hp-nav-item:hover { color: white !important; background: rgba(255,255,255,0.07) !important; }

    .hp-float-item { transition: background 0.12s, transform 0.12s; }
    .hp-float-item:hover { background: ${T.sknGreen} !important; transform: translateX(-3px); }
    .hp-float-item:hover svg { color: white !important; }

    .hp-stat-cell:hover { background: ${T.parchment} !important; }
    .hp-stat-cell:hover .hp-stat-topbar { background: var(--cell-color) !important; }

    .hp-feature-card { transition: background 0.14s, border-color 0.14s; }
    .hp-feature-card:hover { background: ${T.parchment} !important; border-color: ${T.sknGreen} !important; }
    .hp-feature-card:hover .hp-feat-icon-wrap { background: ${T.sknGreen} !important; color: white !important; }

    .hp-btn-primary { transition: background 0.12s; }
    .hp-btn-primary:hover { background: ${T.forest} !important; }

    .hp-btn-secondary { transition: background 0.12s, color 0.12s, border-color 0.12s; }
    .hp-btn-secondary:hover { background: ${T.ink} !important; color: white !important; border-color: ${T.ink} !important; }

    .hp-cta-btn { transition: background 0.12s; }
    .hp-cta-btn:hover { background: ${T.forest} !important; }

    .hp-live-dot { animation: pulse-dot 1.8s ease-in-out infinite; }
  `}</style>
);

// ─────────────────────────────────────────
// SKN FLAG LOGO (inline SVG)
// ─────────────────────────────────────────
const SKNFlagLogo = ({ width = 40, height = 26 }) => (
  <svg width={width} height={height} viewBox="0 0 40 26" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', flexShrink: 0 }}>
    <rect width="40" height="26" fill={T.sknGreen} />
    <clipPath id="hp-cr"><polygon points="18,0 40,0 40,26 22,26" /></clipPath>
    <rect width="40" height="26" fill={T.sknRed} clipPath="url(#hp-cr)" />
    <polygon points="0,24 38,0 40,0 40,2 2,26 0,26" fill={T.sknBlack} />
    <polygon points="0,20 34,0 38,0 0,24" fill={T.sknYellow} />
    <polygon points="2,26 40,2 40,6 6,26" fill={T.sknYellow} />
    <polygon points="8,14 9,11 10,14 7.2,12.1 10.8,12.1" fill="white" />
    <polygon points="24,9 25,6 26,9 23.2,7.1 26.8,7.1" fill="white" />
  </svg>
);

// ─────────────────────────────────────────
// SKN TRIBAR
// ─────────────────────────────────────────
const SKNTribar = () => (
  <div style={{ display: 'flex', height: 5, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300 }}>
    <div style={{ flex: 1, background: T.sknGreen }} />
    <div style={{ width: 28, background: T.sknYellow }} />
    <div style={{ width: 10, background: T.sknBlack }} />
    <div style={{ flex: 1, background: T.sknRed }} />
  </div>
);

// ─────────────────────────────────────────
// TOP NAV
// ─────────────────────────────────────────
const TopNav = () => (
  <header style={{
    height: 60, background: T.charcoal,
    display: 'flex', alignItems: 'stretch',
    position: 'fixed', top: 5, left: 0, right: 0,
    zIndex: 200, borderBottom: '1px solid rgba(255,255,255,0.05)'
  }}>
    {/* Brand */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 24px', background: T.ink,
      borderRight: '1px solid rgba(255,255,255,0.08)', flexShrink: 0
    }}>
      <SKNFlagLogo />
      <div>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: 'white', lineHeight: 1 }}>LaunchPad</div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: 2 }}>SKN · Learning Platform</div>
      </div>
    </div>

    {/* Nav links */}
    <nav style={{ flex: 1, display: 'flex', alignItems: 'stretch', padding: '0 8px' }}>
      {['Features', 'Curriculum', 'Schools', 'About'].map(item => (
        <a key={item} href={`#${item.toLowerCase()}`} className="hp-nav-item" style={{
          fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)', padding: '0 18px',
          display: 'flex', alignItems: 'center',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}>{item}</a>
      ))}
    </nav>

    {/* Right CTA */}
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10 }}>
      <Link to="/login" style={{
        fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600,
        letterSpacing: 2, textTransform: 'uppercase',
        padding: '9px 20px', border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.6)',
      }}>Log In</Link>
      <Link to="/login" className="hp-btn-primary" style={{
        fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600,
        letterSpacing: 2, textTransform: 'uppercase',
        padding: '9px 20px', background: T.sknGreen, color: 'white',
        display: 'flex', alignItems: 'center', gap: 8
      }}>Get Started <FaArrowRight size={10} /></Link>
    </div>
  </header>
);

// ─────────────────────────────────────────
// FLOATING SIDE MENU
// ─────────────────────────────────────────
const FloatingMenu = () => (
  <div style={{
    position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
    zIndex: 100, display: 'flex', flexDirection: 'column', gap: 0
  }}>
    {[
      { icon: <FaBookOpen size={14} />, label: 'Courses' },
      { icon: <FaUsers size={14} />, label: 'Community' },
      { icon: <FaCertificate size={14} />, label: 'Certificates' },
    ].map(({ icon, label }) => (
      <div key={label} className="hp-float-item" title={label} style={{
        width: 44, height: 44,
        background: T.charcoal,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        borderLeft: `3px solid ${T.sknGreen}`,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>{icon}</div>
    ))}
  </div>
);

// ─────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────
const HeroSection = () => (
  <section style={{
    background: T.slate, position: 'relative', overflow: 'hidden',
    paddingTop: 120, paddingBottom: 0, minHeight: '88vh',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
  }}>
    {/* BG layers */}
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(150deg, rgba(0,158,96,0.2) 0%, transparent 40%), linear-gradient(to right, rgba(15,15,15,0.85) 0%, rgba(15,15,15,0.3) 100%)`, zIndex: 0 }} />
    {/* diagonal accents */}
    <div style={{ position: 'absolute', top: -40, right: 120, width: 320, height: 'calc(100% + 80px)', background: `linear-gradient(135deg, transparent 40%, rgba(200,0,30,0.13) 40%, rgba(200,0,30,0.06) 60%, transparent 60%)`, transform: 'skewX(-12deg)', zIndex: 0 }} />
    <div style={{ position: 'absolute', top: -40, right: -40, width: 260, height: 'calc(100% + 80px)', background: `linear-gradient(135deg, transparent 40%, rgba(252,209,22,0.09) 40%, rgba(252,209,22,0.04) 60%, transparent 60%)`, transform: 'skewX(-12deg)', zIndex: 0 }} />
    {/* grid texture */}
    <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px), repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(255,255,255,0.01) 80px, rgba(255,255,255,0.01) 81px)`, zIndex: 0 }} />

    {/* Content */}
    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: 0, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 48px 0' }}>

      {/* Left: Text */}
      <div style={{ flex: 1, paddingBottom: 72 }}>
        {/* Eyebrow */}
        <div className="hp-fade-1" style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: T.sknGreen, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 24, height: 2, background: T.sknGreen, display: 'inline-block' }} />
          The Future of Education in SKN
        </div>

        {/* Title */}
        <div className="hp-fade-2">
          <div style={{ fontFamily: FONTS.condensed, fontSize: 72, fontWeight: 800, letterSpacing: 1, color: 'white', lineHeight: 0.9, marginBottom: 24 }}>
            Unlock Your<br />
            <span style={{ color: T.sknYellow }}>Potential</span><br />
            with LaunchPad SKN
          </div>
        </div>

        {/* Subtitle */}
        <div className="hp-fade-3" style={{ fontFamily: FONTS.serif, fontStyle: 'italic', fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: 300, lineHeight: 1.7, maxWidth: 480, marginBottom: 36 }}>
          Access world-class education, AI-powered personalised learning, and a supportive community — empowering every student and teacher in the Federation.
        </div>

        {/* CTAs */}
        <div className="hp-fade-4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/login" className="hp-btn-primary" style={{
            fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
            letterSpacing: 2, textTransform: 'uppercase',
            padding: '14px 28px', background: T.sknGreen, color: 'white',
            display: 'inline-flex', alignItems: 'center', gap: 10
          }}>
            Get Started <FaArrowRight size={11} />
          </Link>
          <a href="#features" className="hp-btn-secondary" style={{
            fontFamily: FONTS.mono, fontSize: 11, fontWeight: 500,
            letterSpacing: 2, textTransform: 'uppercase',
            padding: '14px 28px',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.6)',
            display: 'inline-flex', alignItems: 'center', gap: 10
          }}>
            Learn More
          </a>
        </div>

        {/* Live indicator */}
        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="hp-live-dot" style={{ width: 8, height: 8, background: T.sknGreen }} />
          <span style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Live across Saint Kitts &amp; Nevis · 10,000+ students</span>
        </div>
      </div>

      {/* Right: SKN image frame */}
      <div className="hp-slide" style={{ width: 420, flexShrink: 0, position: 'relative', alignSelf: 'flex-end' }}>
        {/* Flag stripe behind image */}
        <div style={{ position: 'absolute', left: -24, top: 40, bottom: 0, width: 6, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, background: T.sknGreen }} />
          <div style={{ height: 20, background: T.sknYellow }} />
          <div style={{ height: 10, background: T.sknBlack }} />
          <div style={{ flex: 1, background: T.sknRed }} />
        </div>

        {/* Image container */}
        <div style={{ position: 'relative', border: `2px solid rgba(255,255,255,0.1)`, overflow: 'hidden', background: T.charcoal }}>
          <img
            src="/skn.png"
            alt="Federation of St. Kitts and Nevis"
            onError={e => { if (e.target.src !== '/snk.png') e.target.src = '/snk.png'; }}
            style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 380, opacity: 0.9 }}
          />
          {/* Overlay gradient */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, rgba(15,15,15,0.7) 0%, transparent 50%)` }} />
          {/* Badge */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: 2.5, textTransform: 'uppercase', color: T.sknYellow, marginBottom: 4 }}>Federation of</div>
              <div style={{ fontFamily: FONTS.condensed, fontSize: 22, fontWeight: 800, letterSpacing: 2, color: 'white', lineHeight: 1 }}>St. Kitts &amp; Nevis</div>
            </div>
            <SKNFlagLogo width={44} height={28} />
          </div>
        </div>

        {/* Corner accent */}
        <div style={{ position: 'absolute', top: -8, right: -8, width: 32, height: 32, border: `3px solid ${T.sknYellow}`, borderBottom: 'none', borderLeft: 'none' }} />
        <div style={{ position: 'absolute', bottom: -8, left: -8, width: 32, height: 32, border: `3px solid ${T.sknGreen}`, borderTop: 'none', borderRight: 'none' }} />
      </div>
    </div>

    {/* Bottom border accent */}
    <div style={{ height: 4, background: `linear-gradient(90deg, ${T.sknGreen} 0%, ${T.sknYellow} 40%, ${T.sknBlack} 55%, ${T.sknRed} 100%)`, position: 'relative', zIndex: 1 }} />
  </section>
);

// ─────────────────────────────────────────
// STATS BAR
// ─────────────────────────────────────────
const statsData = [
  { number: '13+',  label: 'Partner Schools',  color: T.sknGreen },
  { number: '10k+', label: 'Active Students',  color: T.sknRed },
  { number: '99%',  label: 'Satisfaction Rate', color: T.sknYellow },
];

const StatsBar = () => (
  <section style={{ background: 'white', borderBottom: `1px solid ${T.fog}` }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {statsData.map((s, i) => (
        <div key={i} className="hp-stat-cell" style={{
          padding: '28px 40px', borderRight: i < 2 ? `1px solid ${T.fog}` : 'none',
          position: 'relative', cursor: 'default', '--cell-color': s.color
        }}>
          <div className="hp-stat-topbar" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: T.mist, transition: 'background 0.15s' }} />
          <div style={{ fontFamily: FONTS.condensed, fontSize: 52, fontWeight: 800, color: T.ink, lineHeight: 1, letterSpacing: 1 }}>{s.number}</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  </section>
);

// ─────────────────────────────────────────
// FEATURES SECTION
// ─────────────────────────────────────────
const features = [
  { icon: <FaBrain />,              title: 'AI-Powered Curriculum',  desc: 'Generate comprehensive lesson plans and curriculum frameworks instantly with our advanced AI engine.' },
  { icon: <FaChartLine />,          title: 'Real-time Analytics',    desc: 'Track student progress, attendance, and performance with detailed, actionable insights.' },
  { icon: <FaLaptopCode />,         title: 'Interactive Learning',   desc: 'Engage students with gamified lessons, virtual labs, and multimedia resources.' },
  { icon: <FaChalkboardTeacher />,  title: 'Teacher Tools',          desc: 'Streamline grading, assignment management, and communication with parents.' },
  { icon: <FaGraduationCap />,      title: 'Personalised Paths',     desc: "Adaptive learning paths that cater to each student's unique pace and learning style." },
  { icon: <FaRocket />,             title: 'Future Ready',           desc: 'Preparing the youth of St. Kitts & Nevis for the global digital economy.' },
];

const accentColors = [T.sknGreen, T.sknRed, T.amber, T.forest, T.sknGreen, T.sknRed];

const FeatureCard = ({ icon, title, desc, accent }) => (
  <div className="hp-feature-card" style={{
    background: 'white', border: `1px solid ${T.fog}`,
    padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16,
    cursor: 'pointer', position: 'relative', overflow: 'hidden'
  }}>
    {/* Top accent */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />

    {/* Icon */}
    <div className="hp-feat-icon-wrap" style={{
      width: 44, height: 44,
      background: T.mist, color: accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, transition: 'background 0.14s, color 0.14s', flexShrink: 0
    }}>
      {icon}
    </div>

    <div>
      <div style={{ fontFamily: FONTS.condensed, fontSize: 18, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: T.ink, marginBottom: 8 }}>{title}</div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 13, color: 'rgba(0,0,0,0.5)', lineHeight: 1.7, fontWeight: 300 }}>{desc}</div>
    </div>

    {/* Corner mark */}
    <div style={{ position: 'absolute', bottom: 12, right: 12, fontFamily: FONTS.mono, fontSize: 9, color: 'rgba(0,0,0,0.12)', letterSpacing: 1 }}>→</div>
  </div>
);

const FeaturesSection = () => (
  <section id="features" style={{ background: T.stone, padding: '80px 0', borderTop: `1px solid ${T.fog}` }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48, gap: 32 }}>
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 3, textTransform: 'uppercase', color: T.sknGreen, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 18, height: 2, background: T.sknGreen, display: 'inline-block' }} />
            Platform Capabilities
          </div>
          <div style={{ fontFamily: FONTS.condensed, fontSize: 44, fontWeight: 800, letterSpacing: 1, color: T.ink, lineHeight: 0.95 }}>
            Why Choose<br />LaunchPad SKN?
          </div>
        </div>
        <div style={{ maxWidth: 320, paddingTop: 8 }}>
          <div style={{ fontFamily: FONTS.serif, fontSize: 14, fontStyle: 'italic', color: 'rgba(0,0,0,0.45)', fontWeight: 300, lineHeight: 1.7 }}>
            We combine cutting-edge technology with local educational needs to create a platform that truly delivers.
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${T.fog}` }}>
        {features.map((f, i) => (
          <div key={i} style={{ borderRight: i % 3 < 2 ? `1px solid ${T.fog}` : 'none', borderBottom: i < 3 ? `1px solid ${T.fog}` : 'none' }}>
            <FeatureCard icon={f.icon} title={f.title} desc={f.desc} accent={accentColors[i]} />
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────
// ROLES SECTION
// ─────────────────────────────────────────
const roles = [
  { band: T.sknGreen, icon: '🎓', role: 'Student',      desc: 'Dashboard, AI Study Guide, timetable, assignments, grades, flashcards, achievements and more.',  tag: 'Learner Portal' },
  { band: T.sknRed,   icon: '📋', role: 'Teacher',      desc: 'Class management, lesson creation, assessment builder, analytics, PDF reports and CSV tools.',      tag: 'Educator Tools' },
  { band: T.amber,    icon: '⚙️', role: 'Admin',        desc: 'System-wide user management, curriculum mapping, institutional analytics and federated oversight.', tag: 'Control Centre' },
  { band: T.slate,    icon: '👪', role: 'Parent',        desc: "Monitor your child's progress, view grades, attendance reports and communicate with teachers.",     tag: 'Family Access' },
];

const RolesSection = () => (
  <section style={{ background: T.ink, padding: '80px 0', borderTop: `3px solid ${T.sknGreen}` }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 3, textTransform: 'uppercase', color: T.sknGreen, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 18, height: 2, background: T.sknGreen, display: 'inline-block' }} />
          Five User Roles
        </div>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 44, fontWeight: 800, letterSpacing: 1, color: 'white', lineHeight: 0.95 }}>
          Built for Everyone<br />in the Federation
        </div>
      </div>

      {/* Role HCards */}
      <div style={{ border: `1px solid rgba(255,255,255,0.06)`, display: 'flex', flexDirection: 'column' }}>
        {roles.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'stretch',
            borderBottom: i < roles.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            background: 'rgba(255,255,255,0.02)', cursor: 'pointer',
            transition: 'background 0.12s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          >
            <div style={{ width: 5, flexShrink: 0, background: r.band }} />
            <div style={{ width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>{r.icon}</div>
            <div style={{ flex: 1, padding: '18px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
              <div style={{ fontFamily: FONTS.condensed, fontSize: 20, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'white' }}>{r.role}</div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.5 }}>{r.desc}</div>
            </div>
            <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{
                fontFamily: FONTS.mono, fontSize: 8.5, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
                padding: '4px 12px', background: 'rgba(0,158,96,0.12)', color: T.sknGreen, border: '1px solid rgba(0,158,96,0.25)'
              }}>{r.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────
// CTA BANNER
// ─────────────────────────────────────────
const CTABanner = () => (
  <section style={{ background: T.slate, position: 'relative', overflow: 'hidden', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
    {/* BG pattern */}
    <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(0,158,96,0.04) 10px, rgba(0,158,96,0.04) 11px)`, pointerEvents: 'none' }} />
    {/* Diagonal accent */}
    <div style={{ position: 'absolute', top: -20, right: 60, width: 300, height: 'calc(100% + 40px)', background: `linear-gradient(135deg, transparent 40%, rgba(252,209,22,0.07) 40%, rgba(252,209,22,0.03) 60%, transparent 60%)`, transform: 'skewX(-12deg)' }} />

    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 48px', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 3, textTransform: 'uppercase', color: T.sknGreen, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 18, height: 2, background: T.sknGreen, display: 'inline-block' }} />
          Join Today
        </div>
        <div style={{ fontFamily: FONTS.condensed, fontSize: 46, fontWeight: 800, letterSpacing: 1, color: 'white', lineHeight: 0.95, marginBottom: 12 }}>
          Ready to Launch<br /><span style={{ color: T.sknYellow }}>Your Future?</span>
        </div>
        <div style={{ fontFamily: FONTS.serif, fontSize: 14, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', fontWeight: 300, maxWidth: 420, lineHeight: 1.7 }}>
          Join thousands of students, teachers, and administrators already transforming education in Saint Kitts &amp; Nevis.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <Link to="/login" className="hp-cta-btn" style={{
          fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
          letterSpacing: 2, textTransform: 'uppercase',
          padding: '16px 36px', background: T.sknGreen, color: 'white',
          display: 'inline-flex', alignItems: 'center', gap: 10
        }}>
          Get Started Free <FaArrowRight size={11} />
        </Link>
        <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>No credit card required</div>
      </div>
    </div>

    {/* Bottom tricolour rule */}
    <div style={{ height: 4, background: `linear-gradient(90deg, ${T.sknGreen} 0%, ${T.sknYellow} 40%, ${T.sknBlack} 55%, ${T.sknRed} 100%)` }} />
  </section>
);

// ─────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────
const Footer = () => (
  <footer style={{ background: T.ink, borderTop: `3px solid rgba(255,255,255,0.04)` }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <SKNFlagLogo />
        <div>
          <div style={{ fontFamily: FONTS.condensed, fontSize: 16, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: 'white', lineHeight: 1 }}>LaunchPad SKN</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginTop: 2 }}>Digital Learning Platform</div>
        </div>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', gap: 28 }}>
        {['Privacy', 'Terms', 'Support', 'Contact'].map(l => (
          <a key={l} href="#" style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', transition: 'color 0.12s' }}
            onMouseEnter={e => e.target.style.color = T.sknGreen}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.25)'}
          >{l}</a>
        ))}
      </div>

      {/* Copyright */}
      <div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>© {new Date().getFullYear()} Launchpad SKN</div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, color: 'rgba(255,255,255,0.15)', marginTop: 3 }}>Built for the Federation of St. Kitts &amp; Nevis</div>
      </div>
    </div>

    {/* Tribar at very bottom */}
    <div style={{ display: 'flex', height: 4 }}>
      <div style={{ flex: 1, background: T.sknGreen }} />
      <div style={{ width: 20, background: T.sknYellow }} />
      <div style={{ width: 8, background: T.sknBlack }} />
      <div style={{ flex: 1, background: T.sknRed }} />
    </div>
  </footer>
);

// ─────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────
export default function Homepage() {
  return (
    <div className="homepage-root">
      <GlobalStyle />
      <SKNTribar />
      <TopNav />
      <FloatingMenu />

      <div style={{ paddingTop: 65 }}>
        <HeroSection />
        <StatsBar />
        <FeaturesSection />

        {/* Curriculum Access — component owns its own header + parchment shell */}
        <section style={{ background: '#ffffff', borderTop: `1px solid ${T.fog}`, padding: '80px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
            <CurriculumAccess />
          </div>
        </section>

        <RolesSection />
        <CTABanner />
        <Footer />
      </div>
    </div>
  );
}