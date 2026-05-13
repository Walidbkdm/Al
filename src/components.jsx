/* global window, React, Recharts */
// Shared UI components. Attached to window.AppComponents.

(function () {

const { useState, useEffect } = React;

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

// ---------- Icons (inline SVG, no extra deps) ----------
const Icon = ({ name, className = 'w-5 h-5' }) => {
  const paths = {
    dashboard: <path d="M3 12l9-9 9 9M4 10v10h5v-6h6v6h5V10"/>,
    calc: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/></>,
    refresh: <path d="M3 12a9 9 0 0 1 15.5-6.5L21 8M21 4v4h-4M21 12a9 9 0 0 1-15.5 6.5L3 16M3 20v-4h4"/>,
    megaphone: <path d="M3 11v2a2 2 0 0 0 2 2h1l4 4V5L6 9H5a2 2 0 0 0-2 2zM14 7a5 5 0 0 1 0 10M17 4a9 9 0 0 1 0 16"/>,
    truck: <><rect x="1" y="7" width="13" height="10" rx="1"/><path d="M14 10h4l3 3v4h-7M5 21a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM21 21a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></>,
    board: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/></>,
    phone: <path d="M22 16.92V21a1 1 0 0 1-1.09 1 19.86 19.86 0 0 1-8.63-3.07 19.52 19.52 0 0 1-6-6A19.86 19.86 0 0 1 3.2 4.09 1 1 0 0 1 4.2 3h4.09a1 1 0 0 1 1 .75 12.31 12.31 0 0 0 .7 2.81 1 1 0 0 1-.23 1.05L8.91 8.91a16 16 0 0 0 6 6l1.3-1.3a1 1 0 0 1 1.05-.23 12.31 12.31 0 0 0 2.81.7 1 1 0 0 1 .75 1z"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    shield: <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6z"/>,
    gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 0 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    trash: <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>,
    edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>,
    check: <path d="M5 13l4 4L19 7"/>,
    alert: <><path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>,
    chevron: <path d="M9 18l6-6-6-6"/>,
    menu: <path d="M3 12h18M3 6h18M3 18h18"/>,
    close: <path d="M6 6l12 12M6 18L18 6"/>,
    map: <path d="M1 6v16l7-3 8 3 7-3V3l-7 3-8-3-7 3z M8 3v16 M16 6v16"/>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name] || null}
    </svg>
  );
};

// ---------- Sidebar ----------
const NAV = [
  { id: 'overview',  label: 'Overview',         icon: 'dashboard' },
  { id: 'profit',    label: 'Profit Calculator',icon: 'calc' },
  { id: 'returns',   label: 'Returns',          icon: 'refresh' },
  { id: 'ads',       label: 'Ads',              icon: 'megaphone' },
  { id: 'delivery',  label: 'Delivery',         icon: 'truck' },
  { id: 'orders',    label: 'Orders',           icon: 'board' },
  { id: 'scripts',   label: 'Call Scripts',     icon: 'phone' },
  { id: 'followups', label: 'Follow-Ups',       icon: 'clock' },
  { id: 'whatsapp',  label: 'WhatsApp',         icon: 'chat' },
  { id: 'agents',    label: 'Agents',           icon: 'users' },
  { id: 'risk',      label: 'Wilaya Risk',      icon: 'shield' },
  { id: 'settings',  label: 'Settings',         icon: 'gear' },
];

