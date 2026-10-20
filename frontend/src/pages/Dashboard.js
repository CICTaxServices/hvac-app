import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [billing, setBilling] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [billingStatus, setBillingStatus] = useState({});
  const [invoiceNumber, setInvoiceNumber] = useState({});

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
      const response = await axios.get(`${API_URL}/admin/pending-invoices`, { headers });
      setBilling(response.data.invoices);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch billing');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBillingStatus = async (billingId, status, ticketId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${API_URL}/admin/billing/${billingId}/status`,
        {
          billing_status: status,
          invoice_number: invoiceNumber[billingId] || null,
        },
        { headers }
      );

      setInvoiceNumber((prev) => ({
        ...prev,
        [billingId]: '',
      }));

      fetchBilling();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update billing status');
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
              <div className="grid grid-2">
                {billing.map((invoice) => (
                  <div key={invoice.id} className="card" style={{ backgroundColor: '#f9fafb' }}>
                    <h3>{invoice.ticket_number}</h3>
                    <p>
                      <strong>Customer:</strong> {invoice.customer_name}
                    </p>
                    <p>
                      <strong>Address:</strong> {invoice.property_address}
                    </p>
                    <p>
                      <strong>Price:</strong> ${invoice.price ? parseFloat(invoice.price).toFixed(2) : 'N/A'}
                    </p>
                    <p>
                      <strong>Current Status:</strong>{' '}
                      <span className={`badge badge-${invoice.billing_status || 'pending'}`}>
                        {invoice.billing_status || 'pending'}
                      </span>
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/ticket/${invoice.id}`)}
                      style={{ marginBottom: '1rem', width: '100%' }}
                    >
                      View Details
                    </button>
                    <div className="form-group">
                      <label>Invoice Number</label>
                      <input
                        type="text"
                        placeholder="e.g., INV-2024-001"
                        value={invoiceNumber[invoice.billing_id] || ''}
                        onChange={(e) =>
                          setInvoiceNumber({
                            ...invoiceNumber,
                            [invoice.billing_id]: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          handleUpdateBillingStatus(
                            invoice.billing_id,
                            'sent',
                            invoice.id
                          )
                        }
                        style={{ flex: 1 }}
                      >
                        Mark Sent
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() =>
                          handleUpdateBillingStatus(
                            invoice.billing_id,
                            'paid',
                            invoice.id
                          )
                        }
                        style={{ flex: 1 }}
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
