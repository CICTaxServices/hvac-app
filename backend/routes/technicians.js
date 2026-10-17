const express = require('express');
const technicianController = require('../controllers/technicianController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes require authentication and technician role
router.use(authMiddleware);
router.use(authorize(['technician']));

// Submit work completion
router.post('/work-completion', upload.single('serial_photo'), technicianController.submitWorkCompletion);

// Get my tickets
router.get('/my-tickets', technicianController.getMyTickets);

// Get profile
router.get('/profile', technicianController.getProfile);

module.exports = router;
