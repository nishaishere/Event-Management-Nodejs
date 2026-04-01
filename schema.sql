-- ============================================================
-- Mini Event Management System - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS event_booking;
USE event_booking;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATETIME NOT NULL,
    total_capacity INT UNSIGNED NOT NULL,
    remaining_tickets INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_capacity CHECK (remaining_tickets <= total_capacity)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    event_id INT UNSIGNED NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unique_code VARCHAR(36) NOT NULL UNIQUE,
    tickets_count INT UNSIGNED NOT NULL DEFAULT 1,
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Event Attendance table
CREATE TABLE IF NOT EXISTS event_attendance (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    event_id INT UNSIGNED NOT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_event ON bookings(event_id);
CREATE INDEX idx_bookings_code ON bookings(unique_code);
CREATE INDEX idx_attendance_event ON event_attendance(event_id);

-- ============================================================
-- Sample seed data
-- ============================================================

INSERT INTO users (name, email) VALUES
    ('Alice Johnson', 'alice@example.com'),
    ('Bob Smith', 'bob@example.com'),
    ('Carol White', 'carol@example.com');

INSERT INTO events (title, description, date, total_capacity, remaining_tickets) VALUES
    ('Tech Conference 2025', 'Annual technology conference covering AI, cloud, and more.', '2025-09-15 09:00:00', 500, 500),
    ('Node.js Workshop', 'Hands-on workshop for backend developers.', '2025-08-20 10:00:00', 50, 50),
    ('Startup Pitch Night', 'An evening of innovation and entrepreneurship.', '2025-07-30 18:00:00', 200, 200);
