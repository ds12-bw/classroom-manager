// Attendance check-in screen — date picker + per-date persisted state via store

function formatThaiDate(iso){
  const d = new Date(iso);
  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()+543}`;
}
function toISODate(d){
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

const Attendance = ({activeClass, setActiveClass, onNav, setActiveStudent}) => {
  const store = window.useStore();
  const cls = store.classes.find(c => c.id === activeClass) || store.classes[0];

  const [date, setDate] = useState(() => toISODate(new Date()));
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  // Roster for this class only
  const roster = useMemo(() => store.students.filter(s => s.classId === cls.id).sort((a,b)=>a.no-b.no), [store.students, cls.id]);

  // Load attendance from store, or default to all present
  const statuses = useMemo(() => {
    const stored = window.getAttendance(cls.id, date);
    if (stored) return stored;
    const init = {};
    const dateNum = new Date(date).getDate() + new Date(date).getMonth()*31;
    roster.forEach((s, i) => {
      const hash = ((parseInt(s.id) * 13 + dateNum * 91 + i * 7) % 100 + 100) % 100;
      init[s.id] = hash < 78 ? "present" : hash < 88 ? "absent" : hash < 94 ? "leave" : "skip";
    });
    return init;
  }, [cls.id, date, roster]);

  const counts = useMemo(() => {
    const c = {present:0, absent:0, leave:0, skip:0};
    roster.forEach(s => { c[statuses[s.id] || "present"]++; });
    return c;
  }, [statuses, roster]);

  const filtered = roster.filter(s => {
    if (filter !== "all" && (statuses[s.id] || "present") !== filter) return false;
    if (query && !(s.name + s.surname + s.nick + s.id).includes(query)) return false;
    return true;
  });

  const setStatus = (sid, status) => {
    const next = {...statuses, [sid]: status};
    window.setAttendanceBulk(cls.id, date, next);
  };

  const setAllPresent = () => {
    const all = {};
    roster.forEach(s => all[s.id] = "present");
    window.setAttendanceBulk(cls.id, date, all);
  };

  // Date stepper
  const shiftDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(toISODate(d));
  };

  return (
    <div className="main fade-in">
      <PageHead title="เช็คชื่อนักเรียน"
        sub={<span><span className="class-chip-sq" style={{display:"inline-block", width:10, height:10, background:cls.color, marginRight:6, verticalAlign:"middle"}}></span>{cls.name} · {cls.room}</span>}
        right={<>
          <button className="btn btn-ghost"><Icon name="qr" size={14}/> ให้นักเรียนสแกน</button>
          <button className="btn btn-primary"><Icon name="check" size={14}/> บันทึก</button>
        </>}
      />

      <div className="page-body" style={{display:"flex", flexDirection:"column", gap:18}}>

        {/* Class selector + date picker row */}
        <div className="row" style={{gap:12, flexWrap:"wrap"}}>
          <div className="row" style={{gap:8, flexWrap:"wrap", flex:1}}>
            {store.classes.map(c => (
              <button key={c.id} className="class-chip"
                onClick={()=>setActiveClass(c.id)}
                style={{cursor:"pointer", borderColor: c.id===cls.id ? c.color : "var(--line)", boxShadow: c.id===cls.id ? `0 0 0 2px ${c.color}30` : "none", background: c.id===cls.id ? "#fff" : "var(--bg-2)"}}>
                <span className="class-chip-sq" style={{background:c.color}}></span>
                {c.name}
              </button>
            ))}
          </div>

          <div className="row" style={{gap:6, background:"#fff", padding:6, borderRadius:12, border:"1px solid var(--line)"}}>
            <button className="btn btn-ghost" style={{padding:"6px 10px"}} onClick={()=>shiftDate(-1)} aria-label="วันก่อนหน้า">
              <Icon name="arrowLeft" size={14}/>
            </button>
            <div style={{position:"relative", padding:"6px 12px", textAlign:"center", minWidth:170}}>
              <div className="bold text-sm" style={{whiteSpace:"nowrap"}}>{formatThaiDate(date)}</div>
              <div className="muted text-sm">{["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"][new Date(date).getDay()]}</div>
              <input type="date" value={date}
                onChange={e=>setDate(e.target.value)}
                style={{position:"absolute", inset:0, opacity:0, cursor:"pointer", width:"100%"}}/>
            </div>
            <button className="btn btn-ghost" style={{padding:"6px 10px"}} onClick={()=>shiftDate(1)} aria-label="วันถัดไป">
              <Icon name="arrowRight" size={14}/>
            </button>
            <button className="btn btn-soft" style={{padding:"6px 10px"}} onClick={()=>setDate(toISODate(new Date()))}>วันนี้</button>
          </div>
        </div>

        {/* Stats + filters */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12}}>
          {[
            {k:"present", count:counts.present, label:"มาเรียน"},
            {k:"absent",  count:counts.absent,  label:"ขาด"},
            {k:"leave",   count:counts.leave,   label:"ลา"},
            {k:"skip",    count:counts.skip,    label:"หนี"},
          ].map(s => {
            const st = window.ATT_STATUS[s.k];
            const active = filter===s.k;
            return (
              <button key={s.k} className="card" style={{textAlign:"left", padding:16, cursor:"pointer", borderColor: active ? st.color : "var(--line)", boxShadow: active ? `0 0 0 2px ${st.color}20` : "none"}}
                onClick={()=>setFilter(active ? "all" : s.k)}>
                <div className="row" style={{gap:10}}>
                  <div style={{width:36, height:36, borderRadius:10, background:st.bg, color:st.color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700}}>{st.letter}</div>
                  <div>
                    <div className="num bold" style={{fontSize:22}}>{s.count}</div>
                    <div className="muted text-sm">{s.label}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="row">
          <SearchBox value={query} onChange={setQuery} placeholder="ค้นหาชื่อ / ชื่อเล่น / รหัส" />
          <div className="tgrp">
            <button className={filter==="all" ? "on" : ""} onClick={()=>setFilter("all")}>ทั้งหมด</button>
            <button className={filter==="present" ? "on" : ""} onClick={()=>setFilter("present")}>มา</button>
            <button className={filter==="absent" ? "on" : ""} onClick={()=>setFilter("absent")}>ขาด</button>
            <button className={filter==="leave" ? "on" : ""} onClick={()=>setFilter("leave")}>ลา</button>
            <button className={filter==="skip" ? "on" : ""} onClick={()=>setFilter("skip")}>หนี</button>
          </div>
          <div className="spacer"></div>
          <button className="btn btn-ghost" onClick={setAllPresent}>มาทั้งหมด</button>
        </div>

        {/* Student grid */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10}}>
          {filtered.map(s => {
            const status = statuses[s.id] || "present";
            const stMeta = window.ATT_STATUS[status];
            return (
              <div key={s.id} className="card" style={{padding:12, display:"flex", gap:12, alignItems:"center", borderLeft:`3px solid ${stMeta.color}`}}>
                <button onClick={()=>{ setActiveStudent(s.id); onNav("student"); }} style={{display:"flex", alignItems:"center", gap:10, flex:1, textAlign:"left", minWidth:0}}>
                  <Avatar color={s.avatar} label={s.nick.slice(0,1)} />
                  <div style={{minWidth:0, flex:1}}>
                    <div className="bold text-sm" style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                      <span className="num muted" style={{marginRight:6}}>{s.no}.</span>
                      {s.name} {s.surname} <span className="muted">({s.nick})</span>
                    </div>
                    <div className="muted text-sm num">{s.id}</div>
                  </div>
                </button>
                <div className="tgrp" style={{padding:2, background:"#F3EFE7"}}>
                  {["present","absent","leave","skip"].map(k => {
                    const sm = window.ATT_STATUS[k];
                    const on = status===k;
                    return (
                      <button key={k} title={sm.label}
                        onClick={()=>setStatus(s.id, k)}
                        style={{
                          width:28, height:28, borderRadius:7, fontWeight:700,
                          background: on ? sm.color : "transparent",
                          color: on ? "#fff" : sm.color,
                          fontSize:13
                        }}>
                        {sm.letter}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

// Classes overview + management screen — edit / add / remove / import
const Classes = ({onNav, setActiveClass, onImport, onImportClasses}) => {
  const store = window.useStore();
  const [editing, setEditing] = useState(null); // class object or null
  const [adding, setAdding] = useState(false);

  return (
    <div className="main fade-in">
      <PageHead title="ห้องเรียนของฉัน" sub={`${store.classes.length} ห้อง · ภาคเรียนที่ 1/2569 · คลิกการ์ดเพื่อแก้ไข`}
        right={<>
          <button className="btn btn-ghost" onClick={onImport}><Icon name="download" size={14}/> Import นักเรียน</button>
          <button className="btn btn-ghost" onClick={onImportClasses}><Icon name="download" size={14}/> Import ห้องเรียน</button>
          <button className="btn btn-primary" onClick={()=>setAdding(true)}><Icon name="plus" size={14}/> เพิ่มห้องเรียน</button>
        </>}
      />
      <div className="page-body">
        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:16}}>
          {store.classes.map(cls => (
            <div key={cls.id} className="card card-pad-lg" style={{position:"relative"}}>
              <div style={{height:90, borderRadius:12, background:`linear-gradient(135deg, ${cls.color} 0%, ${cls.color}cc 100%)`, marginBottom:14, display:"flex", alignItems:"flex-end", padding:14, justifyContent:"space-between"}}>
                <div style={{color:"#fff", minWidth:0}}>
                  <div className="num bold" style={{fontSize:22, whiteSpace:"nowrap"}}>{cls.code}</div>
                  <div className="text-sm" style={{opacity:.9, whiteSpace:"nowrap"}}>{cls.time}</div>
                </div>
                <button onClick={()=>setEditing(cls)}
                  style={{background:"rgba(255,255,255,.25)", color:"#fff", borderRadius:8, padding:"4px 8px", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:4}}>
                  <Icon name="edit" size={12}/> แก้ไข
                </button>
              </div>
              <div className="bold text-lg">{cls.name}</div>
              <div className="muted text-sm" style={{marginBottom:14}}>{cls.room} · {cls.students} คน</div>
              <div className="row" style={{gap:8}}>
                <button className="btn btn-soft" style={{flex:1}} onClick={()=>{ setActiveClass(cls.id); onNav("attendance"); }}><Icon name="check" size={12}/> เช็คชื่อ</button>
                <button className="btn btn-ghost" style={{flex:1}} onClick={()=>{ setActiveClass(cls.id); onNav("gradebook"); }}><Icon name="chart" size={12}/> คะแนน</button>
              </div>
              <div className="row" style={{gap:8, marginTop:8}}>
                <button className="btn btn-ghost" style={{flex:1, justifyContent:"center"}}
                  onClick={()=>{ setActiveClass(cls.id); onNav("roster"); }}>
                  <Icon name="user" size={12}/> รายชื่อ ({cls.students})
                </button>
                <button className="btn btn-ghost" style={{flex:1, justifyContent:"center"}}
                  onClick={()=>{ setActiveClass(cls.id); onNav("notes"); }}>
                  <Icon name="edit" size={12}/> บันทึก ({(store.notes[cls.id] || []).length})
                </button>
              </div>
            </div>
          ))}

          {/* Add card */}
          <button onClick={()=>setAdding(true)} className="card card-pad-lg"
            style={{borderStyle:"dashed", borderColor:"var(--line-2)", background:"transparent", color:"var(--ink-3)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:240, cursor:"pointer"}}>
            <div style={{width:54, height:54, borderRadius:14, background:"var(--primary-soft)", color:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10}}>
              <Icon name="plus" size={24}/>
            </div>
            <div className="bold">เพิ่มห้องเรียนใหม่</div>
            <div className="text-sm" style={{marginTop:4}}>หรือ Import จากไฟล์ Excel</div>
          </button>
        </div>
      </div>

      {(editing || adding) && (
        <ClassEditModal
          cls={editing}
          isNew={adding}
          onClose={()=>{ setEditing(null); setAdding(false); }}
        />
      )}
    </div>
  );
};

// Edit / Create class modal
const ClassEditModal = ({cls, isNew, onClose}) => {
  const [draft, setDraft] = useState(cls || {
    name: "", code: "", room: "", time: "", color: window.CLASS_COLORS[0], students: 0
  });
  const valid = draft.name.trim() && draft.code.trim();

  const save = () => {
    if (!valid) return;
    if (isNew) window.addClass(draft);
    else window.updateClass(cls.id, draft);
    onClose();
  };
  const del = () => {
    if (confirm(`ลบห้อง "${cls.name}"?`)){
      window.removeClass(cls.id);
      onClose();
    }
  };

  const set = (k, v) => setDraft(d => ({...d, [k]: v}));

  return (
    <div style={{position:"fixed", inset:0, background:"rgba(28,25,46,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:24}}>
      <div className="card card-pad-lg" style={{width:560, maxWidth:"100%", padding:0}}>
        <div style={{padding:"20px 24px", borderBottom:"1px solid var(--line)"}}>
          <div className="bold text-lg">{isNew ? "เพิ่มห้องเรียนใหม่" : `แก้ไข ${cls.name}`}</div>
          <div className="muted text-sm">{isNew ? "กรอกข้อมูลห้องเรียน" : "เปลี่ยนแล้วจะอัปเดตในทุกหน้าทันที"}</div>
        </div>

        {/* Preview */}
        <div style={{padding:24, paddingBottom:0}}>
          <div style={{height:80, borderRadius:12, background:`linear-gradient(135deg, ${draft.color} 0%, ${draft.color}cc 100%)`, display:"flex", alignItems:"flex-end", padding:14, marginBottom:18}}>
            <div style={{color:"#fff"}}>
              <div className="num bold" style={{fontSize:20}}>{draft.code || "CLS-???"}</div>
              <div className="text-sm" style={{opacity:.9}}>{draft.time || "เวลา"} · {draft.room || "ห้อง"}</div>
            </div>
          </div>
        </div>

        <div style={{padding:"0 24px 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
          <div style={{gridColumn:"span 2"}}>
            <div className="text-sm muted" style={{marginBottom:4}}>ชื่อห้องเรียน *</div>
            <input className="input" autoFocus value={draft.name} onChange={e=>set("name", e.target.value)}
              placeholder="เช่น คณิตศาสตร์ ม.4/1" style={{width:"100%"}}/>
          </div>
          <div>
            <div className="text-sm muted" style={{marginBottom:4}}>รหัสวิชา *</div>
            <input className="input num" value={draft.code} onChange={e=>set("code", e.target.value)}
              placeholder="เช่น MATH-401" style={{width:"100%"}}/>
          </div>
          <div>
            <div className="text-sm muted" style={{marginBottom:4}}>จำนวนนักเรียน</div>
            <input className="input num" type="number" min={0} value={draft.students} onChange={e=>set("students", parseInt(e.target.value)||0)}
              style={{width:"100%"}}/>
          </div>
          <div>
            <div className="text-sm muted" style={{marginBottom:4}}>ห้อง</div>
            <input className="input" value={draft.room} onChange={e=>set("room", e.target.value)}
              placeholder="เช่น ห้อง 312" style={{width:"100%"}}/>
          </div>
          <div>
            <div className="text-sm muted" style={{marginBottom:4}}>เวลา</div>
            <input className="input" value={draft.time} onChange={e=>set("time", e.target.value)}
              placeholder="เช่น 08:30 - 09:20" style={{width:"100%"}}/>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <div className="text-sm muted" style={{marginBottom:6}}>สี</div>
            <div className="row" style={{gap:8, flexWrap:"wrap"}}>
              {window.CLASS_COLORS.map(c => (
                <button key={c} onClick={()=>set("color", c)}
                  style={{
                    width:32, height:32, borderRadius:10, background:c,
                    border: draft.color===c ? "3px solid #fff" : "2px solid transparent",
                    boxShadow: draft.color===c ? `0 0 0 2px ${c}` : "none",
                    cursor:"pointer"
                  }}/>
              ))}
            </div>
          </div>
        </div>

        <div style={{padding:"14px 24px", borderTop:"1px solid var(--line)", display:"flex", justifyContent:"space-between", gap:10}}>
          <div>
            {!isNew && <button className="btn btn-ghost" onClick={del} style={{color:"#EF4444"}}>ลบห้องเรียน</button>}
          </div>
          <div className="row" style={{gap:10}}>
            <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={save} disabled={!valid}>
              <Icon name="check" size={14}/> {isNew ? "เพิ่มห้อง" : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {Attendance, Classes, ClassEditModal, formatThaiDate, toISODate});

// ---------- Roster (manage students per class) ----------
const Roster = ({activeClass, setActiveClass, onNav, setActiveStudent, onImportStudents}) => {
  const store = window.useStore();
  const cls = store.classes.find(c => c.id === activeClass) || store.classes[0];
  const roster = useMemo(() => store.students.filter(s => s.classId === cls.id).sort((a,b)=>a.no-b.no), [store.students, cls.id]);

  const [adding, setAdding] = useState(false);
  const [draftNew, setDraftNew] = useState({prefix:"เด็กชาย", name:"", surname:"", nick:"", id:""});
  const [editingId, setEditingId] = useState(null);

  const submitNew = () => {
    if (!draftNew.name.trim()) return;
    window.addStudent({...draftNew, classId: cls.id});
    setDraftNew({prefix:"เด็กชาย", name:"", surname:"", nick:"", id:""});
    setAdding(false);
  };

  const removeStudent = (sid, name) => {
    if (confirm(`ลบ ${name} ออกจากห้อง?`)) window.removeStudent(sid);
  };

  return (
    <div className="main fade-in">
      <PageHead
        title="จัดการรายชื่อนักเรียน"
        sub={<span><span className="class-chip-sq" style={{display:"inline-block", width:10, height:10, background:cls.color, marginRight:6, verticalAlign:"middle"}}></span>{cls.name} · {cls.room} · {roster.length} คน</span>}
        right={<>
          <button className="btn btn-ghost" onClick={()=>onImportStudents(cls.id)}><Icon name="download" size={14}/> Import นักเรียน</button>
          <button className="btn btn-primary" onClick={()=>setAdding(true)}><Icon name="plus" size={14}/> เพิ่มนักเรียน</button>
        </>}
      />

      <div className="page-body" style={{display:"flex", flexDirection:"column", gap:18}}>

        {/* Class selector */}
        <div className="row" style={{gap:8, flexWrap:"wrap"}}>
          {store.classes.map(c => (
            <button key={c.id} className="class-chip"
              onClick={()=>setActiveClass(c.id)}
              style={{cursor:"pointer", borderColor: c.id===cls.id ? c.color : "var(--line)", boxShadow: c.id===cls.id ? `0 0 0 2px ${c.color}30` : "none", background: c.id===cls.id ? "#fff" : "var(--bg-2)"}}>
              <span className="class-chip-sq" style={{background:c.color}}></span>
              {c.name} <span className="muted">({store.students.filter(s=>s.classId===c.id).length})</span>
            </button>
          ))}
        </div>

        {/* Add new student form */}
        {adding && (
          <div className="card card-pad-lg" style={{background:"linear-gradient(135deg, #EEF0FF 0%, #FCE7F3 100%)", border:"none"}}>
            <div className="row" style={{justifyContent:"space-between", marginBottom:12}}>
              <div className="bold text-lg">เพิ่มนักเรียนใหม่</div>
              <button className="btn btn-ghost" onClick={()=>setAdding(false)} style={{padding:"4px 10px"}}>ยกเลิก</button>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"100px 130px 100px 1fr 1fr 100px auto", gap:10, alignItems:"end"}}>
              <div>
                <div className="text-sm muted" style={{marginBottom:3}}>เลขที่</div>
                <input className="input num" type="number" placeholder={roster.length+1+""} style={{width:"100%"}}
                  onChange={e=>setDraftNew(d=>({...d, no: parseInt(e.target.value)||undefined}))}/>
              </div>
              <div>
                <div className="text-sm muted" style={{marginBottom:3}}>รหัส</div>
                <input className="input num" placeholder="auto" value={draftNew.id} style={{width:"100%"}}
                  onChange={e=>setDraftNew(d=>({...d, id: e.target.value}))}/>
              </div>
              <div>
                <div className="text-sm muted" style={{marginBottom:3}}>คำนำหน้า</div>
                <select className="input" value={draftNew.prefix} style={{width:"100%"}}
                  onChange={e=>setDraftNew(d=>({...d, prefix: e.target.value}))}>
                  {window.PREFIX_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <div className="text-sm muted" style={{marginBottom:3}}>ชื่อ *</div>
                <input className="input" autoFocus value={draftNew.name} style={{width:"100%"}}
                  onChange={e=>setDraftNew(d=>({...d, name: e.target.value}))}
                  onKeyDown={e=>e.key==="Enter" && submitNew()}/>
              </div>
              <div>
                <div className="text-sm muted" style={{marginBottom:3}}>สกุล</div>
                <input className="input" value={draftNew.surname} style={{width:"100%"}}
                  onChange={e=>setDraftNew(d=>({...d, surname: e.target.value}))}
                  onKeyDown={e=>e.key==="Enter" && submitNew()}/>
              </div>
              <div>
                <div className="text-sm muted" style={{marginBottom:3}}>ชื่อเล่น</div>
                <input className="input" value={draftNew.nick} style={{width:"100%"}}
                  onChange={e=>setDraftNew(d=>({...d, nick: e.target.value}))}
                  onKeyDown={e=>e.key==="Enter" && submitNew()}/>
              </div>
              <button className="btn btn-primary" onClick={submitNew} disabled={!draftNew.name.trim()}>
                <Icon name="check" size={14}/> เพิ่ม
              </button>
            </div>
          </div>
        )}

        {/* Roster table */}
        <div className="card" style={{padding:0, overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{width:60}}>เลขที่</th>
                  <th style={{width:110}}>รหัส</th>
                  <th style={{width:110}}>คำนำหน้า</th>
                  <th>ชื่อ</th>
                  <th>สกุล</th>
                  <th>ชื่อเล่น</th>
                  <th style={{width:90}}></th>
                </tr>
              </thead>
              <tbody>
                {roster.length === 0 && (
                  <tr><td colSpan={7} style={{padding:40, textAlign:"center"}}>
                    <div className="muted">ยังไม่มีนักเรียนในห้องนี้</div>
                    <div className="row" style={{justifyContent:"center", gap:8, marginTop:12}}>
                      <button className="btn btn-soft" onClick={()=>setAdding(true)}><Icon name="plus" size={12}/> เพิ่มทีละคน</button>
                      <button className="btn btn-soft" onClick={()=>onImportStudents(cls.id)}><Icon name="download" size={12}/> Import จาก Excel</button>
                    </div>
                  </td></tr>
                )}
                {roster.map(s => {
                  const isEdit = editingId === s.id;
                  if (isEdit){
                    return (
                      <tr key={s.id} style={{background:"#FBF9F4"}}>
                        <td style={{padding:6}}>
                          <input className="input num" type="number" value={s.no} style={{width:60, padding:"6px 8px"}}
                            onChange={e=>window.updateStudent(s.id, {no: parseInt(e.target.value)||1})}/>
                        </td>
                        <td style={{padding:6}}>
                          <input className="input num" value={s.id} style={{width:"100%", padding:"6px 8px"}}
                            onChange={e=>window.updateStudent(s.id, {id: e.target.value})}/>
                        </td>
                        <td style={{padding:6}}>
                          <select className="input" value={s.prefix} style={{width:"100%", padding:"6px 8px"}}
                            onChange={e=>window.updateStudent(s.id, {prefix: e.target.value})}>
                            {window.PREFIX_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td style={{padding:6}}><input className="input" value={s.name} style={{width:"100%", padding:"6px 8px"}} onChange={e=>window.updateStudent(s.id, {name: e.target.value})}/></td>
                        <td style={{padding:6}}><input className="input" value={s.surname} style={{width:"100%", padding:"6px 8px"}} onChange={e=>window.updateStudent(s.id, {surname: e.target.value})}/></td>
                        <td style={{padding:6}}><input className="input" value={s.nick} style={{width:"100%", padding:"6px 8px"}} onChange={e=>window.updateStudent(s.id, {nick: e.target.value})}/></td>
                        <td style={{padding:6, textAlign:"right"}}>
                          <button className="btn btn-primary" style={{padding:"6px 10px"}} onClick={()=>setEditingId(null)}>เสร็จ</button>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={s.id}>
                      <td className="num">{s.no}</td>
                      <td className="num">{s.id}</td>
                      <td>{s.prefix}</td>
                      <td>{s.name}</td>
                      <td>{s.surname}</td>
                      <td>{s.nick}</td>
                      <td style={{textAlign:"right"}}>
                        <div className="row" style={{justifyContent:"flex-end", gap:4}}>
                          <button onClick={()=>{ setActiveStudent(s.id); onNav("student"); }} title="ดูรายละเอียด"
                            style={{padding:6, color:"var(--ink-3)"}}><Icon name="user" size={14}/></button>
                          <button onClick={()=>setEditingId(s.id)} title="แก้ไข"
                            style={{padding:6, color:"var(--primary)"}}><Icon name="edit" size={14}/></button>
                          <button onClick={()=>removeStudent(s.id, `${s.name} ${s.surname}`)} title="ลบ"
                            style={{padding:6, color:"#EF4444", fontWeight:700, fontSize:16, lineHeight:1}}>×</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

Object.assign(window, {Roster});