function Sidebar({ current, onChange, open, onClose }) {
  return (
    <>
      <div className={cx(
        'fixed inset-0 bg-slate-900/40 lg:hidden transition-opacity z-30',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )} onClick={onClose}/>
      <aside className={cx(
        'fixed lg:static z-40 top-0 left-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">A</div>
          <div className="leading-tight">
            <div className="font-bold text-slate-900">Command Center</div>
            <div className="text-[11px] text-slate-500">Algerian Ecom + Confirm Pro</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => { onChange(n.id); onClose && onClose(); }}
              className={cx(
                'w-full flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition',
                current === n.id
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Icon name={n.icon} className="w-4 h-4"/> {n.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
          <div className="font-semibold text-slate-700">Tip</div>
          Orders older than 24h cost you money. Clear them first.
        </div>
      </aside>
    </>
  );
}

// ---------- TopBar ----------
function TopBar({ title, subtitle, onMenu, right }) {
  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-2 rounded-md hover:bg-slate-100" onClick={onMenu}>
          <Icon name="menu"/>
        </button>
        <div>
          <div className="text-base font-semibold text-slate-900">{title}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

// ---------- Cards / atoms ----------
function Card({ className = '', children }) {
  return <div className={cx('bg-white rounded-xl border border-slate-200 shadow-soft', className)}>{children}</div>;
}
function Section({ title, subtitle, action, children, className }) {
  return (
    <section className={cx('mb-6', className)}>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
function StatCard({ label, value, sub, tone = 'slate', icon }) {
  const toneMap = {
    slate: 'text-slate-900', emerald: 'text-emerald-600',
    amber: 'text-amber-600', rose: 'text-rose-600', sky: 'text-sky-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        {icon && <Icon name={icon} className="w-4 h-4 text-slate-400"/>}
      </div>
      <div className={cx('text-2xl font-bold mt-1 tracking-tight', toneMap[tone])}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
function Badge({ tone = 'slate', children, className }) {
  const tones = {
    slate:   'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    amber:   'bg-amber-50 text-amber-700 border border-amber-100',
    rose:    'bg-rose-50 text-rose-700 border border-rose-100',
    sky:     'bg-sky-50 text-sky-700 border border-sky-100',
    violet:  'bg-violet-50 text-violet-700 border border-violet-100',
  };
  return <span className={cx('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', tones[tone], className)}>{children}</span>;
}

function RiskDot({ level }) {
  const map = { green: 'bg-emerald-500', yellow: 'bg-amber-500', red: 'bg-rose-500' };
  return <span className={cx('inline-block w-2.5 h-2.5 rounded-full', map[level] || 'bg-slate-400')}/>;
}

// ---------- Inputs ----------
function TextInput({ label, value, onChange, type = 'text', placeholder, suffix, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
      <div className="mt-1 flex rounded-lg border border-slate-200 bg-white focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
          className="flex-1 px-3 py-2 bg-transparent outline-none rounded-lg text-sm"
        />
        {suffix && <div className="px-3 py-2 text-xs text-slate-400 border-l border-slate-200">{suffix}</div>}
      </div>
    </label>
  );
}
function Select({ label, value, onChange, options, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      >
        {options.map(o => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
function Textarea({ label, value, onChange, rows = 6, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function Button({ variant = 'primary', size = 'md', onClick, type='button', children, className, disabled }) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'text-xs px-2.5 py-1.5', md: 'text-sm px-3.5 py-2', lg: 'text-sm px-4 py-2.5' };
  const vars = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={cx(base, sizes[size], vars[variant], className)}>{children}</button>;
}

// ---------- Modal ----------
function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start lg:items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div className={cx('bg-white w-full rounded-xl shadow-xl mt-10 lg:mt-0', maxWidth)} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button className="p-1.5 rounded-md hover:bg-slate-100" onClick={onClose}><Icon name="close" className="w-4 h-4"/></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Health gauge ----------
function HealthGauge({ score, color = 'emerald' }) {
  const colorMap = {
    emerald: '#10b981', amber: '#f59e0b', orange: '#fb923c', rose: '#f43f5e',
  };
  const stroke = colorMap[color] || '#10b981';
  const r = 70, c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} stroke="#eef2f7" strokeWidth="14" fill="none"/>
        <circle
          cx="90" cy="90" r={r}
          stroke={stroke} strokeWidth="14" fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset .8s ease' }}
        />
        <text x="90" y="95" textAnchor="middle" fontSize="36" fontWeight="800" fill="#0f172a">{score}</text>
        <text x="90" y="118" textAnchor="middle" fontSize="12" fill="#64748b">/ 100</text>
      </svg>
    </div>
  );
}

// ---------- CopyButton ----------
function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button size="sm" variant="secondary" onClick={async () => {
      try {
        await navigator.clipboard.writeText(text || '');
        setCopied(true); setTimeout(() => setCopied(false), 1500);
      } catch (e) {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text || '';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (_) {}
        ta.remove();
        setCopied(true); setTimeout(() => setCopied(false), 1500);
      }
    }}>
      <Icon name={copied ? 'check' : 'copy'} className="w-3.5 h-3.5"/>
      {copied ? 'Copied' : label}
    </Button>
  );
}

// Pending orders widget (little helper)
function EmptyState({ title, subtitle, icon = 'board', children }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
      <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
        <Icon name={icon}/>
      </div>
      <div className="mt-3 font-semibold text-slate-700">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

window.AppComponents = {
  cx, Icon, NAV,
  Sidebar, TopBar,
  Card, Section, StatCard, Badge, RiskDot,
  TextInput, Select, Textarea, Button,
  Modal, HealthGauge, CopyButton, EmptyState,
};

})();
