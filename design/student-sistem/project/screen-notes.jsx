// Class notes / journal screen

const NOTE_KINDS = {
  note:       {label:"บันทึก",  color:"#6B7280", bg:"#F3F4F6", icon:"edit"},
  assignment: {label:"การบ้าน", color:"#4F46E5", bg:"#EEF0FF", icon:"file"},
  announce:   {label:"ประกาศ",  color:"#F59E0B", bg:"#FEF3C7", icon:"bell"},
  exam:       {label:"สอบ",     color:"#EF4444", bg:"#FEE2E2", icon:"chart"},
};

function relativeTime(ts){
  const diff = Date.now() - ts;
  const mins = Math.floor(diff/60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  const days = Math.floor(hrs/24);
  if (days < 7) return `${days} วันที่แล้ว`;
  const d = new Date(ts);
  const months = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()+543}`;
}

function formatDueDate(iso){
  if (!iso) return null;
  const d = new Date(iso);
  const months = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()+543}`;
}

function dueDateStatus(iso){
  if (!iso) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(iso); due.setHours(0,0,0,0);
  const diffDays = Math.round((due - today)/86400000);
  if (diffDays < 0) return {tone:"overdue", label:"เลยกำหนด " + (-diffDays) + " วัน", color:"#EF4444"};
  if (diffDays === 0) return {tone:"today", label:"ส่งวันนี้", color:"#F59E0B"};
  if (diffDays <= 3) return {tone:"soon", label:`อีก ${diffDays} วัน`, color:"#F97316"};
  if (diffDays <= 7) return {tone:"week", label:`อีก ${diffDays} วัน`, color:"#0EA5E9"};
  return {tone:"later", label:`อีก ${diffDays} วัน`, color:"#10B981"};
}

