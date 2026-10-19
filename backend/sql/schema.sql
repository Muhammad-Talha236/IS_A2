-- Fictional CSRF demo profile; preserve any existing profile and recovery email.
CREATE TABLE IF NOT EXISTS lab_profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  recovery_email VARCHAR(150) NOT NULL
);

INSERT INTO lab_profiles (name, email, recovery_email)
VALUES ('Demo TA', 'demo.ta@cfd.nu.edu.pk', 'demo.recovery@uniassess.test')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(24) NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  teacher_name VARCHAR(120) NOT NULL,
  program VARCHAR(30) NOT NULL,
  section VARCHAR(12) NOT NULL
);

CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  max_marks INT NOT NULL CHECK (max_marks > 0)
);

CREATE TABLE IF NOT EXISTS discussions (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  author VARCHAR(80) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO courses (code, title, teacher_name, program, section) VALUES
('CS301-A', 'Data Structures', 'Dr. Sara Ahmed', 'BSCS', 'A'),
('CS401-B', 'Information Security', 'Dr. Hamza Ali', 'BSCS', 'B'),
('SE302-A', 'Database Systems', 'Dr. Rabia Khan', 'BSSE', 'A')
ON CONFLICT (code) DO NOTHING;

INSERT INTO assessments(course_id, title, max_marks)
SELECT c.id, vals.title, vals.max_marks
FROM (VALUES
 ('CS301-A','Assignment 1',20), ('CS301-A','Quiz 1',10),
 ('CS401-B','Lab 1',15), ('SE302-A','Quiz 1',10)
) AS vals(code,title,max_marks)
JOIN courses c ON c.code=vals.code
WHERE NOT EXISTS (
 SELECT 1 FROM assessments a WHERE a.course_id=c.id AND a.title=vals.title
);
