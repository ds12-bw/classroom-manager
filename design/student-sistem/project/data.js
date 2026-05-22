// Mock data for the Thai classroom manager prototype

const THAI_FIRST_NAMES = [
  "ธนกร","ปวีณา","ศุภกร","กัญญา","ณัฐวุฒิ","พิมพ์ชนก","ภัทรพล","อรปรียา","สิรวิชญ์","ชลธิชา",
  "ปุณณภพ","ธัญชนก","กฤตเมธ","วิภาดา","อนุชา","ปริยากร","ธีรภัทร","สุพิชชา","ภาณุพงศ์","ณัฐนรี",
  "พงศกร","ชนิกานต์","อภิวิชญ์","กชกร","ธนภัทร","พิชญาภา","ก้องภพ","ปาณิสรา","วรเมธ","ณิชาภัทร",
  "กิตติพศ","ธิดารัตน์","พีรพัฒน์","วรัญญา","เตชินท์","ปภาวรินทร์","สรวิชญ์","ลภัสรดา","ธีร์ธวัช","อนัญญา",
  "ภคิน","พิมลพรรณ","ศุภวิชญ์","ชญาดา","ปกรณ์"
];
const THAI_SURNAMES = [
  "ใจดี","รักเรียน","ทองสุข","แสงทอง","พรหมศรี","ศรีสวัสดิ์","วงศ์ทอง","ดอนสวัสดิ์","พิมพ์ทอง","ศรีสุข",
  "นิลรัตน์","ใจกล้า","พงษ์เพชร","สุขสบาย","ทองคำ","สงวนพันธ์","วงค์ดี","พรหมเดช","แก้วใส","ศรีทอง"
];
const THAI_NICK_NAMES = [
  "ฟ้า","ก้อง","มิว","แพร","ปาล์ม","ใบเฟิร์น","ต้นน้ำ","ฝน","พีพี","แก้ม",
  "บูม","ปุ๊ก","แทน","ตูน","กาย","มะปราง","ติ๊ก","นุ่น","กล้า","นิว",
  "เจมส์","ใบบัว","กบ","อิง","อาร์ม","อันอัน","ภพ","พลอย","กัน","ป๊อบ",
  "เก่ง","ดาว","มาร์ค","เจน","พีท","อิ่ม","โต้ง","เนย","โอม","นัท",
  "ปาย","พิม","วิน","ออม","มาวิน"
];

function seedRand(seed){ let s=seed; return ()=>{ s=(s*9301+49297)%233280; return s/233280; }; }

const CLASSES = [
  {id:"m401", name:"คณิตศาสตร์ ม.4/1", code:"MATH-401", color:"#4F46E5", students:0, room:"ห้อง 312", time:"08:30 - 09:20"},
  {id:"m402", name:"คณิตศาสตร์ ม.4/2", code:"MATH-402", color:"#0EA5E9", students:0, room:"ห้อง 312", time:"09:30 - 10:20"},
  {id:"m501", name:"คณิตศาสตร์ ม.5/1", code:"MATH-501", color:"#10B981", students:0, room:"ห้อง 405", time:"10:30 - 11:20"},
  {id:"m601", name:"แคลคูลัส ม.6/1",   code:"CALC-601", color:"#F59E0B", students:0, room:"ห้อง 401", time:"13:00 - 13:50"},
  {id:"m602", name:"แคลคูลัส ม.6/2",   code:"CALC-602", color:"#EC4899", students:0, room:"ห้อง 401", time:"14:00 - 14:50"},
];

