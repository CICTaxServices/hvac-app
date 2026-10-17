const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Routes that require admin role only
router.post('/price-assignment', authorize(['admin']), adminController.assignPrice);
router.get('/pending-verification', authorize(['admin']), adminController.getPendingVerification);
router.get('/users', authorize(['admin']), adminController.getAllUsers);
router.put('/users/:id/deactivate', authorize(['admin']), adminController.deactivateUser);
router.put('/users/:id', authorize(['admin']), adminController.updateUser);
router.delete('/users/:id', authorize(['admin']), adminController.deleteUser);
router.delete('/tickets/:id', authorize(['admin']), adminController.deleteTicket);
router.get('/stats', authorize(['admin']), adminController.getDashboardStats);

// Routes that allow both admin and accounting
router.get('/pending-invoices', authorize(['admin', 'accounting']), adminController.getPendingInvoices);
router.put('/billing/:id/status', authorize(['admin', 'accounting']), adminController.updateBillingStatus);

// Get dashboard stats
router.get('/stats', adminController.getDashboardStats);

module.exports = router;
