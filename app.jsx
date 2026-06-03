// Main app — routes between screens + Tweaks panel + Import modal

const { useState: useStateApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "sidebar",
  "primary": "#4F46E5"
}/*EDITMODE-END*/;

const PRIMARY_OPTIONS = ["#4F46E5", "#0EA5E9", "#10B981", "#EC4899", "#F59E0B"];

function App(){
  const store = window.useStore();
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useStateApp(false);
  const [active, setActive] = useStateApp("dashboard");
  const [activeClass, setActiveClass] = useStateApp("m401");
  const [activeStudent, setActiveStudent] = useStateApp("");
  const [importing, setImporting] = useStateApp(null); // null | "students" | "classes"
  const [importClassId, setImportClassId] = useStateApp(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useStateApp(false);
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  // Check if teacher is logged in from localStorage
  React.useEffect(() => {
    const loggedIn = window.isTeacherLoggedIn();
    setIsTeacherLoggedIn(loggedIn);
  }, []);

  React.useEffect(() => { window.bootstrap(); }, []);

  React.useEffect(() => {
    if (store.loaded && !activeStudent && store.students.length){
      setActiveStudent(store.students[0].id);
    }
    if (store.loaded && store.classes.length && !store.classes.find(c => c.id === activeClass)){
      setActiveClass(store.classes[0].id);
    }
  }, [store.loaded, store.students.length, store.classes.length]);

  // Detect if opened from QR scan (has ?class param)
  const [isQRMode, setIsQRMode] = useStateApp(false);

  // Handle scanned QR URL: ?class=<id> auto-opens the student mobile login for that class
  React.useEffect(() => {
    if (!store.loaded) return;
    const params = new URLSearchParams(window.location.search);
    const classParam = params.get("class");
    if (classParam && store.classes.find(c => c.id === classParam)){
      setActiveClass(classParam);
      setActive("studentmobile");
      setIsQRMode(true); // ← Hide nav/sidebar
    }
  }, [store.loaded]);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--primary", t.primary);
    const ink = t.primary === "#F59E0B" ? "#78350F" : t.primary === "#10B981" ? "#064E3B" : t.primary === "#EC4899" ? "#831843" : t.primary === "#0EA5E9" ? "#0C4A6E" : "#312E81";
    document.documentElement.style.setProperty("--primary-ink", ink);
    document.documentElement.style.setProperty("--primary-soft", t.primary + "1A");
  }, [t.primary]);

  // Teacher PIN Screen Component
  const TeacherPINScreen = () => {
    const [pinInput, setPinInput] = useStateApp("");
    const [error, setError] = useStateApp("");
    const [loading, setLoading] = useStateApp(false);

    const handlePINSubmit = async () => {
      if (!pinInput.trim()) {
        setError("กรุณาใส่รหัส PIN");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await window.verifyTeacherPin(pinInput);
        if (result.success) {
          setIsTeacherLoggedIn(true);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("เกิดข้อผิดพลาด: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", flexDirection:"column", gap:20, background:"linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"}}>
        <div className="sb-logo" style={{width:80, height:80, fontSize:32, borderRadius:20, background:"linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", boxShadow:"0 20px 40px rgba(79, 70, 229, 0.3)"}}>👨‍🏫</div>
        <div className="bold" style={{fontSize:28, color:"#F1F5F9", textAlign:"center"}}>ครูดิจิทัล Classroom Manager</div>

        <div className="card" style={{width:"100%", maxWidth:440, padding:40, background:"#1E293B", border:"1px solid #334155", borderRadius:20, boxShadow:"0 25px 50px rgba(0,0,0,.3)"}}>
          <div className="bold" style={{fontSize:20, color:"#F1F5F9", marginBottom:12, textAlign:"center"}}>ยืนยันตัวตน</div>
          <div className="muted text-sm" style={{fontSize:15, color:"#94A3B8", marginBottom:28, textAlign:"center"}}>กรุณากรอกรหัส PIN เพื่อเข้าระบบ</div>

          <input
            type="password"
            className="input num"
            style={{width:"100%", fontSize:36, letterSpacing:6, textAlign:"center", borderColor: error ? "#EF4444" : "#475569", borderWidth:2, borderRadius:16, padding:"24px 20px", fontWeight:"700", background:"#0F172A", color:"#F1F5F9", boxShadow: error ? "0 0 0 3px rgba(239, 68, 68, 0.15)" : "0 4px 12px rgba(0,0,0,0.3)", minHeight:"64px"}}
            placeholder="••••••"
            value={pinInput}
            onChange={(e) => { setPinInput(e.target.value); setError(""); }}
            onKeyDown={(e) => { if(e.key === "Enter" && !loading) handlePINSubmit(); }}
            disabled={loading}
            autoFocus
          />

          {error && (
            <div style={{marginTop:16, padding:12, background:"#7F1D1D", borderRadius:10, borderLeft:"3px solid #EF4444", color:"#FECACA", fontSize:14}}>
              {error}
            </div>
          )}

          <button
            onClick={handlePINSubmit}
            disabled={loading}
            style={{width:"100%", marginTop:24, padding:"16px 20px", background:loading ? "#6B7280" : "#4F46E5", color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:"600", cursor:loading ? "not-allowed" : "pointer", opacity:loading ? 0.7 : 1, transition:"all 200ms"}}>
            {loading ? "กำลังตรวจสอบ..." : "เข้าระบบ"}
          </button>
        </div>

        <div className="muted text-sm" style={{fontSize:12, color:"#64748B", marginTop:20}}>ระบบการจัดการห้องเรียนดิจิทัล</div>
      </div>
    );
  };

  if (!store.loaded){
    return (
      <div style={{display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", flexDirection:"column", gap:14, background:"var(--bg)"}}>
        <div className="sb-logo" style={{width:54, height:54, fontSize:22, borderRadius:14}}>ค</div>
        <div className="bold">{store.error ? "เชื่อมต่อ Supabase ไม่สำเร็จ" : "กำลังเชื่อมต่อฐานข้อมูล..."}</div>
        {store.error && (
          <div className="muted text-sm" style={{maxWidth:480, textAlign:"center", padding:"0 20px"}}>
            {store.error}
            <div style={{marginTop:10}}>ตรวจสอบ <span className="num">config.js</span> ว่าใส่ URL + key ถูกต้อง และรัน <span className="num">supabase/schema.sql</span> ใน SQL Editor แล้ว</div>
          </div>
        )}
      </div>
    );
  }

  // If teacher not logged in, show PIN screen
  if (!isTeacherLoggedIn) {
    return <TeacherPINScreen />;
  }

  const nav = (screen) => setActive(screen);
  const openImport = (classId) => { setImportClassId(typeof classId === 'string' ? classId : null); setImporting("students"); };
  const openImportClasses = () => { setImportClassId(null); setImporting("classes"); };

  let screen;
  switch (active){
    case "dashboard":  screen = <window.Dashboard onNav={nav} setActiveClass={setActiveClass} onImport={openImport}/>; break;
    case "classes":    screen = <window.Classes onNav={nav} setActiveClass={setActiveClass} onImport={openImport} onImportClasses={openImportClasses}/>; break;
    case "attendance": screen = <window.Attendance activeClass={activeClass} setActiveClass={setActiveClass} onNav={nav} setActiveStudent={setActiveStudent}/>; break;
    case "gradebook":  screen = <window.Gradebook activeClass={activeClass} setActiveClass={setActiveClass} onNav={nav} setActiveStudent={setActiveStudent}/>; break;
    case "roster":     screen = <window.Roster activeClass={activeClass} setActiveClass={setActiveClass} onNav={nav} setActiveStudent={setActiveStudent} onImportStudents={openImport}/>; break;
    case "notes":      screen = <window.ClassNotes activeClass={activeClass} setActiveClass={setActiveClass}/>; break;
    case "schedule":   screen = <window.Schedule onNav={nav} setActiveClass={setActiveClass}/>; break;
    case "qr":         screen = <window.QRPage activeClass={activeClass} setActiveClass={setActiveClass}/>; break;
    case "student":    screen = <window.StudentDetail activeStudent={activeStudent} onNav={nav} activeClass={activeClass}/>; break;
    case "studentmobile": screen = <window.StudentMobile activeClass={activeClass}/>; break;
    default:           screen = <window.Dashboard onNav={nav} setActiveClass={setActiveClass} onImport={openImport}/>;
  }

  return (
    <>
      <div className={"app" + (t.layout === "top" ? " top-nav" : "")} data-screen-label={active}>
        {!isQRMode && (
          t.layout === "sidebar"
            ? <window.Sidebar active={active} onNav={nav} onImport={openImport}/>
            : <window.TopNav active={active} onNav={nav} onImport={openImport}/>
        )}
        {screen}

        {active === "qr" && (
          <button onClick={()=>setActive("studentmobile")} className="btn btn-primary"
            style={{position:"fixed", right:24, bottom:24, padding:"12px 18px", borderRadius:999, boxShadow:"var(--shadow-lg)", zIndex:10}}>
            <window.Icon name="qr" size={14}/> ดูตัวอย่างหน้าจอนักเรียน
          </button>
        )}
      </div>

      {importing && <window.ImportModal onClose={()=>{setImporting(null); setImportClassId(null);}} kind={importing} targetClassId={importClassId}/>}

      {!isQRMode && <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Layout">
          <window.TweakRadio
            label="แนวการนำทาง"
            value={t.layout}
            onChange={v => setTweak("layout", v)}
            options={[
              {value:"sidebar", label:"Sidebar"},
              {value:"top", label:"Top"},
            ]}
          />
        </window.TweakSection>

        <window.TweakSection label="ธีมสี">
          <window.TweakColor
            label="สีหลัก"
            value={t.primary}
            onChange={v => setTweak("primary", v)}
            options={PRIMARY_OPTIONS}
          />
        </window.TweakSection>

        <window.TweakSection label="ไปยังหน้า">
          <div style={{display:"flex", flexDirection:"column", gap:6}}>
            {[
              {id:"dashboard", label:"แดชบอร์ด"},
              {id:"classes", label:"ห้องเรียน"},
              {id:"attendance", label:"เช็คชื่อ"},
              {id:"gradebook", label:"คะแนน"},
              {id:"student", label:"รายละเอียดนักเรียน"},
              {id:"schedule", label:"ตารางสอน"},
              {id:"qr", label:"QR สำหรับนักเรียน"},
              {id:"studentmobile", label:"หน้าจอฝั่งนักเรียน (มือถือ)"},
            ].map(s => (
              <button key={s.id}
                onClick={() => setActive(s.id)}
                style={{
                  padding:"8px 10px", textAlign:"left", borderRadius:8,
                  background: active === s.id ? "#4F46E5" : "#F3EFE7",
                  color: active === s.id ? "#fff" : "#1E1B2E",
                  fontSize:12, fontWeight:600
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </window.TweakSection>

        <window.TweakSection label="Actions">
          <button onClick={openImport}
            style={{padding:"8px 10px", textAlign:"left", borderRadius:8, background:"#EEF0FF", color:"#312E81", fontSize:12, fontWeight:600, width:"100%", marginBottom:6}}>
            📥 Import นักเรียนจาก Excel
          </button>
          <button onClick={openImportClasses}
            style={{padding:"8px 10px", textAlign:"left", borderRadius:8, background:"#FEF3C7", color:"#78350F", fontSize:12, fontWeight:600, width:"100%"}}>
            📥 Import ห้องเรียนจาก Excel
          </button>
        </window.TweakSection>
      </window.TweaksPanel>
      }
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
