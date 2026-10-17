const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize(['admin']));

// Assign price to completed work
router.post('/price-assignment', adminController.assignPrice);

// Get pending verification
router.get('/pending-verification', adminController.getPendingVerification);

// Get all users
router.get('/users', adminController.getAllUsers);

// Deactivate user
router.put('/users/:id/deactivate', adminController.deactivateUser);

// Delete ticket
router.delete('/tickets/:id', adminController.deleteTicket);

// Get pending invoices (verified tickets)
router.get('/pending-invoices', adminController.getPendingInvoices);

// Update billing status
router.put('/billing/:id/status', adminController.updateBillingStatus);

// Get dashboard stats
router.get('/stats', adminController.getDashboardStats);

module.exports = router;
