const pool = require('../config/database');
const { logActivity } = require('../utils/helpers');
const { sendBillingEmail } = require('../utils/emailService');

// Verify work and assign price
exports.assignPrice = async (req, res) => {
  try {
    const { ticket_id, work_log_id, price, notes } = req.body;

    if (!price || price <= 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }

    // Verify ticket and work log exist
    const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticket_id]);
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const workLogResult = await pool.query('SELECT * FROM work_logs WHERE id = $1', [work_log_id]);
    if (workLogResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work log not found' });
    }

    // Create price assignment
    const priceResult = await pool.query(
      `INSERT INTO price_assignments
       (ticket_id, work_log_id, assigned_by, price, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [ticket_id, work_log_id, req.user.id, price, notes]
    );

    // Create billing record
    const billingResult = await pool.query(
      `INSERT INTO billing
       (ticket_id, price_assignment_id, amount)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [ticket_id, priceResult.rows[0].id, price]
    );

    // Update ticket status to verified
    await pool.query(
      'UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2',
      ['verified', ticket_id]
    );

    // Get accounting user to send billing email
    const accountingResult = await pool.query(
      'SELECT email FROM users WHERE role = $1 LIMIT 1',
      ['accounting']
    );

    if (accountingResult.rows.length > 0) {
      const ticket = ticketResult.rows[0];
      await sendBillingEmail(accountingResult.rows[0].email, ticket, billingResult.rows[0]);
    }

    // Log activity
    await logActivity(
      pool,
      req.user.id,
      ticket_id,
      'Price Assigned',
      `Price: $${price}`
    );

    res.status(201).json({
      message: 'Price assigned and billing initiated',
      price_assignment: priceResult.rows[0],
      billing: billingResult.rows[0],
    });
  } catch (error) {
    console.error('Assign price error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get completed tickets awaiting verification
exports.getPendingVerification = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, w.id as work_log_id, w.serial_number, w.work_description
       FROM tickets t
       LEFT JOIN work_logs w ON t.id = w.ticket_id
       WHERE t.status = $1
       ORDER BY t.updated_at DESC`,
      ['completed']
    );

    res.json({ tickets: result.rows });
  } catch (error) {
    console.error('Get pending verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users (for admin panel)
exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, phone, is_active FROM users WHERE is_active = true ORDER BY created_at DESC'
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Deactivate user
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deactivated', user: result.rows[0] });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete ticket
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ticket exists
    const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Delete related records first (cascade)
    await pool.query('DELETE FROM activity_logs WHERE ticket_id = $1', [id]);
    await pool.query('DELETE FROM billing WHERE ticket_id = $1', [id]);
    await pool.query('DELETE FROM price_assignments WHERE ticket_id = $1', [id]);
    await pool.query('DELETE FROM work_logs WHERE ticket_id = $1', [id]);

    // Delete the ticket
    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);

    // Log activity
    await logActivity(
      pool,
      req.user.id,
      id,
      'Ticket Deleted',
      `Ticket: ${result.rows[0].ticket_number}`
    );

    res.json({ message: 'Ticket deleted successfully', ticket: result.rows[0] });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const pendingResult = await pool.query(
      'SELECT COUNT(*) as count FROM tickets WHERE status = $1',
      ['pending']
    );

    const completedResult = await pool.query(
      'SELECT COUNT(*) as count FROM tickets WHERE status = $1',
      ['completed']
    );

    const verifiedResult = await pool.query(
      'SELECT COUNT(*) as count FROM tickets WHERE status = $1',
      ['verified']
    );

    const totalRevenueResult = await pool.query(
      'SELECT SUM(amount) as total FROM billing WHERE billing_status != $1',
      ['pending']
    );

    res.json({
      stats: {
        pending_tickets: parseInt(pendingResult.rows[0].count),
        completed_tickets: parseInt(completedResult.rows[0].count),
        verified_tickets: parseInt(verifiedResult.rows[0].count),
        total_revenue: parseFloat(totalRevenueResult.rows[0].total) || 0,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
