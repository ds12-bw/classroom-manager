// Gradebook screen — editable table + dynamic categories via store

const CategoryColors = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4", "#F97316"];

const Gradebook = ({activeClass, setActiveClass, onNav, setActiveStudent}) => {
  const store = window.useStore();
  const cls = store.classes.find(c=>c.id===activeClass) || store.classes[0];
  const [view, setView] = useState("table");
  const [editing, setEditing] = useState(null);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatMax, setNewCatMax] = useState(10);

  const cats = store.categories;
  const students = useMemo(() => store.students.filter(s => s.classId === cls.id).sort((a,b)=>a.no-b.no), [store.students, cls.id]);
  const scores = store.scores;

  const maxTotal = window.maxTotal() + 10;

  const totals = useMemo(() => {
    return students.map(s => {
      const sc = scores[s.id] || {};
      const scoreTotal = cats.reduce((a,c)=>a+(sc[c.key]||0), 0);

      // Calculate attendance score
      const att = (() => {
        const c = {present:0, absent:0, leave:0, skip:0};
        const byDate = store.attendance[cls.id] || {};
        Object.values(byDate).forEach(dayMap => {
          const st = dayMap[s.id];
          if (st && c[st] !== undefined) c[st]++;
        });
        return c;
      })();
      const attTotal = att.present + att.absent + att.leave + att.skip;
      const attPct = attTotal ? Math.round((att.present / attTotal) * 100) : 0;
      const attendScore = Math.round((attPct / 100) * 10);

      const total = scoreTotal + attendScore;
      const pct = maxTotal ? (total / maxTotal) * 100 : 0;
      return {sid: s.id, total, pct, grade: window.gradeFor(pct)};
    });
  }, [students, scores, cats, maxTotal, store.attendance, cls.id]);

  const stats = useMemo(() => {
    const arr = totals.map(t=>t.total);
    const avg = arr.length ? Math.round(arr.reduce((a,b)=>a+b,0) / arr.length) : 0;
    const max = arr.length ? Math.max(...arr) : 0;
    const min = arr.length ? Math.min(...arr) : 0;
    const gradeDist = {};
    totals.forEach(t => gradeDist[t.grade] = (gradeDist[t.grade]||0)+1);
    return {avg, max, min, gradeDist};
  }, [totals]);

  const submitNewCat = () => {
    if (!newCatLabel.trim() || newCatMax <= 0) return;
    const color = CategoryColors[cats.length % CategoryColors.length];
    window.addCategory(newCatLabel.trim(), parseInt(newCatMax), color);
    setNewCatLabel("");
    setNewCatMax(10);
    setAddingCat(false);
  };

  return (
    <div className="main fade-in">
      <PageHead title="สมุดคะแนน"
        sub={<span><span className="class-chip-sq" style={{display:"inline-block", width:10, height:10, background:cls.color, marginRight:6, verticalAlign:"middle"}}></span>{cls.name} · เต็ม <span className="num">{maxTotal}</span> คะแนน</span>}
        right={<>
          <button className="btn btn-ghost"><Icon name="download" size={14}/> Excel</button>
          <button className="btn btn-ghost"><Icon name="file" size={14}/> PDF</button>
          <button className="btn btn-primary" onClick={()=>setAddingCat(true)}><Icon name="plus" size={14}/> เพิ่มประเภทคะแนน</button>
        </>}
      />

      <div className="page-body" style={{display:"flex", flexDirection:"column", gap:18}}>

        {/* Class selector */}
        <div className="row" style={{gap:8, flexWrap:"wrap"}}>
          {store.classes.map(c => (
            <button key={c.id} className="class-chip"
              onClick={()=>setActiveClass(c.id)}
              style={{cursor:"pointer", borderColor: c.id===cls.id ? c.color : "var(--line)", boxShadow: c.id===cls.id ? `0 0 0 2px ${c.color}30` : "none"}}>
              <span className="class-chip-sq" style={{background:c.color}}></span>
              {c.name}
            </button>
          ))}
        </div>

        {/* Add category modal/banner */}
        {addingCat && (
          <div className="card card-pad-lg" style={{background:"linear-gradient(135deg, #EEF0FF 0%, #FCE7F3 100%)", border:"none"}}>
            <div className="row" style={{justifyContent:"space-between", marginBottom:12}}>
              <div className="bold text-lg">เพิ่มประเภทคะแนนใหม่</div>
              <button className="btn btn-ghost" onClick={()=>setAddingCat(false)} style={{padding:"4px 10px"}}>ยกเลิก</button>
            </div>
            <div className="row" style={{gap:12}}>
              <div style={{flex:2}}>
                <div className="text-sm muted" style={{marginBottom:4}}>ชื่อประเภท</div>
                <input className="input" autoFocus value={newCatLabel} onChange={e=>setNewCatLabel(e.target.value)}
                  placeholder="เช่น สอบกลางภาค, การมีส่วนร่วม, รายงาน..."
                  style={{width:"100%"}}
                  onKeyDown={e => e.key === "Enter" && submitNewCat()}/>
              </div>
              <div style={{flex:1}}>
                <div className="text-sm muted" style={{marginBottom:4}}>คะแนนเต็ม</div>
                <input className="input num" type="number" min={1} max={100}
                  value={newCatMax} onChange={e=>setNewCatMax(e.target.value)}
                  style={{width:"100%"}}
                  onKeyDown={e => e.key === "Enter" && submitNewCat()}/>
              </div>
              <div style={{display:"flex", alignItems:"flex-end"}}>
                <button className="btn btn-primary" onClick={submitNewCat}><Icon name="plus" size={14}/> เพิ่ม</button>
              </div>
            </div>
            <div className="muted text-sm" style={{marginTop:10}}>คะแนนใหม่จะถูกเพิ่มในทุกห้องเรียน · นักเรียนทุกคนจะเริ่มต้นที่ 0</div>
          </div>
        )}

        {/* Stats + grade distribution */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr) 1.6fr", gap:14}}>
          <Stat label="คะแนนเฉลี่ย" value={stats.avg} foot={`จาก ${maxTotal}`} icon="chart" tone="primary"/>
          <Stat label="สูงสุด" value={stats.max} foot="ดีเยี่ยม" icon="bolt" tone="green"/>
          <Stat label="ต่ำสุด" value={stats.min} foot="ต้องดูแล" icon="user" tone="pink"/>
          <Stat label="ประเภทคะแนน" value={cats.length} foot={`เต็ม ${maxTotal} คะแนน`} icon="edit" tone="orange"/>
          <div className="card" style={{padding:16, minWidth:0}}>
            <div className="row" style={{justifyContent:"space-between", marginBottom:8}}>
              <div className="bold text-sm" style={{whiteSpace:"nowrap"}}>แจกแจงเกรด</div>
              <div className="muted text-sm" style={{whiteSpace:"nowrap"}}>{students.length} คน</div>
            </div>
            <div style={{display:"flex", gap:3, alignItems:"flex-end", height:48}}>
              {["A","B+","B","C+","C","D+","D","F"].map(g => {
                const n = stats.gradeDist[g] || 0;
                const dmax = Math.max(...Object.values(stats.gradeDist), 1);
                const h = (n/dmax)*100;
                const colors = {A:"#10B981", "B+":"#22C55E", B:"#84CC16", "C+":"#EAB308", C:"#F59E0B", "D+":"#F97316", D:"#EF4444", F:"#DC2626"};
                return (
                  <div key={g} style={{flex:1, textAlign:"center"}}>
                    <div style={{height:36, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
                      <div style={{width:"75%", height: Math.max(2, h)+"%", background: colors[g], borderRadius:"3px 3px 0 0"}}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex", gap:3, marginTop:4}}>
              {["A","B+","B","C+","C","D+","D","F"].map(g => (
                <div key={g} style={{flex:1, textAlign:"center"}}>
                  <div className="num" style={{fontSize:9, fontWeight:600}}>{g}</div>
                  <div className="num muted" style={{fontSize:9}}>{stats.gradeDist[g]||0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="row" style={{justifyContent:"space-between"}}>
          <div className="tgrp">
            <button className={view==="table"?"on":""} onClick={()=>setView("table")}>ตาราง</button>
            <button className={view==="chart"?"on":""} onClick={()=>setView("chart")}>แท่งคะแนน</button>
          </div>
          <div className="muted text-sm">คลิกที่ช่องเพื่อแก้คะแนน · คลิกชื่อเพื่อดูรายละเอียด · คลิก × ลบประเภท</div>
        </div>

        {/* Table view */}
        {view === "table" && (
          <div className="card" style={{padding:0, overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{width:50}}>#</th>
                    <th>นักเรียน</th>
                    {cats.map(c => (
                      <th key={c.key} style={{width:96, textAlign:"center", position:"relative"}}>
                        <div className="row" style={{gap:6, justifyContent:"center"}}>
                          <span style={{width:8, height:8, borderRadius:2, background:c.color}}></span>
                          <span style={{whiteSpace:"nowrap"}}>{c.label}</span>
                          {cats.length > 1 && (
                            <button onClick={()=>{ if(confirm(`ลบประเภท "${c.label}"?`)) window.removeCategory(c.key); }}
                              style={{color:"var(--ink-3)", padding:2, fontSize:12, fontFamily:"sans-serif", lineHeight:1}}>×</button>
                          )}
                        </div>
                        <div className="muted text-sm num" style={{fontWeight:500, textTransform:"none", letterSpacing:0, whiteSpace:"nowrap"}}>({c.max} คะแนน)</div>
                      </th>
                    ))}
                    <th style={{width:80, textAlign:"center"}}>รวม</th>
                    <th style={{width:70, textAlign:"center"}}>เกรด</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const sc = scores[s.id] || {};
                    const total = cats.reduce((a,c)=>a+(sc[c.key]||0), 0);
                    const pct = maxTotal ? (total/maxTotal)*100 : 0;
                    const grade = window.gradeFor(pct);
                    const gradeColors = {A:"#10B981", "B+":"#22C55E", B:"#84CC16", "C+":"#EAB308", C:"#F59E0B", "D+":"#F97316", D:"#EF4444", F:"#DC2626"};
                    return (
                      <tr key={s.id}>
                        <td className="num muted">{s.no}</td>
                        <td>
                          <button className="row" style={{gap:10, textAlign:"left"}}
                            onClick={()=>{ setActiveStudent(s.id); onNav("student"); }}>
                            <Avatar color={s.avatar} label={s.name.slice(0,1)} size={28}/>
                            <div>
                              <div className="bold text-sm" style={{whiteSpace:"nowrap"}}>{s.prefix}{s.name} {s.surname}</div>
                              <div className="muted text-sm num">{s.id}</div>
                            </div>
                          </button>
                        </td>
                        {cats.map(c => {
                          const isEditing = editing && editing.sid===s.id && editing.key===c.key;
                          const val = sc[c.key] || 0;
                          return (
                            <td key={c.key} style={{textAlign:"center", padding:6}}>
                              {isEditing ? (
                                <input className="input num" style={{width:64, textAlign:"center", padding:"6px 8px"}}
                                  type="number" min={0} max={c.max} autoFocus
                                  defaultValue={val}
                                  onBlur={e=>{
                                    const v = Math.max(0, Math.min(c.max, parseFloat(e.target.value)||0));
                                    window.updateScore(s.id, c.key, v);
                                    setEditing(null);
                                  }}
                                  onKeyDown={e=>{
                                    if(e.key==="Enter"){
                                      const v = Math.max(0, Math.min(c.max, parseFloat(e.target.value)||0));
                                      window.updateScore(s.id, c.key, v);
                                      setEditing(null);
                                    }
                                    if(e.key==="Escape") setEditing(null);
                                  }}
                                />
                              ) : (
                                <button onClick={()=>setEditing({sid:s.id, key:c.key})}
                                  style={{padding:"6px 10px", borderRadius:8, background:`${c.color}10`, color:c.color, fontWeight:600, minWidth:50}}
                                  className="num">
                                  {val}
                                </button>
                              )}
                            </td>
                          );
                        })}
                        <td style={{textAlign:"center"}} className="num bold">{total}</td>
                        <td style={{textAlign:"center"}}>
                          <span style={{display:"inline-block", padding:"3px 10px", borderRadius:999, background:gradeColors[grade]+"20", color:gradeColors[grade], fontWeight:700, fontSize:12, fontFamily:"var(--font-num)"}}>{grade}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "chart" && (
          <div className="card card-pad-lg">
            <div className="col" style={{gap:8}}>
              {students.map(s => {
                const sc = scores[s.id] || {};
                const total = cats.reduce((a,c)=>a+(sc[c.key]||0), 0);
                return (
                  <div key={s.id} className="row" style={{gap:14}}>
                    <div style={{width:200, display:"flex", alignItems:"center", gap:8}}>
                      <span className="num muted text-sm" style={{width:24}}>{s.no}.</span>
                      <span className="text-sm bold" style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{s.name} {s.surname}</span>
                    </div>
                    <div style={{flex:1, height:22, display:"flex", borderRadius:6, overflow:"hidden", background:"#F3EFE7"}}>
                      {cats.map(c => (
                        <div key={c.key} style={{width: (maxTotal ? (sc[c.key]||0)/maxTotal*100 : 0)+"%", background:c.color}} title={`${c.label}: ${sc[c.key]||0}`}></div>
                      ))}
                    </div>
                    <div className="num bold" style={{width:60, textAlign:"right"}}>{total}<span className="muted text-sm"> /{maxTotal}</span></div>
                  </div>
                );
              })}
            </div>
            <div className="row" style={{gap:14, justifyContent:"center", marginTop:18, paddingTop:14, borderTop:"1px solid var(--line)", flexWrap:"wrap"}}>
              {cats.map(c => (
                <div key={c.key} className="row" style={{gap:6}}>
                  <span style={{width:10, height:10, borderRadius:3, background:c.color}}></span>
                  <span className="text-sm" style={{whiteSpace:"nowrap"}}>{c.label} ({c.max})</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Update gradeFor to take a percentage instead of raw score (since maxTotal varies)
window.gradeFor = function(pct){
  if(pct>=80) return "A";
  if(pct>=75) return "B+";
  if(pct>=70) return "B";
  if(pct>=65) return "C+";
  if(pct>=60) return "C";
  if(pct>=55) return "D+";
  if(pct>=50) return "D";
  return "F";
};

Object.assign(window, {Gradebook});
