const pool = require('../config/db');

/**
 * GET /events
 * List all upcoming events
 */
const listEvents = async (req, res) => {
  try {
    const [events] = await pool.query(
      `SELECT id, title, description, date, total_capacity, remaining_tickets, created_at
       FROM events
       WHERE date >= NOW()
       ORDER BY date ASC`
    );
    return res.json({ success: true, data: events });
  } catch (error) {
    console.error('listEvents error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /events
 * Create a new event
 */
const createEvent = async (req, res) => {
  const { title, description, date, total_capacity } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO events (title, description, date, total_capacity, remaining_tickets)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description || null, date, total_capacity, total_capacity]
    );

    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('createEvent error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /events/:id/attendance
 * Check attendance using a booking code
 */
const recordAttendance = async (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const { code } = req.body;

  try {
    // Validate the booking code belongs to this event
    const [bookings] = await pool.query(
      `SELECT b.id, b.user_id, b.event_id, b.tickets_count, b.booking_date, u.name, u.email
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.unique_code = ? AND b.event_id = ?`,
      [code, eventId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid code or booking not found for this event' });
    }

    const booking = bookings[0];

    // Check if already attended
    const [existing] = await pool.query(
      'SELECT id FROM event_attendance WHERE booking_id = ?',
      [booking.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for this booking',
        data: { tickets_booked: booking.tickets_count },
      });
    }

    // Record attendance
    await pool.query(
      `INSERT INTO event_attendance (booking_id, user_id, event_id) VALUES (?, ?, ?)`,
      [booking.id, booking.user_id, eventId]
    );

    return res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: {
        user: { id: booking.user_id, name: booking.name, email: booking.email },
        tickets_booked: booking.tickets_count,
        booking_date: booking.booking_date,
      },
    });
  } catch (error) {
    console.error('recordAttendance error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { listEvents, createEvent, recordAttendance };
