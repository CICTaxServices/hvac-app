import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ user, onLogout }) {
  const [billing, setBilling] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/admin/pending-verification`, { headers });
      setBilling(response.data.tickets);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch billing');
    } finally {
      setLoading(false);
    }
  };

  const Header = () => (
    <div className="header">
      <div className="container">
        <div className="header-content">
          <h1>Accounting Dashboard</h1>
          <div className="nav-links">
            <span>Welcome, {user.name}</span>
            <button onClick={onLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Header />

      <div className="container" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="card">
            <h2>Ready to Bill</h2>
            {billing.length === 0 ? (
              <p>No tickets ready for billing</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Customer</th>
                    <th>Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>{ticket.ticket_number}</td>
                      <td>{ticket.customer_name}</td>
                      <td>{ticket.property_address}</td>
                      <td>
                        <span className={`badge badge-${ticket.status}`}>
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
