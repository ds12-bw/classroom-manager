// Main app — routes between screens + Tweaks panel + Import modal

const { useState: useStateApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "sidebar",
  "primary": "#4F46E5"
}/*EDITMODE-END*/;

const PRIMARY_OPTIONS = ["#4F46E5", "#0EA5E9", "#10B981", "#EC4899", "#F59E0B"];

function App(){
  const [active, setActive] = useStateApp("dashboard");
  const [activeClass, setActiveClass] = useStateApp("m401");
  const [activeStudent, setActiveStudent] = useStateApp(window.STUDENTS[0].id);
  const [importing, setImporting] = useStateApp(null); // null | "students" | "classes"
  const [importClassId, setImportClassId] = useStateApp(null);
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--primary", t.primary);
    const ink = t.primary === "#F59E0B" ? "#78350F" : t.primary === "#10B981" ? "#064E3B" : t.primary === "#EC4899" ? "#831843" : t.primary === "#0EA5E9" ? "#0C4A6E" : "#312E81";
    document.documentElement.style.setProperty("--primary-ink", ink);
    document.documentElement.style.setProperty("--primary-soft", t.primary + "1A");
  }, [t.primary]);

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
        {t.layout === "sidebar"
          ? <window.Sidebar active={active} onNav={nav} onImport={openImport}/>
          : <window.TopNav active={active} onNav={nav} onImport={openImport}/>
        }
        {screen}

        {active === "qr" && (
          <button onClick={()=>setActive("studentmobile")} className="btn btn-primary"
            style={{position:"fixed", right:24, bottom:24, padding:"12px 18px", borderRadius:999, boxShadow:"var(--shadow-lg)", zIndex:10}}>
            <window.Icon name="qr" size={14}/> ดูตัวอย่างหน้าจอนักเรียน
          </button>
        )}
      </div>

      {importing && <window.ImportModal onClose={()=>{setImporting(null); setImportClassId(null);}} kind={importing} targetClassId={importClassId}/>}

      <window.TweaksPanel title="Tweaks">
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
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