// Build students per class with full identity fields
function buildStudents(){
  const out = [];
  let g = 0; // global counter for ids
  const r = seedRand(7);

  // Per-class counts (different sizes to look realistic)
  const counts = {m401: 12, m402: 11, m501: 10, m601: 8, m602: 8};

  Object.entries(counts).forEach(([classId, n]) => {
    for (let i = 0; i < n; i++){
      const fi = (g * 7) % THAI_FIRST_NAMES.length;
      const si = (g * 11) % THAI_SURNAMES.length;
      const ni = (g * 3) % THAI_NICK_NAMES.length;
      const isFemale = (g + fi) % 2 === 0;
      const level = classId[0] === "m" ? (classId[1] === "4" ? "ม.ต้น" : "ม.ปลาย") : "";
      // Prefix by class level + gender
      const isMatthayom6 = classId[1] === "6" || classId[1] === "5";
      const prefix = isMatthayom6
        ? (isFemale ? "นางสาว" : "นาย")
        : (isFemale ? "เด็กหญิง" : "เด็กชาย");
      out.push({
        id: "65" + String(10000 + g).padStart(5,"0"),
        no: i + 1,
        prefix,
        name: THAI_FIRST_NAMES[fi],
        surname: THAI_SURNAMES[si],
        nick: THAI_NICK_NAMES[ni],
        classId,
        avatar: ["#FDE68A","#FBCFE8","#BFDBFE","#C7D2FE","#BBF7D0","#FED7AA","#DDD6FE","#FECACA"][g % 8],
        assignment: Math.round(15 + r()*10),
        quiz: Math.round(12 + r()*8),
        group: Math.round(10 + r()*5),
        final: Math.round(25 + r()*15),
        attendance: {present: 24+Math.floor(r()*4), absent: Math.floor(r()*3), leave: Math.floor(r()*2), skip: Math.floor(r()*2)},
        comment: g % 7 === 0 ? "ตั้งใจเรียนมากขึ้น ช่วยเพื่อนในกลุ่มได้ดี" : (g % 11 === 0 ? "ขาดเรียนบ่อย ต้องติดตาม" : "")
      });
      g++;
    }
  });
  return out;
}

const STUDENTS = buildStudents();

// Update class student counts based on actual roster
CLASSES.forEach(c => { c.students = STUDENTS.filter(s => s.classId === c.id).length; });

const SCHEDULE = [
  {day:0, slot:0, classId:"m401"},
  {day:0, slot:1, classId:"m402"},
  {day:0, slot:3, classId:"m601"},
  {day:1, slot:0, classId:"m501"},
  {day:1, slot:2, classId:"m602"},
  {day:2, slot:0, classId:"m401"},
  {day:2, slot:1, classId:"m402"},
  {day:3, slot:1, classId:"m501"},
  {day:3, slot:3, classId:"m601"},
  {day:3, slot:4, classId:"m602"},
  {day:4, slot:0, classId:"m401"},
  {day:4, slot:2, classId:"m501"},
];

const PERIODS = ["08:30","09:30","10:30","13:00","14:00"];
const DAYS = ["จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์"];

const SCORE_CATS = [
  {key:"assignment", label:"งานเก็บ", max:25, color:"#4F46E5"},
  {key:"quiz",       label:"สอบย่อย", max:20, color:"#0EA5E9"},
  {key:"group",      label:"งานกลุ่ม", max:15, color:"#10B981"},
  {key:"final",      label:"ปลายภาค", max:40, color:"#F59E0B"},
];

const ATT_STATUS = {
  present: {label:"มา",   color:"#10B981", bg:"#D1FAE5", letter:"ม"},
  absent:  {label:"ขาด",  color:"#EF4444", bg:"#FEE2E2", letter:"ข"},
  leave:   {label:"ลา",   color:"#F59E0B", bg:"#FEF3C7", letter:"ล"},
  skip:    {label:"หนี",  color:"#F97316", bg:"#FFEDD5", letter:"น"},
};

const PREFIX_OPTIONS = ["เด็กชาย", "เด็กหญิง", "นาย", "นางสาว"];

// Helpers
function studentFullName(s){
  return `${s.prefix ? s.prefix + " " : ""}${s.name}${s.surname ? " " + s.surname : ""}`;
}
function studentShortName(s){
  return `${s.name}${s.surname ? " " + s.surname : ""}`;
}
function gradeFor(t){
  if(t>=80)return"A"; if(t>=75)return"B+"; if(t>=70)return"B";
  if(t>=65)return"C+"; if(t>=60)return"C"; if(t>=55)return"D+";
  if(t>=50)return"D"; return"F";
}

Object.assign(window, {
  STUDENTS, CLASSES, SCHEDULE, PERIODS, DAYS, SCORE_CATS, ATT_STATUS,
  PREFIX_OPTIONS, studentFullName, studentShortName, gradeFor
});
