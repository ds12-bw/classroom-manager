// Dashboard + Schedule screens

const Dashboard = ({onNav, setActiveClass, onImport}) => {
  const store = window.useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [totalStudents, setTotalStudents] = useState(store.students.length);
  const [avgAttendance, setAvgAttendance] = useState(94);
  const [pendingGrades, setPendingGrades] = useState(23);

  // Update date every second for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format date to Thai style: "วันอังคารที่ 19 พฤษภาคม 2569"
  const formatThaiDate = (date) => {
    const days = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const dayName = days[date.getDay()];
    const dateNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear() + 543; // Convert to Buddhist calendar
    return `${dayName}ที่ ${dateNum} ${monthName} ${year}`;
  };

  const refreshStats = () => {
    // Calculate total students
    const totalStudents = store.students.length;

    // Calculate average attendance from all classes
    let totalPresent = 0;
    let totalRecords = 0;
    if (store.attendance && Object.keys(store.attendance).length > 0) {
      Object.keys(store.attendance).forEach(classId => {
        const dates = store.attendance[classId];
        Object.keys(dates).forEach(date => {
          const students = dates[date];
          Object.keys(students).forEach(sid => {
            totalRecords++;
            if (students[sid] === 'present') totalPresent++;
          });
        });
      });
    }
    const avgAttendance = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    // Count pending (empty) grade entries across all students and categories
    let pendingGrades = 0;
    if (store.scores && Object.keys(store.scores).length > 0) {
      Object.keys(store.scores).forEach(sid => {
        Object.keys(store.scores[sid]).forEach(key => {
          const val = store.scores[sid][key];
          if (val === null || val === undefined || val === '' || val === 0) {
            pendingGrades++;
          }
        });
      });
    }

    setTotalStudents(totalStudents);
    setAvgAttendance(avgAttendance);
    setPendingGrades(pendingGrades);
  };

  // Initialize stats on mount
  useEffect(() => {
    refreshStats();
  }, []);

  const today = store.schedule.filter(s => s.day === 1).map(s => ({...s, cls: store.classes.find(c=>c.id===s.classId)})).filter(t => t.cls);
  const dateDisplay = formatThaiDate(currentDate);

  // Get assignments due today (categories with due_date = today)
  const todayISO = currentDate.toISOString().split('T')[0];
  const todaysDueWork = [];
  store.classes.forEach(cls => {
    const cats = store.categories[cls.id] || [];
    cats.forEach(cat => {
      if (cat.dueDate) {
        const catDate = cat.dueDate.split('T')[0];
        if (catDate === todayISO) {
          todaysDueWork.push({
            classId: cls.id,
            className: cls.name,
            classColor: cls.color,
            categoryLabel: cat.label,
            dueDate: cat.dueDate
          });
        }
      }
    });
  });

  return (
    <div className="main fade-in">
      <PageHead
        title="สวัสดีค่ะ อ.พรทิพย์ 👋"
        sub={`${dateDisplay} · ภาคเรียนที่ 1/2569`}
        right={<>
          <button className="btn btn-ghost" onClick={refreshStats}><Icon name="refresh" size={14}/> Refresh</button>
          <button className="btn btn-ghost" onClick={onImport}><Icon name="download" size={14}/> Import นักเรียน</button>
          <button className="btn btn-primary"><Icon name="plus" size={14}/> สร้างคาบเรียน</button>
        </>}
      />

      <div className="page-body" style={{display:"flex", flexDirection:"column", gap:20}}>

        {/* Stat row */}
        <div className="stat-grid">
          <Stat label="ห้องเรียนของฉัน" value={store.classes.length} foot="ภาคเรียนนี้" icon="grid" tone="primary"/>
          <Stat label="นักเรียนทั้งหมด" value={totalStudents} foot="ครอบคลุม ม.4-ม.6" icon="user" tone="cyan"/>
          <Stat label="เข้าเรียนเฉลี่ย" value={avgAttendance+"%"} foot="วันที่ผ่านมา" icon="check" tone="green"/>
          <Stat label="คะแนนรอตรวจ" value={pendingGrades} foot="ทั่วทุกห้อง" icon="edit" tone="orange"/>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20}}>

          {/* Today's classes */}
          <div className="card card-pad-lg">
            <div className="row" style={{justifyContent:"space-between", marginBottom:16}}>
              <div>
                <div className="bold text-lg">คาบเรียนวันนี้</div>
                <div className="muted text-sm">วันอังคาร · {today.length} คาบ</div>
              </div>
              <button className="btn btn-ghost" onClick={()=>onNav("schedule")}>ดูตารางสอน <Icon name="arrowRight" size={12}/></button>
            </div>
            <div className="col">
              {today.map((s,i) => (
                <div key={i} style={{display:"flex", gap:14, padding:"12px 0", borderBottom: i<today.length-1 ? "1px solid var(--line)" : "none"}}>
                  <div style={{width:56}}>
                    <div className="num bold">{window.PERIODS[s.slot]}</div>
                    <div className="muted text-sm">คาบ {s.slot+1}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div className="row" style={{gap:8, marginBottom:2}}>
                      <span className="class-chip-sq" style={{background:s.cls.color, width:14, height:14}}></span>
                      <span className="bold">{s.cls.name}</span>
                    </div>
                    <div className="muted text-sm">{s.cls.room} · {s.cls.students} คน</div>
                  </div>
                  <div className="row" style={{gap:8}}>
                    <button className="btn btn-soft" onClick={()=>{ setActiveClass(s.cls.id); onNav("attendance"); }}>เช็คชื่อ</button>
                    <button className="btn btn-ghost" onClick={()=>{ setActiveClass(s.cls.id); onNav("gradebook"); }}><Icon name="edit" size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's due assignments */}
          <div className="col">
            {todaysDueWork.length > 0 ? (
              <div className="card">
                <div className="bold">งานที่ต้องส่งวันนี้</div>
                <div className="muted text-sm" style={{marginBottom:14}}>{todaysDueWork.length} งาน</div>
                {todaysDueWork.map((w,i)=>(
                  <div key={i} className="row" style={{padding:"10px 0", borderTop:"1px solid var(--line)"}}>
                    <span className="class-chip-sq" style={{background:w.classColor, width:8, height:8, borderRadius:3}}></span>
                    <div style={{flex:1}}>
                      <div className="bold text-sm">{w.categoryLabel}</div>
                      <div className="muted text-sm">{w.className}</div>
                    </div>
                    <button className="btn btn-ghost" style={{padding:"4px 8px"}} onClick={()=>{ setActiveClass(w.classId); onNav("gradebook"); }}><Icon name="arrowRight" size={12}/></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{background:"linear-gradient(135deg, #ECFDF5 0%, #DBEAFE 100%)", border:"none"}}>
                <div className="row" style={{gap:8, marginBottom:8}}>
                  <Icon name="check" size={16}/>
                  <div className="bold">ไม่มีงานที่ต้องส่งวันนี้</div>
                </div>
                <div className="muted text-sm">สวยดี! งานล้วนหมดแล้ว 🎉</div>
              </div>
            )}
          </div>

            <div className="card" style={{background:"linear-gradient(135deg, #EEF0FF 0%, #FCE7F3 100%)", border:"none"}}>
              <div className="row" style={{gap:8, marginBottom:8}}>
                <Icon name="bolt" size={16}/>
                <div className="bold">คะแนนรวมห้องอ่อนสุด</div>
              </div>
              <div className="muted text-sm" style={{marginBottom:12}}>แคลคูลัส ม.6/2 — มี 7 คนเสี่ยงไม่ผ่าน</div>
              <button className="btn btn-primary" onClick={()=>{ setActiveClass("m602"); onNav("gradebook"); }}>ดูรายละเอียด <Icon name="arrowRight" size={12}/></button>
            </div>
          </div>
        </div>

        {/* Classes grid */}
        <div className="card card-pad-lg">
          <div className="row" style={{justifyContent:"space-between", marginBottom:16}}>
            <div>
              <div className="bold text-lg">ห้องเรียนของฉัน</div>
              <div className="muted text-sm">คลิกเพื่อจัดการ</div>
            </div>
            <button className="btn btn-ghost" onClick={()=>onNav("classes")}>ดูทั้งหมด <Icon name="arrowRight" size={12}/></button>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:14}}>
            {store.classes.map(cls => (
              <button key={cls.id} className="card" style={{textAlign:"left", padding:16, cursor:"pointer"}}
                onClick={()=>{ setActiveClass(cls.id); onNav("attendance"); }}>
                <div style={{height:48, borderRadius:10, background:cls.color, marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:18, fontFamily:"var(--font-num)"}}>
                  {cls.code.split("-")[0]}
                </div>
                <div className="bold text-sm" style={{marginBottom:2}}>{cls.name}</div>
                <div className="muted text-sm">{cls.students} คน · {cls.room}</div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

const Schedule = ({onNav, setActiveClass}) => {
  const store = window.useStore();
  const [editing, setEditing] = useState(null); // {day, slot, current: classId|null}
  const grid = {};
  store.schedule.forEach(s => {
    grid[`${s.day}-${s.slot}`] = store.classes.find(c=>c.id===s.classId);
  });
  return (
    <div className="main fade-in">
      <PageHead title="ตารางสอน" sub="ภาคเรียนที่ 1/2569 · จันทร์–ศุกร์ · คลิกช่องเพื่อแก้ไข"
        right={<>
          <button className="btn btn-ghost"><Icon name="print" size={14}/> พิมพ์</button>
        </>}
      />
      <div className="page-body">
        <div className="card card-pad-lg" style={{padding:0, overflow:"hidden"}}>
          <table className="table" style={{tableLayout:"fixed"}}>
            <thead>
              <tr>
                <th style={{width:100}}>เวลา</th>
                {window.DAYS.map(d => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {window.PERIODS.map((time, slot) => (
                <tr key={slot}>
                  <td style={{verticalAlign:"top"}}>
                    <div className="num bold">{time}</div>
                    <div className="muted text-sm">คาบ {slot+1}</div>
                  </td>
                  {window.DAYS.map((_, day) => {
                    const cls = grid[`${day}-${slot}`];
                    return (
                      <td key={day} style={{padding:6}}>
                        {cls ? (
                          <button onClick={()=>setEditing({day, slot, current: cls.id})}
                            style={{
                              display:"block", width:"100%", textAlign:"left",
                              padding:"10px 12px",
                              background: cls.color+"15",
                              borderLeft: `3px solid ${cls.color}`,
                              borderRadius: 8, cursor:"pointer", position:"relative"
                            }}>
                            <div className="bold text-sm" style={{color: cls.color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{cls.name}</div>
                            <div className="muted text-sm" style={{marginTop:2, whiteSpace:"nowrap"}}>{cls.room}</div>
                          </button>
                        ) : (
                          <button onClick={()=>setEditing({day, slot, current: null})}
                            style={{
                              display:"flex", alignItems:"center", justifyContent:"center",
                              width:"100%", minHeight:54,
                              borderRadius:8, color:"var(--ink-3)",
                              border:"1.5px dashed var(--line-2)", background:"transparent",
                              cursor:"pointer"
                            }}>
                            <Icon name="plus" size={14}/>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <ScheduleSlotEditor slot={editing} onClose={()=>setEditing(null)} setActiveClass={setActiveClass} onNav={onNav}/>}
    </div>
  );
};

const ScheduleSlotEditor = ({slot, onClose, setActiveClass, onNav}) => {
  const store = window.useStore();
  const [picked, setPicked] = useState(slot.current);
  const dayLabel = window.DAYS[slot.day];
  const time = window.PERIODS[slot.slot];

  const save = () => {
    window.setScheduleSlot(slot.day, slot.slot, picked || null);
    onClose();
  };
  const clear = () => {
    window.clearScheduleSlot(slot.day, slot.slot);
    onClose();
  };

  return (
    <div style={{position:"fixed", inset:0, background:"rgba(28,25,46,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:24}}>
      <div className="card card-pad-lg" style={{width:480, maxWidth:"100%", padding:0}}>
        <div style={{padding:"18px 22px", borderBottom:"1px solid var(--line)"}}>
          <div className="bold text-lg">{slot.current ? "แก้ไขคาบเรียน" : "เพิ่มคาบเรียน"}</div>
          <div className="muted text-sm">{dayLabel} · {time} · คาบ {slot.slot+1}</div>
        </div>

        <div style={{padding:20, maxHeight:380, overflowY:"auto"}}>
          <div className="text-sm muted" style={{marginBottom:8}}>เลือกห้องเรียน</div>
          <div className="col" style={{gap:6}}>
            <button onClick={()=>setPicked(null)}
              style={{
                padding:"10px 14px", textAlign:"left", borderRadius:10,
                background: picked === null ? "var(--bg-2)" : "transparent",
                border: picked === null ? "2px solid var(--ink-3)" : "1px solid var(--line)",
                color: "var(--ink-3)"
              }}>
              — ว่าง (ไม่มีคาบเรียน) —
            </button>
            {store.classes.map(c => (
              <button key={c.id} onClick={()=>setPicked(c.id)}
                style={{
                  padding:"10px 14px", textAlign:"left", borderRadius:10,
                  display:"flex", alignItems:"center", gap:10,
                  background: picked === c.id ? c.color + "15" : "transparent",
                  border: picked === c.id ? `2px solid ${c.color}` : "1px solid var(--line)",
                  cursor:"pointer"
                }}>
                <span className="class-chip-sq" style={{background:c.color, width:14, height:14}}></span>
                <div style={{flex:1}}>
                  <div className="bold text-sm">{c.name}</div>
                  <div className="muted text-sm">{c.room} · {c.students} คน</div>
                </div>
                {picked === c.id && <Icon name="check" size={16} stroke={2}/>}
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:"14px 22px", borderTop:"1px solid var(--line)", display:"flex", justifyContent:"space-between"}}>
          <div>
            {slot.current && <button className="btn btn-ghost" onClick={clear} style={{color:"#EF4444"}}>ลบคาบนี้</button>}
          </div>
          <div className="row" style={{gap:10}}>
            <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={save}><Icon name="check" size={14}/> บันทึก</button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {Dashboard, Schedule, ScheduleSlotEditor});
