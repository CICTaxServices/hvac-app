import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TechnicianDashboard({ user, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [workLog, setWorkLog] = useState({
    work_description: '',
    parts_used: '',
    hours_worked: '',
    serial_number: '',
  });
  const [photo, setPhoto] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/technicians/my-tickets`, { headers });
      setTickets(response.data.tickets);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async (ticketId) => {
    if (!photo) {
      setError('Serial number photo is required');
      return;
    }

    if (!workLog.serial_number) {
      setError('Serial number is required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('ticket_id', ticketId);
      formData.append('work_description', workLog.work_description);
      formData.append('parts_used', workLog.parts_used);
      formData.append('hours_worked', workLog.hours_worked);
      formData.append('serial_number', workLog.serial_number);
      formData.append('serial_photo', photo);

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };

      await axios.post(`${API_URL}/technicians/work-completion`, formData, { headers });

      setWorkLog({
        work_description: '',
        parts_used: '',
        hours_worked: '',
        serial_number: '',
      });
      setPhoto(null);
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit work');
    }
  };

  const Header = () => (
    <div className="header">
      <div className="container">
        <div className="header-content">
          <h1>Technician Dashboard</h1>
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
          <>
            {selectedTicket ? (
              <div className="card">
                <h2>Complete Work - Ticket {selectedTicket.ticket_number}</h2>
                <p>
                  <strong>Customer:</strong> {selectedTicket.customer_name}
                </p>
                <p>
                  <strong>Address:</strong> {selectedTicket.property_address}
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmitWork(selectedTicket.id);
                  }}
                >
                  <div className="form-group">
                    <label>Work Description *</label>
                    <textarea
                      value={workLog.work_description}
                      onChange={(e) =>
                        setWorkLog({ ...workLog, work_description: e.target.value })
                      }
                      required
                      placeholder="Describe the work performed..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Parts Used</label>
                    <input
                      type="text"
                      value={workLog.parts_used}
                      onChange={(e) => setWorkLog({ ...workLog, parts_used: e.target.value })}
                      placeholder="e.g., Compressor, Filter, Refrigerant"
                    />
                  </div>

                  <div className="form-group">
                    <label>Hours Worked *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={workLog.hours_worked}
                      onChange={(e) =>
                        setWorkLog({ ...workLog, hours_worked: e.target.value })
                      }
                      required
                      placeholder="2.5"
                    />
                  </div>

                  <div className="form-group">
                    <label>Equipment Serial Number *</label>
                    <input
                      type="text"
                      value={workLog.serial_number}
                      onChange={(e) =>
                        setWorkLog({ ...workLog, serial_number: e.target.value })
                      }
                      required
                      placeholder="e.g., AC-2024-12345"
                    />
                  </div>

                  <div className="form-group">
                    <label>Serial Number Photo * (MANDATORY)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhoto(e.target.files[0])}
                      required
                    />
                    {photo && <p style={{ marginTop: '0.5rem', color: '#10b981' }}>✓ Photo selected</p>}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-success">
                      Submit Work
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedTicket(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="card">
                <h2>My Assigned Service Calls</h2>
                {tickets.length === 0 ? (
                  <p>No assigned tickets</p>
                ) : (
                  <div className="grid grid-2">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="card">
                        <h3>{ticket.ticket_number}</h3>
                        <p>
                          <strong>Customer:</strong> {ticket.customer_name}
                        </p>
                        <p>
                          <strong>Address:</strong> {ticket.property_address}
                        </p>
                        <p>
                          <strong>Service Type:</strong> {ticket.service_type}
                        </p>
                        <p style={{ marginBottom: '1.5rem' }}>
                          <strong>Status:</strong>{' '}
                          <span className={`badge badge-${ticket.status}`}>
                            {ticket.status}
                          </span>
                        </p>
                        {ticket.status === 'assigned' && (
                          <button
                            className="btn btn-primary btn-block"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            Complete & Submit Work
                          </button>
                        )}
                        {ticket.status === 'completed' && (
                          <p style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                            ⏳ Awaiting owner verification
                          </p>
                        )}
                        {ticket.status === 'verified' && (
                          <p style={{ color: '#10b981', fontWeight: 'bold' }}>
                            ✓ Work verified and priced
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TechnicianDashboard;
