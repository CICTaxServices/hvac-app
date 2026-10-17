const generateTicketNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `HVAC-${year}${month}${day}-${random}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const logActivity = async (pool, userId, ticketId, action, details) => {
  try {
    await pool.query(
      'INSERT INTO activity_logs (user_id, ticket_id, action, details) VALUES ($1, $2, $3, $4)',
      [userId, ticketId, action, details]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

const getStatusBadgeColor = (status) => {
  const colors = {
    pending: 'yellow',
    assigned: 'blue',
    completed: 'orange',
    verified: 'green',
    billed: 'gray',
  };
  return colors[status] || 'gray';
};

module.exports = {
  generateTicketNumber,
  formatCurrency,
  logActivity,
  getStatusBadgeColor,
};
