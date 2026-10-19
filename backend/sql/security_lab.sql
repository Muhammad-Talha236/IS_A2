
-- ============================================
-- UNI ASSESS - SQL INJECTION SECURITY LAB
-- Easy, Intermediate and Advanced SQL Injection
-- Fictional data only
-- ============================================


-- ============================================
-- 1. EASY SQL INJECTION - TA LOGIN
-- ============================================

CREATE TABLE IF NOT EXISTS lab_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'TA'
);

INSERT INTO lab_users (name, email, password, role)
VALUES
(
    'Demo TA',
    'demo.ta@uniassess.test',
    'DemoPass123',
    'TA'
),
(
    'Demo Teacher',
    'teacher@uniassess.test',
    'TeacherPass123',
    'TEACHER'
),
(
    'Demo Student',
    'student@uniassess.test',
    'StudentPass123',
    'STUDENT'
)
ON CONFLICT (email) DO NOTHING;


-- ============================================
-- 2. INTERMEDIATE SQL INJECTION
-- BOOLEAN-BASED GRADE AVAILABILITY
-- ============================================

CREATE TABLE IF NOT EXISTS lab_grade_availability (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(30) UNIQUE NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO lab_grade_availability
(course_code, course_name, published)
VALUES
(
    'CS301',
    'Database Systems',
    TRUE
),
(
    'CS302',
    'Computer Networks',
    FALSE
),
(
    'CS303',
    'Information Security',
    TRUE
),
(
    'CS304',
    'Compiler Construction',
    FALSE
)
ON CONFLICT (course_code) DO NOTHING;


-- ============================================
-- 3. ADVANCED SQL INJECTION
-- STUDENT RECORDS
-- ============================================

CREATE TABLE IF NOT EXISTS lab_student_records (
    id SERIAL PRIMARY KEY,
    roll_no VARCHAR(30) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    result VARCHAR(30) NOT NULL
);

INSERT INTO lab_student_records
(roll_no, student_name, result)
VALUES
(
    '23F-1001',
    'Ali Khan',
    'PASS'
),
(
    '23F-1002',
    'Sara Ahmed',
    'PASS'
),
(
    '23F-1003',
    'Hamza Malik',
    'FAIL'
),
(
    '23F-1004',
    'Ayesha Noor',
    'PASS'
)
ON CONFLICT (roll_no) DO NOTHING;


-- ============================================
-- 4. FICTIONAL SENSITIVE RECORDS
-- FOR ADVANCED SQL INJECTION DEMONSTRATION
-- ============================================

CREATE TABLE IF NOT EXISTS lab_demo_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    demo_secret VARCHAR(150) NOT NULL
);

INSERT INTO lab_demo_credentials
(username, demo_secret)
VALUES
(
    'demo_admin',
    'FICTIONAL-ADMIN-KEY-001'
),
(
    'demo_teacher',
    'FICTIONAL-TEACHER-KEY-002'
),
(
    'demo_ta',
    'FICTIONAL-TA-KEY-003'
)
ON CONFLICT (username) DO NOTHING;


-- ============================================
-- 5. VERIFY DATA
-- ============================================

SELECT 'lab_users' AS table_name, COUNT(*) AS total
FROM lab_users

UNION ALL

SELECT 'lab_grade_availability', COUNT(*)
FROM lab_grade_availability

UNION ALL

SELECT 'lab_student_records', COUNT(*)
FROM lab_student_records

UNION ALL

SELECT 'lab_demo_credentials', COUNT(*)
FROM lab_demo_credentials;
