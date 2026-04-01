const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /bookings
 * Book a ticket for a user (with transaction + race condition protection)
 */
const createBooking = async (req, res) => {
  const { user_id, event_id, tickets_count = 1 } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock the event row to prevent race conditions
    const [events] = await connection.query(
      'SELECT id, remaining_tickets, date FROM events WHERE id = ? FOR UPDATE',
      [event_id]
    );

    if (events.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const event = events[0];

    // Check event is in the future
    if (new Date(event.date) <= new Date()) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Cannot book tickets for past events' });
    }

    // Check ticket availability
    if (event.remaining_tickets < tickets_count) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: `Not enough tickets available. Only ${event.remaining_tickets} ticket(s) left.`,
      });
    }

    // Validate user exists
    const [users] = await connection.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Deduct tickets
    await connection.query(
      'UPDATE events SET remaining_tickets = remaining_tickets - ? WHERE id = ?',
      [tickets_count, event_id]
    );

    // Generate unique booking code
    const unique_code = uuidv4();

    // Create booking
    const [result] = await connection.query(
      `INSERT INTO bookings (user_id, event_id, unique_code, tickets_count) VALUES (?, ?, ?, ?)`,
      [user_id, event_id, unique_code, tickets_count]
    );

    await connection.commit();

    const [rows] = await pool.query(
      `SELECT b.*, e.title as event_title, e.date as event_date, u.name as user_name
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       JOIN users u ON u.id = b.user_id
       WHERE b.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed',
      data: rows[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error('createBooking error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

/**
 * GET /users/:id/bookings
 * Get all bookings for a user
 */
const getUserBookings = async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  try {
    // Verify user exists
    const [users] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [bookings] = await pool.query(
      `SELECT b.id, b.unique_code, b.tickets_count, b.booking_date,
              e.id as event_id, e.title as event_title, e.description as event_description,
              e.date as event_date, e.total_capacity, e.remaining_tickets
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: {
        user: users[0],
        bookings,
      },
    });
  } catch (error) {
    console.error('getUserBookings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { createBooking, getUserBookings };
