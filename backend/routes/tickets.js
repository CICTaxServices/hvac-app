const express = require('express');
const ticketController = require('../controllers/ticketController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create ticket (admin only)
router.post('/', authorize(['admin']), ticketController.createTicket);

// Get all tickets
router.get('/', ticketController.getTickets);

// Get single ticket
router.get('/:id', ticketController.getTicketById);

// Assign technician (admin only)
router.put('/:id/assign', authorize(['admin']), ticketController.assignTechnician);

module.exports = router;
