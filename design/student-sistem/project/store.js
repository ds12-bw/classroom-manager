// Simple reactive store for app-wide state
// Use: const state = useStore(); setStore({...}) or setStore(s => mutate(s))

(function(){
  const state = {
    students: window.STUDENTS.map(s => ({...s})),
    categories: window.SCORE_CATS.map(c => ({...c})),
    classes: window.CLASSES.map(c => ({...c})),
    schedule: window.SCHEDULE.map(s => ({...s})),
    // scores[studentId][categoryKey] = number
    scores: {},
    // attendance[classId][dateISO][studentId] = "present"|"absent"|"leave"|"skip"
    attendance: {},
    // notes[classId] = [{id, text, kind, dueDate, createdAt, pinned}]
    notes: {},
  };

  state.students.forEach(s => {
    state.scores[s.id] = {};
    state.categories.forEach(c => { state.scores[s.id][c.key] = s[c.key] ?? 0; });
  });

  // Seed sample notes for ม.4/1
  (function seedNotes(){
    const now = Date.now();
    state.notes["m401"] = [
      {id:"n1", kind:"assignment", text:"ให้การบ้านบทที่ 3 ฟังก์ชันเลขยกกำลัง ส่งวันศุกร์", dueDate:"2569-05-23", createdAt: now - 86400000, pinned:false},
      {id:"n2", kind:"announce", text:"พรุ่งนี้นัดประชุมผู้ปกครองหลังเลิกเรียน เวลา 16:00 ที่ห้องประชุม 2", dueDate:null, createdAt: now - 3600000*4, pinned:true},
      {id:"n3", kind:"note", text:"นักเรียนเริ่มเข้าใจการแยกตัวประกอบดีขึ้น ต้องเสริมโจทย์ปัญหาให้ฝึกเพิ่ม", dueDate:null, createdAt: now - 3600000, pinned:false},
    ];
    state.notes["m602"] = [
      {id:"n4", kind:"exam", text:"สอบกลางภาค บทที่ 1-3 วันที่ 18 มิถุนายน 09:00-11:00 ห้อง 401", dueDate:"2569-06-18", createdAt: now - 7200000, pinned:true},
    ];
  })();

  const subs = new Set();
  function notify(){ subs.forEach(fn => fn()); }

  function setStore(updater){
    if (typeof updater === 'function') updater(state);
    else Object.assign(state, updater);
    notify();
  }

  function useStore(){
    const [, force] = React.useState(0);
    React.useEffect(() => {
      const fn = () => force(x => x + 1);
      subs.add(fn);
      return () => { subs.delete(fn); };
    }, []);
    return state;
  }

  // ---- Actions ----
  function addCategory(label, max, color){
    const key = "c" + Date.now();
    setStore(s => {
      s.categories.push({key, label, max, color: color || "#8B5CF6"});
      s.students.forEach(st => { s.scores[st.id][key] = 0; });
    });
  }
  function removeCategory(key){
    setStore(s => {
      s.categories = s.categories.filter(c => c.key !== key);
      Object.keys(s.scores).forEach(sid => { delete s.scores[sid][key]; });
    });
  }
  function updateScore(sid, key, value){
    setStore(s => { s.scores[sid][key] = value; });
  }
  function addStudents(newOnes, classId){
    setStore(s => {
      const cid = classId || (s.classes[0] && s.classes[0].id);
      const existingInClass = s.students.filter(x => x.classId === cid).length;
      newOnes.forEach((n, i) => {
        const stu = {
          id: String(n.id || "").trim() || ("65" + String(20000 + s.students.length + i).padStart(5,"0")),
          no: existingInClass + i + 1,
          prefix: n.prefix || "เด็กชาย",
          name: n.name || "นักเรียนใหม่",
          surname: n.surname || "",
          nick: n.nick || "—",
          classId: cid,
          avatar: ["#FDE68A","#FBCFE8","#BFDBFE","#C7D2FE","#BBF7D0","#FED7AA","#DDD6FE","#FECACA"][(existingInClass + i) % 8],
          attendance: {present:0, absent:0, leave:0, skip:0},
          comment: ""
        };
        s.students.push(stu);
        s.scores[stu.id] = {};
        s.categories.forEach(c => { s.scores[stu.id][c.key] = 0; });
      });
      // Update class's students count
      const ci = s.classes.findIndex(c => c.id === cid);
      if (ci >= 0) s.classes[ci].students = s.students.filter(x => x.classId === cid).length;
    });
  }
  function removeStudent(sid){
    setStore(s => {
      const stu = s.students.find(x => x.id === sid);
      const cid = stu && stu.classId;
      s.students = s.students.filter(x => x.id !== sid);
      delete s.scores[sid];
      // Renumber remaining students in same class
      if (cid){
        let n = 1;
        s.students.forEach(x => { if (x.classId === cid) x.no = n++; });
        const ci = s.classes.findIndex(c => c.id === cid);
        if (ci >= 0) s.classes[ci].students = s.students.filter(x => x.classId === cid).length;
      }
    });
  }
  function addStudent(stu){
    addStudents([stu], stu.classId);
  }
  function updateStudent(sid, patch){
    setStore(s => {
      const i = s.students.findIndex(x => x.id === sid);
      if (i >= 0) Object.assign(s.students[i], patch);
    });
  }
  function getStudentsByClass(cid){
    return state.students.filter(s => s.classId === cid).sort((a,b) => a.no - b.no);
  }

  // ---- Schedule actions ----
  function setScheduleSlot(day, slot, classId){
    setStore(s => {
      s.schedule = s.schedule.filter(it => !(it.day === day && it.slot === slot));
      if (classId){
        s.schedule.push({day, slot, classId});
      }
    });
  }
  function clearScheduleSlot(day, slot){
    setStore(s => { s.schedule = s.schedule.filter(it => !(it.day === day && it.slot === slot)); });
  }

  // ---- Notes actions ----
  function addNote(classId, note){
    setStore(s => {
      s.notes[classId] = s.notes[classId] || [];
      s.notes[classId].unshift({
        id: "n" + Date.now(),
        kind: note.kind || "note",
        text: note.text || "",
        dueDate: note.dueDate || null,
        createdAt: Date.now(),
        pinned: !!note.pinned,
      });
    });
  }
  function updateNote(classId, noteId, patch){
    setStore(s => {
      const arr = s.notes[classId] || [];
      const i = arr.findIndex(n => n.id === noteId);
      if (i >= 0) Object.assign(arr[i], patch);
    });
  }
  function removeNote(classId, noteId){
    setStore(s => {
      s.notes[classId] = (s.notes[classId] || []).filter(n => n.id !== noteId);
    });
  }
  function togglePinNote(classId, noteId){
    setStore(s => {
      const arr = s.notes[classId] || [];
      const i = arr.findIndex(n => n.id === noteId);
      if (i >= 0) arr[i].pinned = !arr[i].pinned;
    });
  }
  function getNotes(classId){
    return state.notes[classId] || [];
  }

  // ---- Class actions ----
  const CLASS_COLORS = ["#4F46E5","#0EA5E9","#10B981","#F59E0B","#EC4899","#8B5CF6","#06B6D4","#F97316","#22C55E","#EF4444"];
  function updateClass(cid, patch){
    setStore(s => {
      const i = s.classes.findIndex(c => c.id === cid);
      if (i >= 0) Object.assign(s.classes[i], patch);
    });
  }
  function addClass(cls){
    setStore(s => {
      const id = cls.id || ("cls" + Date.now());
      const color = cls.color || CLASS_COLORS[s.classes.length % CLASS_COLORS.length];
      s.classes.push({
        id,
        name: cls.name || "ห้องเรียนใหม่",
        code: cls.code || ("CLS-" + (s.classes.length+1)),
        color,
        students: cls.students || 0,
        room: cls.room || "—",
        time: cls.time || "—",
      });
    });
  }
  function removeClass(cid){
    setStore(s => {
      s.classes = s.classes.filter(c => c.id !== cid);
      // Remove students in this class
      const remaining = s.students.filter(x => x.classId !== cid);
      const removed = s.students.filter(x => x.classId === cid);
      removed.forEach(x => delete s.scores[x.id]);
      s.students = remaining;
      // Clean up schedule slots for this class
      s.schedule = s.schedule.filter(it => it.classId !== cid);
      // Clean attendance
      delete s.attendance[cid];
      delete s.notes[cid];
    });
  }
  function addClasses(items){
    setStore(s => {
      items.forEach((c, i) => {
        const id = c.id || ("cls" + Date.now() + "_" + i);
        const color = c.color || CLASS_COLORS[(s.classes.length + i) % CLASS_COLORS.length];
        s.classes.push({
          id,
          name: c.name || "ห้องเรียนใหม่",
          code: c.code || ("CLS-" + (s.classes.length + i + 1)),
          color,
          students: parseInt(c.students) || 0,
          room: c.room || "—",
          time: c.time || "—",
        });
      });
    });
  }
  function setAttendance(classId, dateISO, sid, status){
    setStore(s => {
      s.attendance[classId] = s.attendance[classId] || {};
      s.attendance[classId][dateISO] = s.attendance[classId][dateISO] || {};
      s.attendance[classId][dateISO][sid] = status;
    });
  }
  function setAttendanceBulk(classId, dateISO, mapping){
    setStore(s => {
      s.attendance[classId] = s.attendance[classId] || {};
      s.attendance[classId][dateISO] = {...mapping};
    });
  }
  function getAttendance(classId, dateISO){
    const c = state.attendance[classId];
    return (c && c[dateISO]) || null;
  }

  // Total score and grade helpers based on dynamic categories
  function studentTotal(sid){
    const sc = state.scores[sid] || {};
    return state.categories.reduce((sum, c) => sum + (sc[c.key] || 0), 0);
  }
  function maxTotal(){
    return state.categories.reduce((sum, c) => sum + c.max, 0);
  }
  function studentGradePercent(sid){
    const max = maxTotal();
    return max ? (studentTotal(sid) / max) * 100 : 0;
  }

  Object.assign(window, {
    useStore, setStore,
    addCategory, removeCategory, updateScore,
    addStudents, addStudent, updateStudent, removeStudent, getStudentsByClass,
    updateClass, addClass, removeClass, addClasses, CLASS_COLORS,
    setScheduleSlot, clearScheduleSlot,
    setAttendance, setAttendanceBulk, getAttendance,
    addNote, updateNote, removeNote, togglePinNote, getNotes,
    studentTotal, maxTotal, studentGradePercent
  });
})();
