const pool = require('../config/database');
const fs = require('fs');
const { logActivity } = require('../utils/helpers');
const { sendOwnerVerificationEmail } = require('../utils/emailService');

// Submit work completion with serial number photo
exports.submitWorkCompletion = async (req, res) => {
  try {
    const { ticket_id, work_description, parts_used, hours_worked, serial_number } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Serial number photo is required' });
    }

    // Verify ticket exists
    const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticket_id]);
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // Convert uploaded file to base64
    let photoDataUrl;
    try {
      console.log('Reading file from:', req.file.path);
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64String = fileBuffer.toString('base64');

      // Determine MIME type
      const mimeType = req.file.mimetype || 'image/jpeg';

      // Store as data URL: data:image/jpeg;base64,...
      photoDataUrl = `data:${mimeType};base64,${base64String}`;
      console.log('Successfully converted file to base64, size:', base64String.length);
    } catch (fileErr) {
      console.error('Error converting file to base64:', fileErr);
      throw new Error(`Failed to process uploaded file: ${fileErr.message}`);
    }

    // Create work log
    const workLogResult = await pool.query(
      `INSERT INTO work_logs
       (ticket_id, technician_id, work_description, parts_used, hours_worked, serial_number, serial_photo_path, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        ticket_id,
        req.user.id,
        work_description,
        parts_used,
        hours_worked,
        serial_number,
        photoDataUrl,
      ]
    );

    // Delete the temporary uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.warn('Could not delete temporary file:', err.message);
    }

    // Update ticket status to completed
    await pool.query(
      'UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2',
      ['completed', ticket_id]
    );

    // Get owner/admin to send verification email
    const ownerResult = await pool.query('SELECT * FROM users WHERE role = $1 LIMIT 1', [
      'admin',
    ]);

    if (ownerResult.rows.length > 0) {
      const owner = ownerResult.rows[0];
      await sendOwnerVerificationEmail(owner, ticket, workLogResult.rows[0]);
    }

    // Log activity
    await logActivity(
      pool,
      req.user.id,
      ticket_id,
      'Work Completed',
      `Serial: ${serial_number}, Hours: ${hours_worked}`
    );

    res.status(201).json({
      message: 'Work submitted successfully. Awaiting owner verification.',
      work_log: workLogResult.rows[0],
    });
  } catch (error) {
    console.error('Submit work error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get technician's assigned tickets
exports.getMyTickets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, w.id as work_log_id
       FROM tickets t
       LEFT JOIN work_logs w ON t.id = w.ticket_id
       WHERE t.assigned_technician_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    res.json({ tickets: result.rows });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get technician profile
exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    res.json({ technician: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
