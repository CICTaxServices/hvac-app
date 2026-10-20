const pool = require('../config/database');
const { generateTicketNumber, logActivity } = require('../utils/helpers');
const {
  sendTechnicianAssignmentEmail,
  sendOwnerVerificationEmail,
  sendBillingEmail,
} = require('../utils/emailService');

// Create new service ticket
exports.createTicket = async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      property_address,
      service_type,
      description,
    } = req.body;

    const ticketNumber = generateTicketNumber();

    const result = await pool.query(
      `INSERT INTO tickets
       (ticket_number, customer_name, customer_email, customer_phone, property_address, service_type, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        ticketNumber,
        customer_name,
        customer_email,
        customer_phone,
        property_address,
        service_type,
        description,
        req.user.id,
      ]
    );

    const ticket = result.rows[0];
    await logActivity(
      pool,
      req.user.id,
      ticket.id,
      'Ticket Created',
      `Customer: ${customer_name}, Service: ${service_type}`
    );

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket,
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all tickets with filters
exports.getTickets = async (req, res) => {
  try {
    const { status, assigned_technician_id } = req.query;
    let query = `SELECT t.*, w.id as work_log_id
                 FROM tickets t
                 LEFT JOIN work_logs w ON t.id = w.ticket_id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND t.status = $' + (params.length + 1);
      params.push(status);
    }

    if (assigned_technician_id) {
      query += ' AND t.assigned_technician_id = $' + (params.length + 1);
      params.push(assigned_technician_id);
    }

    // Technicians only see their assigned tickets with 'assigned' status (ready to work on)
    if (req.user.role === 'technician') {
      query += ' AND t.assigned_technician_id = $' + (params.length + 1);
      params.push(req.user.id);
      query += ' AND t.status = \'assigned\'';
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ tickets: result.rows });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single ticket
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // Get work logs
    const workLogsResult = await pool.query('SELECT * FROM work_logs WHERE ticket_id = $1', [id]);

    // Get price assignments
    const priceResult = await pool.query(
      'SELECT * FROM price_assignments WHERE ticket_id = $1',
      [id]
    );

    // Get billing info
    const billingResult = await pool.query('SELECT * FROM billing WHERE ticket_id = $1', [id]);

    res.json({
      ticket,
      work_logs: workLogsResult.rows,
      price_assignments: priceResult.rows,
      billing: billingResult.rows,
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign ticket to technician
exports.assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_technician_id } = req.body;

    // Get technician info
    const techResult = await pool.query('SELECT * FROM users WHERE id = $1 AND role = $2', [
      assigned_technician_id,
      'technician',
    ]);

    if (techResult.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Get ticket info
    const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];
    const technician = techResult.rows[0];

    // Update ticket
    await pool.query('UPDATE tickets SET assigned_technician_id = $1, status = $2, updated_at = NOW() WHERE id = $3', [
      assigned_technician_id,
      'assigned',
      id,
    ]);

    // Send email to technician
    await sendTechnicianAssignmentEmail(technician, ticket);

    // Log activity
    await logActivity(
      pool,
      req.user.id,
      id,
      'Technician Assigned',
      `Assigned to ${technician.name}`
    );

    res.json({ message: 'Technician assigned and notified' });
  } catch (error) {
    console.error('Assign technician error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
