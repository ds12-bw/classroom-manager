// Student detail + QR + Student mobile view + Import modal

const StudentDetail = ({activeStudent, onNav, activeClass}) => {
  const store = window.useStore();
  const s = store.students.find(x=>x.id===activeStudent) || store.students[0];
  const cls = store.classes.find(c=>c.id===(s ? s.classId : activeClass)) || store.classes[0];
  const [comment, setComment] = useState(s.comment || "");
  const [savedFlash, setSavedFlash] = useState(false);
  const [editingField, setEditingField] = useState(null);

  React.useEffect(() => { setComment(s.comment || ""); }, [s.id]);

  const cats = store.categories;
  const sc = store.scores[s.id] || {};
  const maxTotal = window.maxTotal();
  const total = cats.reduce((a,c)=>a+(sc[c.key]||0), 0);
  const pct = maxTotal ? (total/maxTotal)*100 : 0;
  const grade = window.gradeFor(pct);

  // Compute attendance counts from real attendance table (not cached field)
  // Note: don't use useMemo here — store.attendance is mutated in place so the
  // reference never changes; recompute on every render instead.
  const att = (() => {
    const c = {present:0, absent:0, leave:0, skip:0};
    const byDate = store.attendance[s.classId] || {};
    Object.values(byDate).forEach(dayMap => {
      const st = dayMap[s.id];
      if (st && c[st] !== undefined) c[st]++;
    });
    return c;
  })();
  const attTotal = att.present + att.absent + att.leave + att.skip;
  const attPct = attTotal ? Math.round((att.present / attTotal) * 100) : 0;

  // Real attendance history for last 28 days (most recent on right)
  const hist = (() => {
    const byDate = store.attendance[s.classId] || {};
    const r = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--){
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = window.toISODate(d);
      const dayMap = byDate[iso];
      r.push(dayMap ? (dayMap[s.id] || null) : null);
    }
    return r;
  })();

  const InlineEdit = ({field, value, big}) => {
    const [draft, setDraft] = useState(value);
    React.useEffect(() => setDraft(value), [value]);
    if (editingField === field){
      return (
        <input className="input" autoFocus value={draft}
          onChange={e=>setDraft(e.target.value)}
          onBlur={()=>{ window.updateStudent(s.id, {[field]: draft}); setEditingField(null); }}
          onKeyDown={e=>{
            if(e.key==="Enter"){ window.updateStudent(s.id, {[field]: draft}); setEditingField(null); }
            if(e.key==="Escape"){ setDraft(value); setEditingField(null); }
          }}
          style={{fontSize: big ? 26 : 14, fontWeight: big ? 700 : 500, padding: big ? "4px 10px" : "4px 8px", textAlign: big ? "left" : "left"}}
        />
      );
    }
    return (
      <span onClick={()=>setEditingField(field)}
        style={{cursor:"text", borderBottom:"1px dashed transparent", paddingBottom:1}}
        onMouseEnter={e=>e.currentTarget.style.borderColor="var(--ink-3)"}
        onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}
        title="คลิกเพื่อแก้ไข">
        {value}
      </span>
    );
  };

  return (
    <div className="main fade-in">
      <PageHead
        title={<span>{window.studentShortName(s)}</span>}
        sub={<span><button onClick={()=>onNav("attendance")} style={{color:"var(--primary)", textDecoration:"underline"}}>{cls.name}</button> · {s.prefix} · เลขประจำตัว <span className="num">{s.id}</span> · เลขที่ <span className="num">{s.no}</span></span>}
        right={<>
          <button className="btn btn-ghost" onClick={()=>onNav("gradebook")}><Icon name="arrowLeft" size={14}/> กลับสมุดคะแนน</button>
          <button className="btn btn-primary"><Icon name="share" size={14}/> ส่งสรุปให้ผู้ปกครอง</button>
        </>}
      />

      <div className="page-body" style={{display:"grid", gridTemplateColumns:"320px 1fr", gap:20}}>

        <div className="col">
          <div className="card card-pad-lg" style={{textAlign:"center"}}>
            <Avatar color={s.avatar} label={s.name.slice(0,1)} size={84}/>
            <div className="bold text-lg" style={{marginTop:14}}>{window.studentFullName(s)}</div>
            <div className="muted text-sm">{cls.name}</div>
            <div className="row" style={{justifyContent:"center", gap:8, marginTop:12, flexWrap:"wrap"}}>
              {attPct >= 90 && <span className="badge" style={{background:"#D1FAE5", color:"#065F46"}}>เข้าเรียนดี</span>}
              {pct >= 75 && <span className="badge" style={{background:"#EEF0FF", color:"#312E81"}}>คะแนนดี</span>}
              {pct < 50 && <span className="badge" style={{background:"#FEE2E2", color:"#991B1B"}}>ต้องดูแล</span>}
            </div>
            <div className="divider"></div>
            <div className="row" style={{justifyContent:"space-around"}}>
              <div>
                <div className="num bold" style={{fontSize:22}}>{total}<span className="muted text-sm">/{maxTotal}</span></div>
                <div className="muted text-sm">คะแนนรวม</div>
              </div>
              <div>
                <div className="num bold" style={{fontSize:22, color: grade==="A"?"#10B981":grade==="F"?"#EF4444":"#1E1B2E"}}>{grade}</div>
                <div className="muted text-sm">เกรด</div>
              </div>
              <div>
                <div className="num bold" style={{fontSize:22}}>{attPct}%</div>
                <div className="muted text-sm">เข้าเรียน</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="bold" style={{marginBottom:10}}>แก้ไขข้อมูลนักเรียน</div>
            <div className="col" style={{gap:10}}>
              <div className="row" style={{gap:10}}>
                <div style={{flex:1}}>
                  <div className="text-sm muted" style={{marginBottom:3}}>เลขที่</div>
                  <input className="input num" type="number" min={1} value={s.no} style={{width:"100%"}}
                    onChange={e=>window.updateStudent(s.id, {no: parseInt(e.target.value)||1})}/>
                </div>
                <div style={{flex:2}}>
                  <div className="text-sm muted" style={{marginBottom:3}}>เลขประจำตัว</div>
                  <input className="input num" value={s.id} style={{width:"100%"}}
                    onChange={e=>window.updateStudent(s.id, {id: e.target.value})}/>
                </div>
              </div>
              <div>
                <div className="text-sm muted" style={{marginBottom:3}}>คำนำหน้า</div>
                <select className="input" value={s.prefix} style={{width:"100%"}}
                  onChange={e=>window.updateStudent(s.id, {prefix: e.target.value})}>
                  {window.PREFIX_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="row" style={{gap:10}}>
                <div style={{flex:1}}>
                  <div className="text-sm muted" style={{marginBottom:3}}>ชื่อ</div>
                  <input className="input" value={s.name} style={{width:"100%"}}
                    onChange={e=>window.updateStudent(s.id, {name: e.target.value})}/>
                </div>
                <div style={{flex:1}}>
                  <div className="text-sm muted" style={{marginBottom:3}}>สกุล</div>
                  <input className="input" value={s.surname} style={{width:"100%"}}
                    onChange={e=>window.updateStudent(s.id, {surname: e.target.value})}/>
                </div>
              </div>
              <div>
                <div className="text-sm muted" style={{marginBottom:3}}>ห้องเรียน</div>
                <select className="input" value={s.classId} style={{width:"100%"}}
                  onChange={e=>window.updateStudent(s.id, {classId: e.target.value})}>
                  {store.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="row" style={{justifyContent:"space-between", marginBottom:8}}>
              <div className="bold">บันทึกของครู</div>
              {savedFlash && <span className="badge" style={{background:"#D1FAE5", color:"#065F46"}}>บันทึกแล้ว ✓</span>}
            </div>
            <div className="muted text-sm" style={{marginBottom:10}}>นักเรียนจะไม่เห็นข้อความนี้</div>
            <textarea className="input" rows={5} style={{width:"100%", resize:"vertical", fontFamily:"inherit"}}
              value={comment} onChange={e=>setComment(e.target.value)}
              placeholder="พิมพ์ความเห็นเกี่ยวกับนักเรียน..." />
            <button className="btn btn-primary" style={{marginTop:10, width:"100%"}}
              onClick={()=>{
                window.updateStudent(s.id, {comment});
                setSavedFlash(true);
                setTimeout(()=>setSavedFlash(false), 1500);
              }}>
              <Icon name="check" size={12}/> บันทึก
            </button>
          </div>
        </div>

        <div className="col">
          <div className="card card-pad-lg">
            <div className="row" style={{justifyContent:"space-between", marginBottom:14}}>
              <div className="bold text-lg">คะแนนรายประเภท</div>
              <button className="btn btn-ghost" onClick={()=>onNav("gradebook")}><Icon name="edit" size={12}/> แก้คะแนน</button>
            </div>
            <div className="col" style={{gap:14}}>
              {cats.map(c => {
                const v = sc[c.key] || 0;
                const cpct = (v/c.max)*100;
                return (
                  <div key={c.key}>
                    <div className="row" style={{justifyContent:"space-between", marginBottom:6}}>
                      <div className="row" style={{gap:8}}>
                        <span style={{width:10, height:10, borderRadius:3, background:c.color}}></span>
                        <span className="bold text-sm" style={{whiteSpace:"nowrap"}}>{c.label}</span>
                      </div>
                      <div style={{whiteSpace:"nowrap"}}>
                        <span className="num bold" style={{color:c.color, fontSize:16}}>{v}</span>
                        <span className="muted num text-sm"> / {c.max}</span>
                        <span className="muted text-sm" style={{marginLeft:8}}>({Math.round(cpct)}%)</span>
                      </div>
                    </div>
                    <Bar value={v} max={c.max} color={c.color}/>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card card-pad-lg">
            <div className="row" style={{justifyContent:"space-between", marginBottom:14}}>
              <div className="bold text-lg">สรุปการเข้าเรียน</div>
              <span className="muted text-sm">28 วันที่ผ่านมา</span>
            </div>
            <div className="row" style={{gap:14, marginBottom:18}}>
              {Object.entries(att).map(([k,v]) => {
                const st = window.ATT_STATUS[k];
                return (
                  <div key={k} style={{flex:1, padding:12, background: st.bg, borderRadius: 12}}>
                    <div className="num bold" style={{fontSize:24, color: st.color}}>{v}</div>
                    <div className="text-sm" style={{color: st.color, fontWeight:600}}>{st.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="muted text-sm" style={{marginBottom:8}}>ปฏิทินรายวัน (อาทิตย์ล่าสุดอยู่ขวาสุด)</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(28, 1fr)", gap:3}}>
              {hist.map((st, i) => {
                if (!st) return <div key={i} style={{height:24, borderRadius:5, background:"#F3EFE7"}}></div>;
                const meta = window.ATT_STATUS[st];
                return <div key={i} title={meta.label} style={{height:24, borderRadius:5, background: meta.color, opacity: st==="present"?0.85:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:10, fontWeight:700}}>{meta.letter}</div>;
              })}
            </div>
          </div>

          <div className="card">
            <div className="bold" style={{marginBottom:10}}>กิจกรรมล่าสุด</div>
            {[
              {t:"ใส่คะแนนสอบย่อยครั้งที่ 2 — 18/20", time:"2 ชม.ที่แล้ว", icon:"chart"},
              {t:"เช็คชื่อ: มาเรียน", time:"เช้านี้", icon:"check"},
              {t:"ส่งงานครบ บทที่ 3", time:"2 วันที่แล้ว", icon:"file"},
            ].map((a,i)=>(
              <div key={i} className="row" style={{padding:"10px 0", borderTop: i>0?"1px solid var(--line)":"none", gap:12}}>
                <div style={{width:30, height:30, borderRadius:8, background:"var(--primary-soft)", color:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}><Icon name={a.icon} size={14}/></div>
                <div className="text-sm" style={{flex:1}}>{a.t}</div>
                <div className="muted text-sm" style={{whiteSpace:"nowrap"}}>{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Import Students/Classes Modal ----------
const ImportModal = ({onClose, kind = "students", targetClassId = null}) => {
  const isClasses = kind === "classes";
  const store = window.useStore();
  const [step, setStep] = useState("upload"); // upload | preview | done
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importToClass, setImportToClass] = useState(() => targetClassId || (store.classes[0] && store.classes[0].id));
  const fileRef = useRef(null);

  const parseFile = async (file) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop().toLowerCase();
    try {
      if (ext === "csv" || ext === "tsv" || ext === "txt") {
        const text = await file.text();
        parseCSV(text, ext === "tsv" ? "\t" : ",");
      } else if (ext === "xlsx" || ext === "xls") {
        if (!window.XLSX) {
          alert("กำลังโหลดไลบรารี Excel... กรุณารอสักครู่แล้วลองใหม่");
          return;
        }
        const buf = await file.arrayBuffer();
        const wb = window.XLSX.read(buf, {type:"array"});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = window.XLSX.utils.sheet_to_json(ws, {header:1, defval:""});
        parseRows(data);
      } else {
        alert("รองรับเฉพาะไฟล์ .xlsx, .xls, .csv, .tsv");
      }
    } catch (err) {
      alert("อ่านไฟล์ไม่สำเร็จ: " + err.message);
    }
  };

  const parseCSV = (text, sep) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const data = lines.map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, "")));
    parseRows(data);
  };

  const parseRows = (data) => {
    if (data.length === 0) { alert("ไฟล์ว่างเปล่า"); return; }
    if (isClasses) {
      parseClassRows(data);
    } else {
      parseStudentRows(data);
    }
  };

  const parseStudentRows = (data) => {
    const headerKeywords = /รหัส|ชื่อ|เล่น|name|nick|id|เลข|คำนำ|prefix|สกุล|surname|last/i;
    const hasHeader = data[0].some(c => headerKeywords.test(String(c)));
    const start = hasHeader ? 1 : 0;
    // Default column order: เลขที่, รหัส, คำนำหน้า, ชื่อ, สกุล, ชื่อเล่น
    let colNo = 0, colId = 1, colPrefix = 2, colName = 3, colSurname = 4, colNick = 5;
    if (hasHeader) {
      const h = data[0].map(c => String(c).toLowerCase());
      h.forEach((cell, i) => {
        if (/เลขที่|no\b|order|ลำดับ/i.test(cell)) colNo = i;
        else if (/รหัส|id|เลขประจำ/i.test(cell)) colId = i;
        else if (/คำนำ|prefix|title/i.test(cell)) colPrefix = i;
        else if (/สกุล|surname|last/i.test(cell)) colSurname = i;
        else if (/เล่น|nick/i.test(cell)) colNick = i;
        else if (/ชื่อ|name|first/i.test(cell)) colName = i;
      });
    }
    const parsed = [];
    for (let i = start; i < data.length; i++){
      const row = data[i];
      if (!row || !row.some(c => String(c).trim())) continue;
      // Auto-detect prefix from name if not present
      let prefix = String(row[colPrefix] || "").trim();
      let name = String(row[colName] || "").trim();
      let surname = String(row[colSurname] || "").trim();
      // If name contains prefix at start
      const prefixMatch = name.match(/^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นางสาว|นาง|น\.ส\.)\s*(.+)/);
      if (!prefix && prefixMatch){
        prefix = prefixMatch[1].replace("ด.ช.", "เด็กชาย").replace("ด.ญ.", "เด็กหญิง").replace("น.ส.", "นางสาว");
        name = prefixMatch[2];
      }
      // If name still has space (and no surname), split it
      if (!surname && name.includes(" ")){
        const parts = name.split(/\s+/);
        name = parts[0];
        surname = parts.slice(1).join(" ");
      }
      parsed.push({
        no: parseInt(row[colNo]) || (parsed.length + 1),
        id: String(row[colId] || "").trim(),
        prefix: prefix || "เด็กชาย",
        name,
        surname,
        nick: String(row[colNick] || "").trim(),
      });
    }
    setRows(parsed);
    setStep("preview");
  };

  const parseClassRows = (data) => {
    const headerKeywords = /ชื่อ|name|รหัส|code|ห้อง|room|เวลา|time|จำนวน/i;
    const hasHeader = data[0].some(c => headerKeywords.test(String(c)));
    const start = hasHeader ? 1 : 0;
    let colName = 0, colCode = 1, colRoom = 2, colTime = 3, colStudents = 4;
    if (hasHeader) {
      const h = data[0].map(c => String(c).toLowerCase());
      h.forEach((cell, i) => {
        if (/รหัส|code/i.test(cell)) colCode = i;
        else if (/ห้อง|room/i.test(cell)) colRoom = i;
        else if (/เวลา|time/i.test(cell)) colTime = i;
        else if (/จำนวน|นักเรียน|count/i.test(cell)) colStudents = i;
        else if (/ชื่อ|name|วิชา/i.test(cell)) colName = i;
      });
    }
    const parsed = [];
    for (let i = start; i < data.length; i++){
      const row = data[i];
      if (!row || !row.some(c => String(c).trim())) continue;
      parsed.push({
        name: String(row[colName] || "").trim(),
        code: String(row[colCode] || "").trim(),
        room: String(row[colRoom] || "").trim(),
        time: String(row[colTime] || "").trim(),
        students: parseInt(row[colStudents]) || 0,
      });
    }
    setRows(parsed);
    setStep("preview");
  };

  const confirmImport = () => {
    const valid = rows.filter(r => isClasses ? r.name : r.name);
    if (!valid.length) { alert("ไม่มีข้อมูลที่ถูกต้อง"); return; }
    if (isClasses) window.addClasses(valid);
    else window.addStudents(valid, importToClass);
    setStep("done");
  };

  const title = isClasses ? "เพิ่มห้องเรียนจากไฟล์ Excel" : "เพิ่มนักเรียนจากไฟล์ Excel";
  const subtitle = isClasses
    ? "รองรับ .xlsx / .xls / .csv · คอลัมน์: ชื่อวิชา, รหัส, ห้อง, เวลา, จำนวนนักเรียน"
    : "รองรับ .xlsx / .xls / .csv · คอลัมน์: เลขที่, รหัส, คำนำหน้า, ชื่อ, สกุล";

  return (
    <div style={{position:"fixed", inset:0, background:"rgba(28,25,46,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:24}}>
      <div className="card card-pad-lg" style={{width:760, maxWidth:"100%", maxHeight:"90vh", display:"flex", flexDirection:"column", padding:0}}>
        <div style={{padding:"20px 24px", borderBottom:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <div className="bold text-lg">{title}</div>
            <div className="muted text-sm">{subtitle}</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>ปิด ✕</button>
        </div>

        <div style={{padding:24, overflowY:"auto", flex:1}}>
          {step === "upload" && (
            <div>
              {!isClasses && (
                <div className="card" style={{marginBottom:14, background:"var(--primary-soft)", border:"none"}}>
                  <div className="bold text-sm" style={{marginBottom:6}}>นำเข้านักเรียนเข้าห้อง</div>
                  <select className="input" value={importToClass || ""} onChange={e=>setImportToClass(e.target.value)}
                    style={{width:"100%"}}>
                    {store.classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.room})</option>)}
                  </select>
                  <div className="muted text-sm" style={{marginTop:6}}>นักเรียนจะถูกเพิ่มเข้าห้องที่เลือก</div>
                </div>
              )}
              <div onClick={()=>fileRef.current?.click()}
                onDragOver={e=>{e.preventDefault(); e.currentTarget.style.borderColor="var(--primary)";}}
                onDragLeave={e=>e.currentTarget.style.borderColor="var(--line-2)"}
                onDrop={e=>{
                  e.preventDefault();
                  e.currentTarget.style.borderColor="var(--line-2)";
                  if (e.dataTransfer.files[0]) parseFile(e.dataTransfer.files[0]);
                }}
                style={{border:"2px dashed var(--line-2)", borderRadius:14, padding:48, textAlign:"center", cursor:"pointer", background:"var(--bg)"}}>
                <div style={{width:56, height:56, borderRadius:14, background:"var(--primary-soft)", color:"var(--primary)", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:12}}>
                  <Icon name="download" size={24}/>
                </div>
                <div className="bold text-lg">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</div>
                <div className="muted text-sm" style={{marginTop:4}}>.xlsx / .xls / .csv (ขนาดไม่เกิน 5 MB)</div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.tsv,.txt"
                  style={{display:"none"}}
                  onChange={e=>{ if(e.target.files[0]) parseFile(e.target.files[0]); }}/>
              </div>
              {isClasses ? (
                <div className="card" style={{marginTop:16, background:"var(--bg)"}}>
                  <div className="bold text-sm" style={{marginBottom:8}}>รูปแบบไฟล์ที่แนะนำ</div>
                  <div style={{display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr 1.2fr 0.8fr", gap:0, border:"1px solid var(--line)", borderRadius:8, overflow:"hidden", fontSize:13}}>
                    {["ชื่อวิชา","รหัส","ห้อง","เวลา","จำนวน"].map((h,i)=>(
                      <div key={i} style={{padding:"6px 10px", background:"#F3EFE7", borderRight: i<4 ? "1px solid var(--line)" : "none"}} className="bold">{h}</div>
                    ))}
                    {[
                      ["ฟิสิกส์ ม.5/1","PHYS-501","ห้อง 305","08:30 - 09:20","42"],
                      ["เคมี ม.6/1","CHEM-601","ห้อง LAB-2","10:30 - 11:20","38"],
                    ].map((row,r) => row.map((cell,i)=>(
                      <div key={`${r}-${i}`} style={{padding:"6px 10px", borderTop:"1px solid var(--line)", borderRight: i<4 ? "1px solid var(--line)" : "none"}} className={i===1 ? "num" : ""}>{cell}</div>
                    )))}
                  </div>
                  <div className="muted text-sm" style={{marginTop:8}}>ระบบจะอ่านแถวแรกเป็นชื่อคอลัมน์ · ถ้าไม่มีหัวตาราง จะใช้คอลัมน์ 1-2-3-4-5 ตามลำดับ</div>
                </div>
              ) : (
                <div className="card" style={{marginTop:16, background:"var(--bg)"}}>
                  <div className="bold text-sm" style={{marginBottom:8}}>รูปแบบไฟล์ที่แนะนำ</div>
                  <div style={{display:"grid", gridTemplateColumns:"0.4fr 1fr 0.8fr 1fr 1fr", gap:0, border:"1px solid var(--line)", borderRadius:8, overflow:"hidden", fontSize:12}}>
                    {["เลขที่","รหัส","คำนำหน้า","ชื่อ","สกุล"].map((h,i)=>(
                      <div key={i} style={{padding:"6px 8px", background:"#F3EFE7", borderRight: i<4 ? "1px solid var(--line)" : "none"}} className="bold">{h}</div>
                    ))}
                    {[
                      ["1","6512345","เด็กชาย","สมชาย","ใจดี"],
                      ["2","6512346","เด็กหญิง","สมหญิง","รักเรียน"],
                      ["3","6512347","นาย","ธนกร","ทองดี"],
                    ].map((row,r) => row.map((cell,i)=>(
                      <div key={`${r}-${i}`} style={{padding:"6px 8px", borderTop:"1px solid var(--line)", borderRight: i<4 ? "1px solid var(--line)" : "none"}} className={i===0||i===1 ? "num" : ""}>{cell}</div>
                    )))}
                  </div>
                  <div className="muted text-sm" style={{marginTop:8}}>คอลัมน์: <span className="bold">เลขที่ · รหัส · คำนำหน้า · ชื่อ · สกุล</span><br/>ไม่ต้องมีคำนำหน้าก็ได้ ระบบจะแยกจากชื่อให้อัตโนมัติ (เช่น "เด็กชายสมชาย ใจดี")</div>
                </div>
              )}
            </div>
          )}

          {step === "preview" && (
            <div>
              <div className="row" style={{justifyContent:"space-between", marginBottom:12}}>
                <div>
                  <div className="bold">พบ {rows.length} แถวจาก <span className="num">{fileName}</span></div>
                  <div className="muted text-sm">
                    {isClasses ? "ตรวจสอบข้อมูลก่อนยืนยัน" : `เพิ่มเข้า: ${(store.classes.find(c=>c.id===importToClass) || {}).name || "—"}`}
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={()=>setStep("upload")}>เลือกไฟล์ใหม่</button>
              </div>
              <div style={{maxHeight:320, overflowY:"auto", border:"1px solid var(--line)", borderRadius:10}}>
                <table className="table">
                  <thead>
                    {isClasses ? (
                      <tr>
                        <th style={{width:40}}>#</th>
                        <th>ชื่อวิชา</th>
                        <th>รหัส</th>
                        <th>ห้อง</th>
                        <th>เวลา</th>
                        <th style={{width:60, textAlign:"center"}}>จำนวน</th>
                      </tr>
                    ) : (
                      <tr>
                        <th style={{width:50}}>เลขที่</th>
                        <th style={{width:90}}>รหัส</th>
                        <th style={{width:80}}>คำนำหน้า</th>
                        <th>ชื่อ</th>
                        <th>สกุล</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {rows.map((r,i) => (
                      <tr key={i}>
                        {isClasses ? (
                          <>
                            <td className="num muted">{i+1}</td>
                            <td>{r.name || <span className="muted">—</span>}</td>
                            <td className="num">{r.code || <span className="muted">auto</span>}</td>
                            <td>{r.room || <span className="muted">—</span>}</td>
                            <td className="num">{r.time || <span className="muted">—</span>}</td>
                            <td className="num" style={{textAlign:"center"}}>{r.students || 0}</td>
                          </>
                        ) : (
                          <>
                            <td className="num muted">{r.no || (i+1)}</td>
                            <td className="num">{r.id || <span className="muted">auto</span>}</td>
                            <td>{r.prefix || <span className="muted">—</span>}</td>
                            <td>{r.name || <span className="muted">—</span>}</td>
                            <td>{r.surname || <span className="muted">—</span>}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === "done" && (
            <div style={{textAlign:"center", padding:"30px 0"}}>
              <div style={{width:64, height:64, borderRadius:"50%", background:"#D1FAE5", color:"#10B981", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:14}}>
                <Icon name="check" size={28}/>
              </div>
              <div className="bold text-lg">เพิ่ม{isClasses?"ห้องเรียน":"นักเรียน"} {rows.filter(r=>r.name).length} {isClasses?"ห้อง":"คน"}เรียบร้อย!</div>
              <div className="muted text-sm">ดูได้ที่หน้าห้องเรียน {!isClasses && "/ สมุดคะแนน / เช็คชื่อ"}</div>
            </div>
          )}
        </div>

        <div style={{padding:"14px 24px", borderTop:"1px solid var(--line)", display:"flex", justifyContent:"flex-end", gap:10}}>
          {step === "preview" && (
            <>
              <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={confirmImport}>
                <Icon name="check" size={14}/> ยืนยันเพิ่ม {rows.filter(r=>r.name).length} {isClasses?"ห้อง":"คน"}
              </button>
            </>
          )}
          {step === "done" && (
            <button className="btn btn-primary" onClick={onClose}>เสร็จสิ้น</button>
          )}
          {step === "upload" && (
            <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- QR Code rendering (real, scannable) ----------
const QRDisplay = ({size=220, seed="MATH-401"}) => {
  // Build a real QR code using qrcode-generator library
  const { modules, count } = useMemo(() => {
    if (typeof window.qrcode !== 'function') {
      return { modules: null, count: 0 };
    }
    // type 0 = auto-detect smallest type, 'M' = medium error correction
    const qr = window.qrcode(0, 'M');
    qr.addData(String(seed));
    qr.make();
    const count = qr.getModuleCount();
    const modules = [];
    for (let r = 0; r < count; r++){
      const row = [];
      for (let c = 0; c < count; c++){
        row.push(qr.isDark(r, c) ? 1 : 0);
      }
      modules.push(row);
    }
    return { modules, count };
  }, [seed]);

  if (!modules) {
    return (
      <div style={{width:size, height:size, background:"#fff", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", color:"#9CA3AF", fontSize:12, textAlign:"center", padding:20}}>
        กำลังโหลด QR library...
      </div>
    );
  }

  // Quiet zone (white margin) of 2 modules
  const quiet = 2;
  const total = count + quiet * 2;
  const cs = size / total;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{background:"#fff", borderRadius:12}}>
      {modules.map((row, r) => row.map((v, c) => v ? (
        <rect key={`${r}-${c}`} x={(c+quiet)*cs} y={(r+quiet)*cs} width={cs} height={cs} fill="#1E1B2E"/>
      ) : null))}
    </svg>
  );
};

const QRPage = ({activeClass, setActiveClass}) => {
  const store = window.useStore();
  const cls = store.classes.find(c=>c.id===activeClass) || store.classes[0];
  // Real, scannable URL pointing to the student mobile view for this class.
  // Falls back to a friendly placeholder if window.location isn't available.
  const url = (typeof window !== 'undefined' && window.location)
    ? `${window.location.origin}${window.location.pathname}?class=${encodeURIComponent(cls.id)}`
    : `https://kru.app/c/${cls.code.toLowerCase()}`;
  return (
    <div className="main fade-in">
      <PageHead title="QR สำหรับนักเรียน" sub="ให้นักเรียนสแกนเพื่อดูคะแนน/การเข้าเรียนของตัวเอง"
        right={<>
          <button className="btn btn-ghost"><Icon name="download" size={14}/> ดาวน์โหลด</button>
          <button className="btn btn-primary"><Icon name="print" size={14}/> พิมพ์แบบ A4</button>
        </>}
      />
      <div className="page-body" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:24}}>
        <div className="col">
          <div className="card card-pad-lg">
            <div className="bold text-lg" style={{marginBottom:12}}>เลือกห้องเรียน</div>
            <div className="col" style={{gap:8}}>
              {store.classes.map(c => (
                <button key={c.id} className="card" style={{padding:12, textAlign:"left", display:"flex", alignItems:"center", gap:12, cursor:"pointer",
                  borderColor: c.id===cls.id ? c.color : "var(--line)",
                  boxShadow: c.id===cls.id ? `0 0 0 2px ${c.color}30` : "none",
                  background: c.id===cls.id ? "#fff" : "var(--bg)"
                }} onClick={()=>setActiveClass(c.id)}>
                  <div style={{width:36, height:36, borderRadius:8, background:c.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontFamily:"var(--font-num)"}}>{c.code.split("-")[0].slice(0,2)}</div>
                  <div style={{flex:1}}>
                    <div className="bold text-sm">{c.name}</div>
                    <div className="muted text-sm num">{c.code} · {c.students} คน</div>
                  </div>
                  {c.id===cls.id && <Icon name="check" size={16}/>}
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="bold" style={{marginBottom:8}}>ขั้นตอนของนักเรียน</div>
            <ol style={{paddingLeft:20, margin:0, color:"var(--ink-2)", fontSize:13, lineHeight:1.8}}>
              <li>เปิดกล้องมือถือ สแกน QR ของห้องเรียน</li>
              <li>กรอกเลขประจำตัวนักเรียน</li>
              <li>ดูสรุปคะแนน · ประวัติเข้าเรียนของตัวเองทันที</li>
            </ol>
          </div>
        </div>

        <div className="card card-pad-lg" style={{display:"flex", flexDirection:"column", alignItems:"center", background:"linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 100%)"}}>
          <div style={{padding:24, background:"#fff", borderRadius:24, boxShadow:"var(--shadow-md)", border:`3px solid ${cls.color}`, position:"relative"}}>
            <QRDisplay size={240} seed={url}/>
            <div style={{position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:44, height:44, borderRadius:10, background:cls.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontFamily:"var(--font-num)"}}>{cls.code.split("-")[0].slice(0,2)}</div>
          </div>
          <div style={{textAlign:"center", marginTop:18}}>
            <div className="bold text-lg">{cls.name}</div>
            <div className="muted text-sm num" style={{marginTop:2}}>{url}</div>
          </div>
          <div className="divider" style={{width:"100%"}}></div>
          <div className="muted text-sm" style={{textAlign:"center"}}>
            นักเรียนจะต้องใส่เลขประจำตัวเพื่อยืนยันตัวตน<br/>
            <span style={{fontSize:11}}>QR หมดอายุ: ภาคเรียนที่ 1/2569</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// StudentMobile component — Student login + dashboard view
const StudentMobile = ({activeClass}) => {
  const store = window.useStore();
  const cls = store.classes.find(c => c.id === activeClass) || store.classes[0];
  const [step, setStep] = useState("login"); // login | dashboard
  const [pin, setPin] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loginError, setLoginError] = useState("");

  const s = store.students.find(x => x.id === studentId);
  const cats = store.categories;
  const sc = !s ? {} : (store.scores[s.id] || {});
  const maxTotal = window.maxTotal() + 10;

  let att = {present:0, absent:0, leave:0, skip:0};
  let attPct = 0;
  let attendScore = 0;

  if (s) {
    const byDate = store.attendance[cls.id] || {};
    Object.values(byDate).forEach(dayMap => {
      const st = dayMap[s.id];
      if (st && att[st] !== undefined) att[st]++;
    });
    const attTotal = att.present + att.absent + att.leave + att.skip;
    attPct = attTotal ? Math.round((att.present / attTotal) * 100) : 0;
    attendScore = Math.round((attPct / 100) * 10);
  }

  const total = cats.reduce((a,c) => a+(sc[c.key]||0), 0) + attendScore;
  const pct = maxTotal ? (total/maxTotal)*100 : 0;
  const grade = window.gradeFor(pct);

  const tryLogin = () => {
    const found = store.students.find(s => s.id === pin && s.classId === cls.id);
    if (!found){
      setLoginError("ไม่พบเลขนี้ในห้องนี้");
      return;
    }
    setStudentId(found.id);
    setPin("");
    setStep("dashboard");
  };

  return (
    <div className="main fade-in">
      <PageHead title="หน้าจอฝั่งนักเรียน" sub="ตัวอย่างหลังจากสแกน QR แล้ว"/>
      <div className="page-body" style={{display:"flex", justifyContent:"center", gap:32, alignItems:"flex-start", flexWrap:"wrap"}}>

        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-notch"></div>
            {step === "login" ? (
              // ===== LOGIN SCREEN (Dark Mode Elegant - SCALED UP) =====
              <div style={{padding:"80px 32px 40px", display:"flex", flexDirection:"column", alignItems:"center", height:"100%", background:"linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"}}>

                {/* Class Avatar with Gradient - LARGER */}
                <div style={{width:128, height:128, borderRadius:32, background:"linear-gradient(135deg, " + cls.color + " 0%, " + cls.color + "dd 100%)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontFamily:"var(--font-num)", fontWeight:700, fontSize:48, marginTop:12, boxShadow:"0 20px 50px rgba(0,0,0,.4)"}}>
                  {cls.code.split("-")[0].slice(0,2)}
                </div>

                {/* Class Info - LARGER FONTS */}
                <div className="bold" style={{marginTop:32, fontSize:28, letterSpacing:-0.5, textAlign:"center", color:"#F1F5F9"}}>{cls.name}</div>
                <div className="muted text-sm" style={{marginTop:8, fontSize:16, textAlign:"center", color:"#CBD5E1"}}>เช็คคะแนน · การเข้าเรียน</div>
                <div className="divider" style={{width:"80%", marginTop:28, marginBottom:0, background:"rgba(148, 163, 184, 0.2)"}}></div>

                {/* Login Card - BIGGER PADDING */}
                <div className="card" style={{marginTop:36, width:"100%", padding:36, boxShadow:"0 20px 40px rgba(0,0,0,.5)", borderColor: loginError ? "#FCA5A5" : "#334155", borderRadius:24, background:"#1E293B"}}>
                  <div className="bold" style={{marginBottom:12, fontSize:19, color:"#F1F5F9"}}>เลขประจำตัวของคุณ</div>
                  <div className="muted text-sm" style={{marginBottom:22, fontSize:15, color:"#94A3B8"}}>ใส่เลขที่ครูกำหนดให้เพื่อดูข้อมูล</div>

                  <input className="input num"
                    style={{width:"100%", fontSize:40, letterSpacing:8, textAlign:"center", borderColor: loginError ? "#EF4444" : "#475569", borderWidth: 2, borderRadius: 14, padding:"24px 18px", fontWeight:"700", background:"#0F172A", color:"#F1F5F9", boxShadow: loginError ? "0 0 0 3px rgba(239, 68, 68, 0.15)" : "0 4px 12px rgba(0,0,0,0.3)"}}
                    placeholder="0000"
                    value={pin}
                    onChange={e=>{ setPin(e.target.value); setLoginError(""); }}
                    onKeyDown={e=>{ if(e.key==="Enter") tryLogin(); }}
                    autoFocus/>

                  {/* Error Message */}
                  {loginError && (
                    <div style={{marginTop:16, padding:"14px 16px", background:"rgba(239, 68, 68, 0.15)", color:"#FCA5A5", borderRadius:14, fontSize:15, textAlign:"center", borderLeft:"4px solid #EF4444", fontWeight:500}}>
                      ❌ {loginError}
                    </div>
                  )}

                  {/* Login Button - BIGGER */}
                  <button className="btn btn-primary"
                    style={{width:"100%", marginTop:28, justifyContent:"center", padding:"20px 24px", fontSize:18, fontWeight:700, boxShadow:"0 10px 30px rgba(59, 130, 246, .4)", borderRadius: 14, transition: "all 200ms ease", opacity: !pin.trim() ? 0.5 : 1, background: !pin.trim() ? "#1E40AF" : "#3B82F6"}}
                    disabled={!pin.trim()}
                    onClick={tryLogin}>
                    เข้าสู่ระบบ
                  </button>
                </div>

                {/* Footer */}
                <div className="muted text-sm" style={{marginTop:"auto", paddingTop:24, fontSize:14, textAlign:"center"}}>
                  <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:6, padding:"10px 18px", background:"rgba(16, 185, 129, 0.15)", borderRadius:24, width:"fit-content", margin:"0 auto 6px"}}>
                    🔒 <span style={{fontWeight:600, color:"#6EE7B7"}}>ปลอดภัย</span>
                  </div>
                  <div style={{fontSize:13, color:"#64748B"}}>โดย ครูดิจิทัล</div>
                </div>
              </div>
            ) : !s ? (
              // Not found
              <div style={{padding:"60px 24px", textAlign:"center"}}>
                <div className="muted">ไม่พบข้อมูลนักเรียน</div>
                <button className="btn btn-primary" style={{marginTop:14}}
                  onClick={()=>{ setStep("login"); setStudentId(""); setPin(""); }}>กลับ</button>
              </div>
            ) : (
              // ===== DASHBOARD SCREEN (Dark Mode Elegant - SCALED UP FILL) =====
              <div style={{padding:"48px 22px 32px", background:"linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", display:"flex", flexDirection:"column", height:"100%"}}>

                {/* Header: Exit Button + Class Chip - LARGER */}
                <div className="row" style={{justifyContent:"space-between", marginBottom:28, alignItems:"center"}}>
                  <button onClick={()=>{ setStep("login"); setPin(""); setStudentId(""); }} className="btn btn-ghost" style={{padding:"12px 18px", fontSize:17, fontWeight:600, color:"#6B7280"}}>
                    <Icon name="arrowLeft" size={18}/> ออก
                  </button>
                  <span className="class-chip" style={{padding:"10px 18px", fontSize:17, fontWeight:600}}><span className="class-chip-sq" style={{background:cls.color}}></span>{cls.name}</span>
                </div>

                {/* Dashboard Header Card with Gradient - MUCH LARGER */}
                <div style={{padding:44, borderRadius:32, background:"linear-gradient(135deg, #1E293B 0%, #334155 100%)", color:"#F1F5F9", marginBottom:32, boxShadow:"0 20px 40px rgba(0,0,0,.4)", border:"1px solid rgba(148, 163, 184, 0.2)"}}>
                  {/* Student Info Row - MUCH LARGER */}
                  <div className="row" style={{gap:24, alignItems:"center"}}>
                    <Avatar color="#3B82F6" label={s.name.slice(0,1)} size={100}/>
                    <div style={{flex:1}}>
                      <div className="bold" style={{fontSize:34, letterSpacing:-0.5, lineHeight:1.3, color:"#F1F5F9"}}>{s.name} {s.surname}</div>
                      <div className="text-sm" style={{opacity:.75, marginTop:14, fontSize:19, color:"#CBD5E1"}}>เลขที่ {s.no} · {cls.name}</div>
                    </div>
                  </div>

                  {/* Stats Section with Dividers - MUCH LARGER */}
                  <div className="row" style={{justifyContent:"space-between", marginTop:32, paddingTop:32, borderTop:"1.5px solid rgba(148, 163, 184, 0.2)", gap:18}}>
                    {/* Score Stat */}
                    <div style={{textAlign:"center", flex:1}}>
                      <div style={{fontSize:26, opacity:0.85, marginBottom:16}}>📊</div>
                      <div className="num bold" style={{fontSize:46, color:"#F1F5F9"}}>{total}</div>
                      <div className="text-sm" style={{opacity:.75, marginTop:14, fontSize:18, color:"#CBD5E1"}}>คะแนน</div>
                      <div className="text-sm" style={{opacity:.55, fontSize:15, marginTop:10, color:"#94A3B8"}}>{maxTotal} เต็ม</div>
                    </div>
                    <div style={{width:"1.5px", background:"rgba(148, 163, 184, 0.2)"}}></div>

                    {/* Grade Stat (Color-coded) */}
                    <div style={{textAlign:"center", flex:1}}>
                      <div style={{fontSize:26, opacity:0.85, marginBottom:16}}>⭐</div>
                      <div className="num bold" style={{fontSize:56, letterSpacing:-1, color:grade==="A"?"#FBBF24":grade==="B"?"#6EE7B7":grade==="C"?"#FED7AA":grade==="D"?"#F87171":"#F87171"}}>{grade}</div>
                      <div className="text-sm" style={{opacity:.75, marginTop:14, fontSize:18, color:"#CBD5E1"}}>เกรด</div>
                    </div>
                    <div style={{width:"1.5px", background:"rgba(148, 163, 184, 0.2)"}}></div>

                    {/* Attendance Stat */}
                    <div style={{textAlign:"center", flex:1}}>
                      <div style={{fontSize:26, opacity:0.85, marginBottom:16}}>✓</div>
                      <div className="num bold" style={{fontSize:46, color:"#F1F5F9"}}>{attPct}%</div>
                      <div className="text-sm" style={{opacity:.75, marginTop:14, fontSize:18, color:"#CBD5E1"}}>เข้าเรียน</div>
                    </div>
                  </div>
                </div>

                {/* Score Cards Section - MUCH LARGER FONTS */}
                <div className="card" style={{marginBottom:32, background:"#1E293B", borderRadius:26, border:"1px solid rgba(148, 163, 184, 0.15)", padding:"36px"}}>
                  <div className="bold text-sm" style={{marginBottom:28, paddingBottom:24, borderBottom:"2px solid rgba(148, 163, 184, 0.2)", fontSize:24, color:"#F1F5F9"}}> 📊 คะแนนของฉัน</div>
                  {cats.map(c => (
                    <div key={c.key} style={{marginBottom:26, paddingBottom:22}}>
                      <div className="row" style={{justifyContent:"space-between", fontSize:16, marginBottom:16}}>
                        <span style={{whiteSpace:"nowrap", fontWeight:500, color:"#E2E8F0", fontSize:22}}>{c.label}</span>
                        <span className="num bold" style={{whiteSpace:"nowrap", fontSize:24, color:c.color, fontWeight:700}}>{sc[c.key]||0}<span className="muted" style={{fontSize:18, color:"#94A3B8"}}> / {c.max}</span></span>
                      </div>
                      <Bar value={sc[c.key]||0} max={c.max} color={c.color}/>
                    </div>
                  ))}
                  <div style={{marginTop:28, paddingTop:28, borderTop:"2px solid rgba(148, 163, 184, 0.2)"}}>
                    <div className="row" style={{justifyContent:"space-between", fontSize:16, marginBottom:16}}>
                      <span style={{whiteSpace:"nowrap", fontWeight:500, color:"#E2E8F0", fontSize:22}}>✓ เช็คชื่อ</span>
                      <span className="num bold" style={{whiteSpace:"nowrap", fontSize:24, color:"#6EE7B7", fontWeight:700}}>{attendScore}<span className="muted" style={{fontSize:18, color:"#94A3B8"}}> / 10</span></span>
                    </div>
                    <Bar value={attendScore} max={10} color="#6EE7B7"/>
                    <div className="muted text-sm" style={{marginTop:16, fontSize:17, color:"#64748B"}}>({attPct}% เข้าเรียน)</div>
                  </div>
                </div>

                {/* Attendance Section - HUGE BOXES FILL SCREEN */}
                <div className="card" style={{background:"#1E293B", border:"1px solid rgba(148, 163, 184, 0.15)", padding:"36px", marginBottom:28}}>
                  <div className="bold text-sm" style={{marginBottom:30, fontSize:24, color:"#F1F5F9"}}>📋 การเข้าเรียน</div>
                  <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:24}}>
                    {Object.entries(att).map(([k,v]) => {
                      const st = window.ATT_STATUS[k];
                      return (
                        <div key={k} style={{padding:40, borderRadius:26, background:st.bg + "22", textAlign:"center", boxShadow:"0 4px 12px rgba(0,0,0,0.2)", transition:"all 200ms ease", cursor:"pointer", border:`1px solid ${st.color}40`, minHeight:"160px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
                          <div className="num bold" style={{color:st.color, fontSize:48, lineHeight:1.2, fontWeight:700}}>{v}</div>
                          <div style={{fontSize:22, color:st.color, fontWeight:600, marginTop:18}}>{st.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Assignments Section */}
                <div className="card" style={{background:"#1E293B", border:"1px solid rgba(148, 163, 184, 0.15)", padding:"36px", marginBottom:0}}>
                  <div className="bold text-sm" style={{marginBottom:26, fontSize:24, color:"#F1F5F9"}}>📝 งานล่าสุด</div>
                  <div style={{display:"flex", flexDirection:"column", gap:18}}>
                    {[
                      {title:"โครงร่างเรียงความ", due:"3 วันข้างหน้า", status:"pending", icon:"⏳", color:"#F59E0B"},
                      {title:"ทดสอบเนื้อหาบทที่ 5", due:"เสร็จแล้ว", status:"done", icon:"✅", color:"#10B981"},
                      {title:"ส่งรายงานการสำรวจ", due:"5 วันข้างหน้า", status:"pending", icon:"⏳", color:"#F59E0B"},
                    ].map((item, i) => (
                      <div key={i} style={{padding:"20px 24px", background:"rgba(148, 163, 184, 0.1)", borderRadius:18, border:`2px solid ${item.color}40`, display:"flex", alignItems:"center", gap:18}}>
                        <div style={{fontSize:28}}>{item.icon}</div>
                        <div style={{flex:1}}>
                          <div className="bold" style={{fontSize:19, color:"#E2E8F0", marginBottom:8}}>{item.title}</div>
                          <div style={{fontSize:16, color:"#94A3B8"}}>{item.due}</div>
                        </div>
                        <div style={{fontSize:14, fontWeight:600, color:item.color, padding:"8px 14px", background:item.color + "20", borderRadius:12}}>{item.status === "pending" ? "ค้าง" : "เสร็จ"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Usage Guide */}
        <div className="col" style={{maxWidth:340}}>
          <div className="card card-pad-lg">
            <div className="bold text-lg" style={{marginBottom:8}}>วิธีใช้ของนักเรียน</div>
            <div className="muted text-sm" style={{marginBottom:14}}>นักเรียนเข้าได้แค่ของตัวเองเท่านั้น ไม่เห็นคะแนนของเพื่อน</div>
            <div className="col" style={{gap:14}}>
              {[
                {n:1, t:"สแกน QR ของห้องเรียน", d:"จากที่ครูแชร์ หรือบนกระดาน"},
                {n:2, t:"กรอกเลขประจำตัวที่ครูกำหนด", d:"ระบบจะยืนยันก่อนแสดงข้อมูล"},
                {n:3, t:"ดูคะแนน · การเข้าเรียน", d:"ครอบคลุมทุกประเภทคะแนน"},
              ].map(s=>(
                <div key={s.n} className="row" style={{gap:12, alignItems:"flex-start"}}>
                  <div className="num bold" style={{width:28, height:28, borderRadius:8, background:"var(--primary)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>{s.n}</div>
                  <div>
                    <div className="bold text-sm">{s.t}</div>
                    <div className="muted text-sm">{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{background:"linear-gradient(135deg, #FEF3C7 0%, #FCE7F3 100%)", border:"none"}}>
            <div className="row" style={{gap:8, marginBottom:6}}>
              <Icon name="bolt" size={14}/>
              <div className="bold text-sm">ปลอดภัย ส่วนตัว</div>
            </div>
            <div className="text-sm muted">ไม่ต้องสมัครสมาชิก ใช้เลขประจำตัว + QR ก็เข้าได้ ระบบจะไม่บันทึก IP หรือเก็บข้อมูลส่วนตัว</div>
          </div>
        </div>

      </div>
    </div>
  );
};