const ClassNotes = ({activeClass, setActiveClass}) => {
  const store = window.useStore();
  const cls = store.classes.find(c => c.id === activeClass) || store.classes[0];
  const allNotes = store.notes[cls.id] || [];

  const [text, setText] = useState("");
  const [kind, setKind] = useState("assignment");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("all"); // all | assignment | announce | exam | note
  const textRef = useRef(null);

  // Sort: pinned first, then by createdAt desc
  const sorted = useMemo(() => [...allNotes].sort((a,b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt - a.createdAt;
  }), [allNotes]);

  const filtered = filter === "all" ? sorted : sorted.filter(n => n.kind === filter);

  const counts = useMemo(() => {
    const c = {all: allNotes.length, assignment:0, announce:0, exam:0, note:0};
    allNotes.forEach(n => { c[n.kind] = (c[n.kind]||0) + 1; });
    return c;
  }, [allNotes]);

  const submit = () => {
    if (!text.trim()) return;
    window.addNote(cls.id, {text: text.trim(), kind, dueDate: dueDate || null});
    setText("");
    setDueDate("");
    setTimeout(() => textRef.current?.focus(), 50);
  };

  return (
    <div className="main fade-in">
      <PageHead title="บันทึกห้องเรียน"
        sub={<span><span className="class-chip-sq" style={{display:"inline-block", width:10, height:10, background:cls.color, marginRight:6, verticalAlign:"middle"}}></span>{cls.name} · บันทึกการบ้าน ประกาศ และข้อความสำคัญ</span>}
      />

      <div className="page-body" style={{display:"flex", flexDirection:"column", gap:18}}>

        {/* Class selector */}
        <div className="row" style={{gap:8, flexWrap:"wrap"}}>
          {store.classes.map(c => {
            const ncount = (store.notes[c.id] || []).length;
            return (
              <button key={c.id} className="class-chip"
                onClick={()=>setActiveClass(c.id)}
                style={{cursor:"pointer", borderColor: c.id===cls.id ? c.color : "var(--line)", boxShadow: c.id===cls.id ? `0 0 0 2px ${c.color}30` : "none", background: c.id===cls.id ? "#fff" : "var(--bg-2)"}}>
                <span className="class-chip-sq" style={{background:c.color}}></span>
                {c.name}
                {ncount > 0 && <span className="muted">({ncount})</span>}
              </button>
            );
          })}
        </div>

        {/* Compose */}
        <div className="card card-pad-lg">
          <div className="bold" style={{marginBottom:10}}>บันทึกใหม่</div>
          <textarea ref={textRef} className="input" rows={3}
            placeholder="เช่น ให้การบ้านบทที่ 3 ส่งวันที่ 11/11/2569 ห้อง 312..."
            value={text}
            onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if((e.key==="Enter") && (e.metaKey || e.ctrlKey)) submit(); }}
            style={{width:"100%", resize:"vertical", fontFamily:"inherit", fontSize:14}}/>
          <div className="row" style={{marginTop:12, gap:14, alignItems:"flex-end", flexWrap:"wrap"}}>
            <div>
              <div className="text-sm muted" style={{marginBottom:4}}>ประเภท</div>
              <div className="row" style={{gap:6}}>
                {Object.entries(NOTE_KINDS).map(([k, meta]) => (
                  <button key={k} onClick={()=>setKind(k)}
                    style={{
                      padding:"6px 12px", borderRadius:8, fontWeight:600, fontSize:12,
                      background: kind===k ? meta.color : meta.bg,
                      color: kind===k ? "#fff" : meta.color,
                      border: kind===k ? `1px solid ${meta.color}` : "1px solid transparent",
                      cursor:"pointer", display:"flex", alignItems:"center", gap:5
                    }}>
                    <Icon name={meta.icon} size={11}/>
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm muted" style={{marginBottom:4}}>วันส่ง / กำหนด (ถ้ามี)</div>
              <input type="date" className="input" value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
            </div>
            <div className="spacer"></div>
            <div className="muted text-sm" style={{paddingBottom:9}}>Cmd / Ctrl + Enter เพื่อบันทึก</div>
            <button className="btn btn-primary" onClick={submit} disabled={!text.trim()}>
              <Icon name="check" size={14}/> เพิ่มบันทึก
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="row" style={{gap:6, flexWrap:"wrap"}}>
          {[{k:"all", label:"ทั้งหมด"}, ...Object.entries(NOTE_KINDS).map(([k, m])=>({k, label:m.label}))].map(({k, label}) => (
            <button key={k} onClick={()=>setFilter(k)}
              style={{
                padding:"6px 14px", borderRadius:999, fontWeight:600, fontSize:12,
                background: filter===k ? "var(--primary)" : "#fff",
                color: filter===k ? "#fff" : "var(--ink-2)",
                border: "1px solid " + (filter===k ? "var(--primary)" : "var(--line)"),
                cursor:"pointer"
              }}>
              {label}
              <span style={{marginLeft:5, opacity:.8}}>{k==="all" ? counts.all : (counts[k]||0)}</span>
            </button>
          ))}
        </div>

        {/* Notes list */}
        <div className="col" style={{gap:10}}>
          {filtered.length === 0 && (
            <div className="card card-pad-lg" style={{textAlign:"center", color:"var(--ink-3)"}}>
              <Icon name="edit" size={32}/>
              <div style={{marginTop:10}}>ยังไม่มีบันทึก{filter !== "all" && "ประเภทนี้"}ในห้องนี้</div>
              <div className="text-sm">เริ่มจดงาน ประกาศ หรือบันทึกความเห็นด้านบนได้เลย</div>
            </div>
          )}
          {filtered.map(n => <NoteCard key={n.id} note={n} classId={cls.id}/>)}
        </div>

      </div>
    </div>
  );
};

const NoteCard = ({note, classId}) => {
  const meta = NOTE_KINDS[note.kind] || NOTE_KINDS.note;
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(note.text);
  const [draftDue, setDraftDue] = useState(note.dueDate || "");
  const due = dueDateStatus(note.dueDate);

  const save = () => {
    window.updateNote(classId, note.id, {text: draftText.trim(), dueDate: draftDue || null});
    setEditing(false);
  };
  const remove = () => {
    if (confirm("ลบบันทึกนี้?")) window.removeNote(classId, note.id);
  };

  if (editing){
    return (
      <div className="card" style={{borderLeft:`4px solid ${meta.color}`, padding:16, background:meta.bg + "40"}}>
        <textarea className="input" rows={3} value={draftText} onChange={e=>setDraftText(e.target.value)}
          style={{width:"100%", fontFamily:"inherit", fontSize:14, resize:"vertical"}}/>
        <div className="row" style={{marginTop:10, gap:10}}>
          <div>
            <div className="text-sm muted" style={{marginBottom:4}}>วันส่ง / กำหนด</div>
            <input type="date" className="input" value={draftDue} onChange={e=>setDraftDue(e.target.value)}/>
          </div>
          <div className="spacer"></div>
          <button className="btn btn-ghost" onClick={()=>{ setEditing(false); setDraftText(note.text); setDraftDue(note.dueDate || ""); }}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={save}><Icon name="check" size={14}/> บันทึก</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{borderLeft:`4px solid ${meta.color}`, padding:16, position:"relative"}}>
      <div className="row" style={{gap:12, alignItems:"flex-start"}}>
        <div style={{width:36, height:36, borderRadius:10, background:meta.bg, color:meta.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
          <Icon name={meta.icon} size={16}/>
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div className="row" style={{gap:8, marginBottom:6, flexWrap:"wrap"}}>
            <span className="badge" style={{background:meta.bg, color:meta.color}}>{meta.label}</span>
            {note.pinned && <span className="badge" style={{background:"#FEF3C7", color:"#92400E"}}>📌 ปักหมุด</span>}
            {due && <span className="badge" style={{background:due.color+"20", color:due.color}}>📅 {due.label}</span>}
            <span className="muted text-sm">{relativeTime(note.createdAt)}</span>
          </div>
          <div style={{fontSize:14, lineHeight:1.6, whiteSpace:"pre-wrap"}}>{note.text}</div>
          {note.dueDate && (
            <div className="muted text-sm" style={{marginTop:6}}>กำหนดส่ง: {formatDueDate(note.dueDate)}</div>
          )}
        </div>
        <div className="row" style={{gap:2, flexShrink:0}}>
          <button onClick={()=>window.togglePinNote(classId, note.id)}
            title={note.pinned ? "ถอนหมุด" : "ปักหมุด"}
            style={{padding:6, color: note.pinned ? "#F59E0B" : "var(--ink-3)", fontSize:16, lineHeight:1}}>
            {note.pinned ? "📌" : "📍"}
          </button>
          <button onClick={()=>setEditing(true)} title="แก้ไข"
            style={{padding:6, color:"var(--primary)"}}><Icon name="edit" size={14}/></button>
          <button onClick={remove} title="ลบ"
            style={{padding:6, color:"#EF4444", fontWeight:700, fontSize:16, lineHeight:1}}>×</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {ClassNotes, NoteCard, NOTE_KINDS, relativeTime, formatDueDate, dueDateStatus});
