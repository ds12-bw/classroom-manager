// Reactive store backed by Supabase.
// - In-memory cache mirrors DB rows for snappy UI (same shape as before)
// - All mutations: optimistic update locally + write-through to Supabase
// - bootstrap() fetches all tables on app start; seeds mock data if DB is empty
// - Realtime subscription refetches on any external change (multi-device sync)

(function(){
  const state = {
    classes: [],
    students: [],
    categories: {},   // [classId] = [{key, label, max, color, dueDate, description}]
    schedule: [],
    scores: {},       // [sid][catKey] = number
    attendance: {},   // [classId][dateISO][sid] = "present"|"absent"|"leave"|"skip"
    notes: {},        // [classId] = [{id, kind, text, dueDate, createdAt, pinned}]
    loaded: false,
    loading: false,
    error: null,
  };

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

  const sb = () => window.sb;

  function dbError(label, err){
    console.error(`[db] ${label}`, err);
  }

  // ============================================================
  // Bootstrap & seed
  // ============================================================

  async function bootstrap(){
    if (state.loaded || state.loading) return;
    setStore({ loading: true, error: null });
    try {
      if (!sb()) throw new Error("Supabase client not initialized — check config.js");
      const { data: existing, error: e1 } = await sb().from('classes').select('id').limit(1);
      if (e1) throw e1;
      if (!existing || existing.length === 0) {
        console.log("[bootstrap] empty DB — seeding mock data...");
        await seedDatabase();
      }
      await fetchAll();
      setStore({ loaded: true, loading: false });
      if (window.SUPABASE_REALTIME !== false) subscribeRealtime();
      console.log("[bootstrap] ready");
    } catch (err){
      console.error('[bootstrap] failed', err);
      setStore({ loading: false, error: err.message || String(err) });
    }
  }

  async function seedDatabase(){
    const c = sb();
    let r;

    r = await c.from('classes').insert(window.CLASSES.map(x => ({
      id: x.id, name: x.name, code: x.code, color: x.color, room: x.room, time: x.time
    })));
    if (r.error) throw new Error("seed classes: " + r.error.message);

    // Seed categories for each class
    const categoryRows = [];
    window.CLASSES.forEach(cls => {
      window.SCORE_CATS.forEach((x, i) => {
        categoryRows.push({
          class_id: cls.id,
          key: x.key,
          label: x.label,
          max: x.max,
          color: x.color,
          sort_order: i,
          due_date: x.dueDate || null,
          description: x.description || ''
        });
      });
    });
    r = await c.from('score_categories').insert(categoryRows);
    if (r.error) throw new Error("seed score_categories: " + r.error.message);

    const studentRows = window.STUDENTS.map(s => ({
      id: s.id, class_id: s.classId, no: s.no, prefix: s.prefix, name: s.name,
      surname: s.surname, nick: s.nick, avatar: s.avatar, comment: s.comment || '',
      att_present: s.attendance.present, att_absent: s.attendance.absent,
      att_leave: s.attendance.leave, att_skip: s.attendance.skip
    }));
    for (let i = 0; i < studentRows.length; i += 100){
      r = await c.from('students').insert(studentRows.slice(i, i+100));
      if (r.error) throw new Error("seed students: " + r.error.message);
    }

    const scoreRows = [];
    window.STUDENTS.forEach(s => {
      window.SCORE_CATS.forEach(cat => {
        scoreRows.push({
          student_id: s.id,
          class_id: s.classId,
          category_key: cat.key,
          value: s[cat.key] || 0
        });
      });
    });
    for (let i = 0; i < scoreRows.length; i += 200){
      r = await c.from('scores').insert(scoreRows.slice(i, i+200));
      if (r.error) throw new Error("seed scores: " + r.error.message);
    }

    r = await c.from('schedule').insert(window.SCHEDULE.map(x => ({
      day: x.day, slot: x.slot, class_id: x.classId
    })));
    if (r.error) throw new Error("seed schedule: " + r.error.message);

    const now = Date.now();
    r = await c.from('notes').insert([
      {id:"n1", class_id:"m401", kind:"assignment", text:"ให้การบ้านบทที่ 3 ฟังก์ชันเลขยกกำลัง ส่งวันศุกร์", due_date:"2026-05-23", pinned:false, created_at: new Date(now - 86400000).toISOString()},
      {id:"n2", class_id:"m401", kind:"announce",   text:"พรุ่งนี้นัดประชุมผู้ปกครองหลังเลิกเรียน เวลา 16:00 ที่ห้องประชุม 2", due_date:null, pinned:true,  created_at: new Date(now - 14400000).toISOString()},
      {id:"n3", class_id:"m401", kind:"note",       text:"นักเรียนเริ่มเข้าใจการแยกตัวประกอบดีขึ้น ต้องเสริมโจทย์ปัญหาให้ฝึกเพิ่ม", due_date:null, pinned:false, created_at: new Date(now - 3600000).toISOString()},
      {id:"n4", class_id:"m602", kind:"exam",       text:"สอบกลางภาค บทที่ 1-3 วันที่ 18 มิถุนายน 09:00-11:00 ห้อง 401", due_date:"2026-06-18", pinned:true, created_at: new Date(now - 7200000).toISOString()},
    ]);
    if (r.error) throw new Error("seed notes: " + r.error.message);
  }

  async function fetchAll(){
    const c = sb();
    const [classes, students, categories, scores, attendance, notes, schedule] = await Promise.all([
      c.from('classes').select('*').order('created_at'),
      c.from('students').select('*').order('no'),
      c.from('score_categories').select('*').order('sort_order'),
      c.from('scores').select('*'),
      c.from('attendance').select('*'),
      c.from('notes').select('*').order('created_at', { ascending: false }),
      c.from('schedule').select('*'),
    ]);
    const results = {classes, students, categories, scores, attendance, notes, schedule};
    for (const [name, r] of Object.entries(results)){
      if (r.error) throw new Error(`fetch ${name}: ${r.error.message}`);
    }

    setStore(s => {
      const stuList = students.data.map(x => ({
        id: x.id, classId: x.class_id, no: x.no, prefix: x.prefix, name: x.name,
        surname: x.surname, nick: x.nick, avatar: x.avatar, comment: x.comment || '',
        attendance: { present: x.att_present||0, absent: x.att_absent||0, leave: x.att_leave||0, skip: x.att_skip||0 }
      }));
      s.classes = classes.data.map(x => ({
        id: x.id, name: x.name, code: x.code, color: x.color,
        room: x.room, time: x.time,
        students: stuList.filter(st => st.classId === x.id).length,
      }));
      s.students = stuList;
      // Index categories by classId
      s.categories = {};
      categories.data.forEach(x => {
        const cid = x.class_id;
        if (!s.categories[cid]) s.categories[cid] = [];
        s.categories[cid].push({ key: x.key, label: x.label, max: x.max, color: x.color, dueDate: x.due_date, description: x.description || '' });
      });
      s.scores = {};
      stuList.forEach(st => {
        s.scores[st.id] = {};
        const cats = s.categories[st.classId] || [];
        cats.forEach(cat => { s.scores[st.id][cat.key] = 0; });
      });
      scores.data.forEach(r => {
        s.scores[r.student_id] = s.scores[r.student_id] || {};
        s.scores[r.student_id][r.category_key] = Number(r.value);
      });
      s.attendance = {};
      attendance.data.forEach(r => {
        s.attendance[r.class_id] = s.attendance[r.class_id] || {};
        s.attendance[r.class_id][r.date] = s.attendance[r.class_id][r.date] || {};
        s.attendance[r.class_id][r.date][r.student_id] = r.status;
      });
      s.notes = {};
      notes.data.forEach(r => {
        s.notes[r.class_id] = s.notes[r.class_id] || [];
        s.notes[r.class_id].push({
          id: r.id, kind: r.kind, text: r.text, dueDate: r.due_date,
          createdAt: new Date(r.created_at).getTime(), pinned: r.pinned
        });
      });
      s.schedule = schedule.data.map(x => ({ day: x.day, slot: x.slot, classId: x.class_id }));
    });
  }

  let realtimeChannel = null;
  let refetchTimer = null;
  function scheduleRefetch(){
    clearTimeout(refetchTimer);
    refetchTimer = setTimeout(() => { fetchAll().catch(e => console.error('[realtime refetch]', e)); }, 400);
  }
  function subscribeRealtime(){
    if (realtimeChannel) return;
    realtimeChannel = sb().channel('public-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => scheduleRefetch())
      .subscribe(status => { if (status === 'SUBSCRIBED') console.log('[realtime] subscribed'); });
  }

  // ============================================================
  // Categories
  // ============================================================
  function addCategory(classId, label, max, color, dueDate, description){
    const key = "c" + Date.now();
    const cat = { key, label, max, color: color || "#8B5CF6", dueDate: dueDate || null, description: description || '' };
    setStore(s => {
      s.categories[classId] = s.categories[classId] || [];
      s.categories[classId].push(cat);
      // Only initialize scores for students in this class
      s.students.filter(st => st.classId === classId).forEach(st => {
        s.scores[st.id] = s.scores[st.id] || {};
        s.scores[st.id][key] = 0;
      });
    });
    const catCount = (state.categories[classId] || []).length;
    sb().from('score_categories').insert({
      class_id: classId,
      key,
      label,
      max,
      color: cat.color,
      due_date: dueDate || null,
      description: description || '',
      sort_order: catCount
    }).then(r => { if (r.error) dbError('addCategory', r.error); });
  }
  function removeCategory(classId, key){
    setStore(s => {
      if (s.categories[classId]) {
        s.categories[classId] = s.categories[classId].filter(c => c.key !== key);
      }
      Object.keys(s.scores).forEach(sid => { delete s.scores[sid][key]; });
    });
    sb().from('score_categories').delete().eq('class_id', classId).eq('key', key)
      .then(r => { if (r.error) dbError('removeCategory', r.error); });
  }
  function updateScore(sid, key, value){
    setStore(s => { s.scores[sid] = s.scores[sid] || {}; s.scores[sid][key] = value; });
    // Find student to get classId
    const stu = state.students.find(s => s.id === sid);
    const classId = stu ? stu.classId : null;
    if (!classId) {
      dbError('updateScore', 'student not found');
      return;
    }
    sb().from('scores').upsert(
      { student_id: sid, class_id: classId, category_key: key, value, updated_at: new Date().toISOString() },
      { onConflict: 'student_id,class_id,category_key' }
    ).then(r => { if (r.error) dbError('updateScore', r.error); });
  }

  // ============================================================
  // Students
  // ============================================================
  function addStudents(newOnes, classId){
    const inserted = [];
    setStore(s => {
      const cid = classId || (s.classes[0] && s.classes[0].id);
      const existingInClass = s.students.filter(x => x.classId === cid).length;
      newOnes.forEach((n, i) => {
        const stu = {
          id: String(n.id || "").trim() || ("ST" + Date.now() + Math.random().toString(36).substring(2,9) + String(i).padStart(2,"0")),
          no: n.no || (existingInClass + i + 1),
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
        const cats = s.categories[stu.classId] || [];
        cats.forEach(c => { s.scores[stu.id][c.key] = 0; });
        inserted.push(stu);
      });
      const ci = s.classes.findIndex(c => c.id === cid);
      if (ci >= 0) s.classes[ci].students = s.students.filter(x => x.classId === cid).length;
    });
    (async () => {
      const c = sb();
      const rows = inserted.map(s => ({
        id: s.id, class_id: s.classId, no: s.no, prefix: s.prefix, name: s.name,
        surname: s.surname, nick: s.nick, avatar: s.avatar, comment: s.comment,
        att_present: 0, att_absent: 0, att_leave: 0, att_skip: 0
      }));
      const r1 = await c.from('students').insert(rows);
      if (r1.error) return dbError('addStudents', r1.error);
      const scoreRows = [];
      inserted.forEach(stu => {
        const cats = state.categories[stu.classId] || [];
        cats.forEach(cat => {
          scoreRows.push({ student_id: stu.id, class_id: stu.classId, category_key: cat.key, value: 0 });
        });
      });
      if (scoreRows.length){
        const r2 = await c.from('scores').insert(scoreRows);
        if (r2.error) dbError('addStudents scores', r2.error);
      }
    })();
  }
  function addStudent(stu){ addStudents([stu], stu.classId); }
  function removeStudent(sid){
    setStore(s => {
      const stu = s.students.find(x => x.id === sid);
      const cid = stu && stu.classId;
      s.students = s.students.filter(x => x.id !== sid);
      delete s.scores[sid];
      if (cid){
        let n = 1;
        s.students.forEach(x => { if (x.classId === cid) x.no = n++; });
        const ci = s.classes.findIndex(c => c.id === cid);
        if (ci >= 0) s.classes[ci].students = s.students.filter(x => x.classId === cid).length;
      }
    });
    sb().from('students').delete().eq('id', sid)
      .then(r => { if (r.error) dbError('removeStudent', r.error); });
  }
  function updateStudent(sid, patch){
    setStore(s => {
      const i = s.students.findIndex(x => x.id === sid);
      if (i >= 0) Object.assign(s.students[i], patch);
    });
    const dbPatch = {};
    if ('no' in patch) dbPatch.no = patch.no;
    if ('prefix' in patch) dbPatch.prefix = patch.prefix;
    if ('name' in patch) dbPatch.name = patch.name;
    if ('surname' in patch) dbPatch.surname = patch.surname;
    if ('nick' in patch) dbPatch.nick = patch.nick;
    if ('avatar' in patch) dbPatch.avatar = patch.avatar;
    if ('comment' in patch) dbPatch.comment = patch.comment;
    if ('classId' in patch) dbPatch.class_id = patch.classId;
    if ('id' in patch && patch.id !== sid){
      console.warn('[updateStudent] changing primary key id is not persisted to DB');
    }
    if (Object.keys(dbPatch).length === 0) return;
    sb().from('students').update(dbPatch).eq('id', sid)
      .then(r => { if (r.error) dbError('updateStudent', r.error); });
  }
  function getStudentsByClass(cid){
    return state.students.filter(s => s.classId === cid).sort((a,b) => a.no - b.no);
  }

  // ============================================================
  // Schedule
  // ============================================================
  function setScheduleSlot(day, slot, classId){
    setStore(s => {
      s.schedule = s.schedule.filter(it => !(it.day === day && it.slot === slot));
      if (classId) s.schedule.push({day, slot, classId});
    });
    (async () => {
      const c = sb();
      const r1 = await c.from('schedule').delete().eq('day', day).eq('slot', slot);
      if (r1.error) return dbError('clearSlot', r1.error);
      if (classId){
        const r2 = await c.from('schedule').insert({ day, slot, class_id: classId });
        if (r2.error) dbError('setScheduleSlot', r2.error);
      }
    })();
  }
  function clearScheduleSlot(day, slot){
    setStore(s => { s.schedule = s.schedule.filter(it => !(it.day === day && it.slot === slot)); });
    sb().from('schedule').delete().eq('day', day).eq('slot', slot)
      .then(r => { if (r.error) dbError('clearScheduleSlot', r.error); });
  }

  // ============================================================
  // Notes
  // ============================================================
  function addNote(classId, note){
    const id = "n" + Date.now();
    const ts = Date.now();
    const obj = {
      id, kind: note.kind || "note", text: note.text || "",
      dueDate: note.dueDate || null,
      createdAt: ts, pinned: !!note.pinned,
    };
    setStore(s => {
      s.notes[classId] = s.notes[classId] || [];
      s.notes[classId].unshift(obj);
    });
    sb().from('notes').insert({
      id, class_id: classId, kind: obj.kind, text: obj.text,
      due_date: obj.dueDate, pinned: obj.pinned,
      created_at: new Date(ts).toISOString(),
    }).then(r => { if (r.error) dbError('addNote', r.error); });
  }
  function updateNote(classId, noteId, patch){
    setStore(s => {
      const arr = s.notes[classId] || [];
      const i = arr.findIndex(n => n.id === noteId);
      if (i >= 0) Object.assign(arr[i], patch);
    });
    const dbPatch = {};
    if ('kind' in patch) dbPatch.kind = patch.kind;
    if ('text' in patch) dbPatch.text = patch.text;
    if ('dueDate' in patch) dbPatch.due_date = patch.dueDate;
    if ('pinned' in patch) dbPatch.pinned = patch.pinned;
    if (Object.keys(dbPatch).length === 0) return;
    sb().from('notes').update(dbPatch).eq('id', noteId)
      .then(r => { if (r.error) dbError('updateNote', r.error); });
  }
  function removeNote(classId, noteId){
    setStore(s => { s.notes[classId] = (s.notes[classId] || []).filter(n => n.id !== noteId); });
    sb().from('notes').delete().eq('id', noteId)
      .then(r => { if (r.error) dbError('removeNote', r.error); });
  }
  function togglePinNote(classId, noteId){
    const arr = state.notes[classId] || [];
    const note = arr.find(n => n.id === noteId);
    if (!note) return;
    const newPinned = !note.pinned;
    setStore(s => {
      const a = s.notes[classId] || [];
      const i = a.findIndex(n => n.id === noteId);
      if (i >= 0) a[i].pinned = newPinned;
    });
    sb().from('notes').update({ pinned: newPinned }).eq('id', noteId)
      .then(r => { if (r.error) dbError('togglePinNote', r.error); });
  }
  function getNotes(classId){ return state.notes[classId] || []; }

  // ============================================================
  // Classes
  // ============================================================
  const CLASS_COLORS = ["#4F46E5","#0EA5E9","#10B981","#F59E0B","#EC4899","#8B5CF6","#06B6D4","#F97316","#22C55E","#EF4444"];

  function updateClass(cid, patch){
    setStore(s => {
      const i = s.classes.findIndex(c => c.id === cid);
      if (i >= 0) Object.assign(s.classes[i], patch);
    });
    const dbPatch = {};
    if ('name' in patch) dbPatch.name = patch.name;
    if ('code' in patch) dbPatch.code = patch.code;
    if ('color' in patch) dbPatch.color = patch.color;
    if ('room' in patch) dbPatch.room = patch.room;
    if ('time' in patch) dbPatch.time = patch.time;
    if (Object.keys(dbPatch).length === 0) return;
    sb().from('classes').update(dbPatch).eq('id', cid)
      .then(r => { if (r.error) dbError('updateClass', r.error); });
  }
  function addClass(cls){
    const id = cls.id || ("cls" + Date.now());
    const color = cls.color || CLASS_COLORS[state.classes.length % CLASS_COLORS.length];
    const obj = {
      id,
      name: cls.name || "ห้องเรียนใหม่",
      code: cls.code || ("CLS-" + (state.classes.length + 1)),
      color, students: cls.students || 0,
      room: cls.room || "—",
      time: cls.time || "—",
    };
    setStore(s => { s.classes.push(obj); });
    sb().from('classes').insert({
      id: obj.id, name: obj.name, code: obj.code, color: obj.color, room: obj.room, time: obj.time
    }).then(r => { if (r.error) dbError('addClass', r.error); });
  }
  function removeClass(cid){
    setStore(s => {
      s.classes = s.classes.filter(c => c.id !== cid);
      const removed = s.students.filter(x => x.classId === cid);
      removed.forEach(x => delete s.scores[x.id]);
      s.students = s.students.filter(x => x.classId !== cid);
      s.schedule = s.schedule.filter(it => it.classId !== cid);
      delete s.attendance[cid];
      delete s.notes[cid];
    });
    sb().from('classes').delete().eq('id', cid)
      .then(r => { if (r.error) dbError('removeClass', r.error); });
  }
  function addClasses(items){
    const inserted = [];
    setStore(s => {
      items.forEach((c, i) => {
        const id = c.id || ("cls" + Date.now() + "_" + i);
        const color = c.color || CLASS_COLORS[(s.classes.length + i) % CLASS_COLORS.length];
        const obj = {
          id,
          name: c.name || "ห้องเรียนใหม่",
          code: c.code || ("CLS-" + (s.classes.length + i + 1)),
          color, students: parseInt(c.students) || 0,
          room: c.room || "—",
          time: c.time || "—",
        };
        s.classes.push(obj);
        inserted.push(obj);
      });
    });
    sb().from('classes').insert(inserted.map(o => ({
      id: o.id, name: o.name, code: o.code, color: o.color, room: o.room, time: o.time
    }))).then(r => { if (r.error) dbError('addClasses', r.error); });
  }

  // ============================================================
  // Attendance
  // ============================================================
  function setAttendance(classId, dateISO, sid, status){
    setStore(s => {
      s.attendance[classId] = s.attendance[classId] || {};
      s.attendance[classId][dateISO] = s.attendance[classId][dateISO] || {};
      s.attendance[classId][dateISO][sid] = status;
    });
    sb().from('attendance').upsert(
      { class_id: classId, date: dateISO, student_id: sid, status, updated_at: new Date().toISOString() },
      { onConflict: 'class_id,date,student_id' }
    ).then(r => { if (r.error) dbError('setAttendance', r.error); });
  }
  function setAttendanceBulk(classId, dateISO, mapping){
    setStore(s => {
      s.attendance[classId] = s.attendance[classId] || {};
      s.attendance[classId][dateISO] = {...mapping};
    });
    const rows = Object.entries(mapping).map(([sid, status]) => ({
      class_id: classId, date: dateISO, student_id: sid, status,
      updated_at: new Date().toISOString()
    }));
    if (!rows.length) return;
    sb().from('attendance').upsert(rows, { onConflict: 'class_id,date,student_id' })
      .then(r => { if (r.error) dbError('setAttendanceBulk', r.error); });
  }
  function getAttendance(classId, dateISO){
    const c = state.attendance[classId];
    return (c && c[dateISO]) || null;
  }
  function clearAttendance(classId, dateISO){
    setStore(s => {
      if (s.attendance[classId]) delete s.attendance[classId][dateISO];
    });
    sb().from('attendance').delete().eq('class_id', classId).eq('date', dateISO)
      .then(r => { if (r.error) dbError('clearAttendance', r.error); });
  }

  // ============================================================
  // Computed
  // ============================================================
  function studentTotal(sid, classId){
    const sc = state.scores[sid] || {};
    const cats = classId ? (state.categories[classId] || []) : Object.values(state.categories).flat();
    return cats.reduce((sum, c) => sum + (sc[c.key] || 0), 0);
  }
  function maxTotal(classId){
    const cats = classId ? (state.categories[classId] || []) : Object.values(state.categories).flat();
    return cats.reduce((sum, c) => sum + c.max, 0);
  }
  function studentGradePercent(sid, classId){
    const max = maxTotal(classId);
    return max ? (studentTotal(sid, classId) / max) * 100 : 0;
  }

  Object.assign(window, {
    useStore, setStore, bootstrap,
    addCategory, removeCategory, updateScore,
    addStudents, addStudent, updateStudent, removeStudent, getStudentsByClass,
    updateClass, addClass, removeClass, addClasses, CLASS_COLORS,
    setScheduleSlot, clearScheduleSlot,
    setAttendance, setAttendanceBulk, getAttendance, clearAttendance,
    addNote, updateNote, removeNote, togglePinNote, getNotes,
    studentTotal, maxTotal, studentGradePercent
  });
})();
