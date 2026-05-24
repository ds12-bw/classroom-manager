// Shared UI components for classroom manager
const { useState, useMemo, useEffect, useRef } = React;

// ---------- Icons (simple line SVGs) ----------
const Icon = ({name, size=16, stroke=1.6}) => {
  const paths = {
    home: <><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    check: <><path d="M3 12l3.5 3.5L13 7"/><path d="M11 17l3 3 7-10"/></>,
    chart: <><path d="M3 21V8"/><path d="M9 21V12"/><path d="M15 21V4"/><path d="M21 21V15"/></>,
    cal: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/></>,
    qr: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M20 14h1v1h-1z"/><path d="M14 20h1v1h-1z"/><path d="M17 17h4v4h-4z" opacity=".4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    arrowRight: <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    arrowLeft: <><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></>,
    download: <><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></>,
    bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M14 21a2 2 0 0 1-4 0"/></>,
    file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></>,
    print: <><path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/></>,
    chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4z"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    book: <><path d="M4 4v16a2 2 0 0 0 2 2h14V2H6a2 2 0 0 0-2 2z"/><path d="M8 6h10"/><path d="M8 10h10"/></>,
    bolt: <><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></>,
    share: <><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.6 10.6l6.8-3.2"/><path d="M8.6 13.4l6.8 3.2"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.9 4.9l1.4 1.4"/><path d="M17.7 17.7l1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.9 19.1l1.4-1.4"/><path d="M17.7 6.3l1.4-1.4"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

// ---------- Sidebar / TopNav ----------
const NAV_ITEMS = [
  {id:"dashboard", label:"แดชบอร์ด", icon:"home"},
  {id:"classes",   label:"ห้องเรียน", icon:"grid"},
  {id:"attendance",label:"เช็คชื่อ", icon:"check"},
  {id:"gradebook", label:"คะแนน", icon:"chart"},
  {id:"notes",     label:"บันทึกห้อง", icon:"edit"},
  {id:"schedule",  label:"ตารางสอน", icon:"cal"},
  {id:"qr",        label:"QR สำหรับนักเรียน", icon:"qr"},
];

const Sidebar = ({active, onNav}) => (
  <aside className="sidebar">
    <div className="sb-brand">
      <div className="sb-logo">ค</div>
      <div>
        <div className="sb-brand-name">ครูดิจิทัล</div>
        <div className="sb-brand-sub">classroom companion</div>
      </div>
    </div>
    <div className="sb-section">เมนูหลัก</div>
    {NAV_ITEMS.map(item => (
      <button key={item.id}
        className={"sb-item" + (active===item.id ? " active" : "")}
        onClick={() => onNav(item.id)}>
        <span className="sb-ico"><Icon name={item.icon} size={14} /></span>
        <span>{item.label}</span>
      </button>
    ))}
    <div className="sb-foot">
      <div style={{flex:1, minWidth:0}}>
        <div className="avatar" style={{background:"#C7D2FE", marginBottom:10}}>อน</div>
        <div className="bold text-sm" style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>อ.อาหมัดนาวาวี</div>
        <div className="muted text-sm">ครูคณิตศาสตร์</div>
      </div>
      <button
        onClick={() => { window.logoutTeacher(); window.location.reload(); }}
        className="btn btn-ghost"
        style={{padding:"6px 8px", minWidth:0}}>
        <Icon name="logOut" size={16}/>
      </button>
    </div>
  </aside>
);

const TopNav = ({active, onNav}) => (
  <div className="topbar">
    <div className="row" style={{gap:10}}>
      <div className="sb-logo">ค</div>
      <div className="bold">ครูดิจิทัล</div>
    </div>
    <div className="topbar-nav">
      {NAV_ITEMS.map(item => (
        <button key={item.id}
          className={"sb-item" + (active===item.id ? " active" : "")}
          onClick={() => onNav(item.id)}>
          <span className="sb-ico"><Icon name={item.icon} size={12} /></span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
    <div className="row" style={{gap:10}}>
      <button className="btn btn-ghost" style={{padding:"8px 10px"}}><Icon name="bell" size={14}/></button>
      <div className="avatar" style={{width:32, height:32, background:"#C7D2FE"}}>อจ</div>
    </div>
  </div>
);

// ---------- Common bits ----------
const PageHead = ({title, sub, right}) => (
  <div className="page-head">
    <div>
      <h1 className="page-title">{title}</h1>
      {sub && <div className="page-sub">{sub}</div>}
    </div>
    {right && <div className="row" style={{gap:10}}>{right}</div>}
  </div>
);

const Stat = ({label, value, foot, icon, tone="primary"}) => {
  const tones = {
    primary: ["#EEF0FF", "#4F46E5"],
    green:   ["#D1FAE5", "#10B981"],
    orange:  ["#FFEDD5", "#F97316"],
    pink:    ["#FCE7F3", "#EC4899"],
    cyan:    ["#CFFAFE", "#06B6D4"],
  };
  const [bg, fg] = tones[tone] || tones.primary;
  return (
    <div className="stat">
      <div className="stat-pill" style={{background:bg, color:fg}}><Icon name={icon} size={16}/></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{foot}</div>
    </div>
  );
};

const Avatar = ({color, label, size=32}) => (
  <div className="avatar" style={{background:color, width:size, height:size, fontSize: Math.max(11, size*0.4)}}>{label}</div>
);

const AttPill = ({status}) => {
  const s = window.ATT_STATUS[status];
  return (
    <span className="att-pill" style={{background:s.bg, color:s.color}}>
      <span className="att-dot" style={{background:s.color}}></span>
      {s.label}
    </span>
  );
};

const ClassChip = ({cls}) => (
  <span className="class-chip">
    <span className="class-chip-sq" style={{background: cls.color}}></span>
    {cls.name}
  </span>
);

const Bar = ({value, max, color="#4F46E5"}) => (
  <div className="bar">
    <div style={{width: Math.min(100, (value/max)*100)+"%", background:color}}></div>
  </div>
);

// ---------- Search box ----------
const SearchBox = ({placeholder="ค้นหา...", value, onChange}) => (
  <div className="search">
    <Icon name="search" size={14} />
    <input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}/>
  </div>
);

Object.assign(window, {Icon, Sidebar, TopNav, PageHead, Stat, Avatar, AttPill, ClassChip, Bar, SearchBox, NAV_ITEMS});
