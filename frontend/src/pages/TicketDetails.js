import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function TicketDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const fetchTicketDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/tickets/${id}`, { headers });
      setTicket(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch ticket details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header">
        <div className="container">
          <div className="header-content">
            <h1>Ticket Details</h1>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="spinner"></div>
        ) : (
          ticket && (
            <>
              <div className="card">
                <h2>Ticket Number: {ticket.ticket.ticket_number}</h2>
                <div className="grid grid-2">
                  <div>
                    <p>
                      <strong>Customer:</strong> {ticket.ticket.customer_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {ticket.ticket.customer_email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {ticket.ticket.customer_phone}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Address:</strong> {ticket.ticket.property_address}
                    </p>
                    <p>
                      <strong>Service Type:</strong> {ticket.ticket.service_type}
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`badge badge-${ticket.ticket.status}`}>
                        {ticket.ticket.status}
                      </span>
                    </p>
                  </div>
                </div>
                <p style={{ marginTop: '1rem' }}>
                  <strong>Description:</strong> {ticket.ticket.description}
                </p>
              </div>

              {ticket.work_logs && ticket.work_logs.length > 0 && (
                <div className="card">
                  <h3>Work Completed</h3>
                  {ticket.work_logs.map((log, idx) => (
                    <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #ccc' }}>
                      <p>
                        <strong>Description:</strong> {log.work_description}
                      </p>
                      <p>
                        <strong>Parts Used:</strong> {log.parts_used}
                      </p>
                      <p>
                        <strong>Hours Worked:</strong> {log.hours_worked}
                      </p>
                      <p>
                        <strong>Equipment Serial:</strong> {log.serial_number}
                      </p>
                      <p>
                        <strong>Completed:</strong> {new Date(log.completed_at).toLocaleString()}
                      </p>
                      {log.serial_photo_path && (
                        <div style={{ marginTop: '1rem' }}>
                          <strong>Serial Photo:</strong>
                          <div style={{ marginTop: '0.5rem' }}>
                            <img
                              src={log.serial_photo_path}
                              alt="Serial Number Photo"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '400px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                              }}
                            />
                          </div>
                          <a
                            href={log.serial_photo_path}
                            download="serial-photo.jpg"
                            style={{ marginTop: '0.5rem', display: 'inline-block' }}
                          >
                            ⬇️ Download Photo
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {ticket.price_assignments && ticket.price_assignments.length > 0 && (
                <div className="card">
                  <h3>Price Assignment</h3>
                  {ticket.price_assignments.map((price, idx) => (
                    <div key={idx}>
                      <p>
                        <strong>Amount:</strong> ${parseFloat(price.price).toFixed(2)}
                      </p>
                      <p>
                        <strong>Notes:</strong> {price.notes}
                      </p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span className="badge badge-verified">{price.status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {ticket.billing && ticket.billing.length > 0 && (
                <div className="card">
                  <h3>Billing</h3>
                  {ticket.billing.map((bill, idx) => (
                    <div key={idx}>
                      <p>
                        <strong>Invoice #:</strong> {bill.invoice_number || 'Pending'}
                      </p>
                      <p>
                        <strong>Amount:</strong> ${parseFloat(bill.amount).toFixed(2)}
                      </p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span className="badge badge-pending">{bill.billing_status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}

export default TicketDetails;
