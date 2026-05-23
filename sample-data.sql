-- Sample data for testing student mobile screen
-- Run this in Supabase SQL Editor

-- Insert sample classes
INSERT INTO classes (id, code, name, room, time, color, students) VALUES
('m401', 'MATH-401', 'คณิตศาสตร์ ม.4/1', '401', '08:30-09:20', '#4F46E5', 5),
('s501', 'SCI-501', 'วิทยาศาสตร์ ม.5/1', '501', '10:30-11:20', '#10B981', 5)
ON CONFLICT (id) DO NOTHING;

-- Insert sample students
INSERT INTO students (id, no, prefix, name, surname, classId, avatar, comment) VALUES
('650001', 1, 'เด็กชาย', 'สมชาย', 'ใจดี', 'm401', 'A', 'นักเรียนเรียนดี'),
('650002', 2, 'เด็กหญิง', 'สมหญิง', 'รักเรียน', 'm401', 'B', 'ตั้งใจเรียน'),
('650003', 3, 'เด็กชาย', 'ธนกร', 'ทองดี', 'm401', 'C', 'ขยันเรียน'),
('650004', 4, 'เด็กหญิง', 'วิชญา', 'สวยงาม', 'm401', 'D', 'สดใส'),
('650005', 5, 'เด็กชาย', 'มนัส', 'วิชิตวงศ์', 'm401', 'E', 'เข้าร่วมกิจกรรม')
ON CONFLICT (id) DO NOTHING;

-- Insert sample categories (if not exists)
INSERT INTO categories (key, label, max, color) VALUES
('test1', 'คะแนนสอบ', 20, '#4F46E5'),
('hw', 'การบ้าน', 10, '#10B981'),
('attend', 'เข้าเรียน', 10, '#F59E0B'),
('project', 'โครงงาน', 20, '#EC4899'),
('participation', 'มีส่วนร่วม', 10, '#06B6D4'),
('quiz', 'แบบทดสอบ', 10, '#8B5CF6'),
('presentation', 'นำเสนอ', 10, '#F97316'),
('behavior', 'พฤติกรรม', 10, '#14B8A6')
ON CONFLICT (key) DO NOTHING;

-- Insert sample scores for students
INSERT INTO scores (studentId, categoryKey, value) VALUES
-- Student 1 (650001)
('650001', 'test1', 18),
('650001', 'hw', 9),
('650001', 'attend', 10),
('650001', 'project', 18),
('650001', 'participation', 8),
('650001', 'quiz', 9),
('650001', 'presentation', 9),
('650001', 'behavior', 10),
-- Student 2 (650002)
('650002', 'test1', 16),
('650002', 'hw', 8),
('650002', 'attend', 9),
('650002', 'project', 16),
('650002', 'participation', 7),
('650002', 'quiz', 8),
('650002', 'presentation', 8),
('650002', 'behavior', 9),
-- Student 3 (650003)
('650003', 'test1', 14),
('650003', 'hw', 7),
('650003', 'attend', 8),
('650003', 'project', 14),
('650003', 'participation', 6),
('650003', 'quiz', 7),
('650003', 'presentation', 7),
('650003', 'behavior', 8),
-- Student 4 (650004)
('650004', 'test1', 17),
('650004', 'hw', 9),
('650004', 'attend', 10),
('650004', 'project', 17),
('650004', 'participation', 8),
('650004', 'quiz', 9),
('650004', 'presentation', 8),
('650004', 'behavior', 10),
-- Student 5 (650005)
('650005', 'test1', 15),
('650005', 'hw', 8),
('650005', 'attend', 7),
('650005', 'project', 15),
('650005', 'participation', 7),
('650005', 'quiz', 8),
('650005', 'presentation', 8),
('650005', 'behavior', 9)
ON CONFLICT DO NOTHING;

-- Insert sample attendance (last 7 days)
INSERT INTO attendance (classId, date, studentId, status) VALUES
-- Class m401 - Student 650001
('m401', CURRENT_DATE - INTERVAL '6 days', '650001', 'present'),
('m401', CURRENT_DATE - INTERVAL '5 days', '650001', 'present'),
('m401', CURRENT_DATE - INTERVAL '4 days', '650001', 'present'),
('m401', CURRENT_DATE - INTERVAL '3 days', '650001', 'present'),
('m401', CURRENT_DATE - INTERVAL '2 days', '650001', 'present'),
('m401', CURRENT_DATE - INTERVAL '1 day', '650001', 'present'),
('m401', CURRENT_DATE, '650001', 'present'),
-- Student 650002
('m401', CURRENT_DATE - INTERVAL '6 days', '650002', 'present'),
('m401', CURRENT_DATE - INTERVAL '5 days', '650002', 'present'),
('m401', CURRENT_DATE - INTERVAL '4 days', '650002', 'absent'),
('m401', CURRENT_DATE - INTERVAL '3 days', '650002', 'present'),
('m401', CURRENT_DATE - INTERVAL '2 days', '650002', 'present'),
('m401', CURRENT_DATE - INTERVAL '1 day', '650002', 'present'),
('m401', CURRENT_DATE, '650002', 'present'),
-- Student 650003
('m401', CURRENT_DATE - INTERVAL '6 days', '650003', 'present'),
('m401', CURRENT_DATE - INTERVAL '5 days', '650003', 'leave'),
('m401', CURRENT_DATE - INTERVAL '4 days', '650003', 'present'),
('m401', CURRENT_DATE - INTERVAL '3 days', '650003', 'present'),
('m401', CURRENT_DATE - INTERVAL '2 days', '650003', 'absent'),
('m401', CURRENT_DATE - INTERVAL '1 day', '650003', 'present'),
('m401', CURRENT_DATE, '650003', 'present'),
-- Student 650004
('m401', CURRENT_DATE - INTERVAL '6 days', '650004', 'present'),
('m401', CURRENT_DATE - INTERVAL '5 days', '650004', 'present'),
('m401', CURRENT_DATE - INTERVAL '4 days', '650004', 'present'),
('m401', CURRENT_DATE - INTERVAL '3 days', '650004', 'present'),
('m401', CURRENT_DATE - INTERVAL '2 days', '650004', 'present'),
('m401', CURRENT_DATE - INTERVAL '1 day', '650004', 'present'),
('m401', CURRENT_DATE, '650004', 'present'),
-- Student 650005
('m401', CURRENT_DATE - INTERVAL '6 days', '650005', 'present'),
('m401', CURRENT_DATE - INTERVAL '5 days', '650005', 'present'),
('m401', CURRENT_DATE - INTERVAL '4 days', '650005', 'skip'),
('m401', CURRENT_DATE - INTERVAL '3 days', '650005', 'present'),
('m401', CURRENT_DATE - INTERVAL '2 days', '650005', 'present'),
('m401', CURRENT_DATE - INTERVAL '1 day', '650005', 'absent'),
('m401', CURRENT_DATE, '650005', 'present')
ON CONFLICT DO NOTHING;
