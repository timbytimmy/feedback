CREATE DATABASE CUSTOMERFEEDBACK;
USE CUSTOMERFEEDBACK;

-- Admins Table
CREATE TABLE admins (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Feedbacks Table
CREATE TABLE feedbacks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    feedback TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admins (with password for 'password')
INSERT INTO admins (name, email, password)
VALUES 
('Admin User', 'admin@admin.com', 'password'); 

--example feedback
INSERT INTO feedbacks (name, email, feedback)
VALUES 
('John Doe', 'john@example.com', 'This is a test feedback');