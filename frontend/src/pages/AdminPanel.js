import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminPanel({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [pendingVerification, setPendingVerification] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTicket, setNewTicket] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    property_address: '',
    service_type: '',
    description: '',
  });
  const [assignedTech, setAssignedTech] = useState({});
  const [priceAssignment, setPriceAssignment] = useState({});
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [billingStatus, setBillingStatus] = useState({});
  const [invoiceNumber, setInvoiceNumber] = useState({});

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'tickets') {
        // Fetch both tickets and technicians for the dropdown
        const [ticketsRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/tickets`, { headers }),
          axios.get(`${API_URL}/admin/users`, { headers }),
        ]);
        // Filter out verified tickets
        setTickets(ticketsRes.data.tickets.filter((t) => t.status !== 'verified' && t.status !== 'invoiced'));
        setTechnicians(usersRes.data.users.filter((u) => u.role === 'technician'));
      } else if (activeTab === 'verification') {
        const response = await axios.get(`${API_URL}/admin/pending-verification`, { headers });
        setPendingVerification(response.data.tickets);
      } else if (activeTab === 'invoicing') {
        const response = await axios.get(`${API_URL}/admin/pending-invoices`, { headers });
        setPendingInvoices(response.data.invoices);
      } else if (activeTab === 'users') {
        const response = await axios.get(`${API_URL}/admin/users`, { headers });
        setAllUsers(response.data.users);
      } else if (activeTab === 'technicians') {
        const response = await axios.get(`${API_URL}/admin/users`, { headers });
        setTechnicians(response.data.users.filter((u) => u.role === 'technician'));
      } else if (activeTab === 'stats') {
        const response = await axios.get(`${API_URL}/admin/stats`, { headers });
        setStats(response.data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/tickets`, newTicket, { headers });

      setNewTicket({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        property_address: '',
        service_type: '',
        description: '',
      });

      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create ticket');
    }
  };

  const handleAssignTechnician = async (ticketId, techId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${API_URL}/tickets/${ticketId}/assign`,
        { assigned_technician_id: techId },
        { headers }
      );

      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign technician');
    }
  };

  const handleAssignPrice = async (ticketId, workLogId) => {
    if (!priceAssignment[ticketId]) {
      setError('Please enter a price');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/admin/price-assignment`,
        {
          ticket_id: ticketId,
          work_log_id: workLogId,
          price: parseFloat(priceAssignment[ticketId]),
        },
        { headers }
      );

      setPriceAssignment((prev) => ({
        ...prev,
        [ticketId]: '',
      }));

      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign price');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/admin/tickets/${ticketId}`, { headers });

      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete ticket');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_URL}/admin/users/${userId}/deactivate`, {}, { headers });

      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate user');
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

      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update billing status');
    }
  };

  const Header = () => (
    <div className="header">
      <div className="container">
        <div className="header-content">
          <h1>HVAC Admin Panel</h1>
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

        {/* Tabs */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc' }}>
          <button
            onClick={() => setActiveTab('tickets')}
            style={{
              padding: '1rem',
              marginRight: '1rem',
              borderBottom: activeTab === 'tickets' ? '3px solid #2563eb' : 'none',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'tickets' ? 'bold' : 'normal',
              color: activeTab === 'tickets' ? '#2563eb' : '#666',
            }}
          >
            Tickets
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            style={{
              padding: '1rem',
              marginRight: '1rem',
              borderBottom: activeTab === 'verification' ? '3px solid #2563eb' : 'none',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'verification' ? 'bold' : 'normal',
              color: activeTab === 'verification' ? '#2563eb' : '#666',
            }}
          >
            Verification
          </button>
          <button
            onClick={() => setActiveTab('technicians')}
            style={{
              padding: '1rem',
              marginRight: '1rem',
              borderBottom: activeTab === 'technicians' ? '3px solid #2563eb' : 'none',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'technicians' ? 'bold' : 'normal',
              color: activeTab === 'technicians' ? '#2563eb' : '#666',
            }}
          >
            Technicians
          </button>
          <button
            onClick={() => setActiveTab('invoicing')}
            style={{
              padding: '1rem',
              marginRight: '1rem',
              borderBottom: activeTab === 'invoicing' ? '3px solid #2563eb' : 'none',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'invoicing' ? 'bold' : 'normal',
              color: activeTab === 'invoicing' ? '#2563eb' : '#666',
            }}
          >
            Invoicing
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '1rem',
              marginRight: '1rem',
              borderBottom: activeTab === 'users' ? '3px solid #2563eb' : 'none',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'users' ? 'bold' : 'normal',
              color: activeTab === 'users' ? '#2563eb' : '#666',
            }}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '1rem',
              borderBottom: activeTab === 'stats' ? '3px solid #2563eb' : 'none',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'stats' ? 'bold' : 'normal',
              color: activeTab === 'stats' ? '#2563eb' : '#666',
            }}
          >
            Statistics
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <>
            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
              <>
                <div className="card">
                  <h2>Create New Service Ticket</h2>
                  <form onSubmit={handleCreateTicket}>
                    <div className="grid grid-2">
                      <div className="form-group">
                        <label>Customer Name *</label>
                        <input
                          type="text"
                          value={newTicket.customer_name}
                          onChange={(e) =>
                            setNewTicket({ ...newTicket, customer_name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Customer Email</label>
                        <input
                          type="email"
                          value={newTicket.customer_email}
                          onChange={(e) =>
                            setNewTicket({ ...newTicket, customer_email: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Customer Phone</label>
                        <input
                          type="tel"
                          value={newTicket.customer_phone}
                          onChange={(e) =>
                            setNewTicket({ ...newTicket, customer_phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Property Address *</label>
                        <input
                          type="text"
                          value={newTicket.property_address}
                          onChange={(e) =>
                            setNewTicket({ ...newTicket, property_address: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Service Type</label>
                        <select
                          value={newTicket.service_type}
                          onChange={(e) =>
                            setNewTicket({ ...newTicket, service_type: e.target.value })
                          }
                        >
                          <option value="">Select service type</option>
                          <option value="Emergency Repair">Emergency Repair</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Installation">Installation</option>
                          <option value="Inspection">Inspection</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={newTicket.description}
                        onChange={(e) =>
                          setNewTicket({ ...newTicket, description: e.target.value })
                        }
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Create Ticket
                    </button>
                  </form>
                </div>

                <div className="card">
                  <h2>Service Tickets</h2>
                  {tickets.length === 0 ? (
                    <p>No tickets found</p>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Ticket #</th>
                          <th>Customer</th>
                          <th>Address</th>
                          <th>Status</th>
                          <th>Technician</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((ticket) => (
                          <tr key={ticket.id}>
                            <td>{ticket.ticket_number}</td>
                            <td>{ticket.customer_name}</td>
                            <td>{ticket.property_address}</td>
                            <td>
                              <span className={`badge badge-${ticket.status}`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td>
                              <select
                                value={assignedTech[ticket.id] || ''}
                                onChange={(e) =>
                                  handleAssignTechnician(ticket.id, e.target.value)
                                }
                              >
                                <option value="">Assign technician...</option>
                                {technicians.map((tech) => (
                                  <option key={tech.id} value={tech.id}>
                                    {tech.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <button
                                className="btn btn-primary"
                                onClick={() => navigate(`/ticket/${ticket.id}`)}
                                style={{ marginRight: '0.5rem' }}
                              >
                                View
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteTicket(ticket.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* Verification Tab */}
            {activeTab === 'verification' && (
              <div className="card">
                <h2>Pending Work Verification</h2>
                {pendingVerification.length === 0 ? (
                  <p>No completed work pending verification</p>
                ) : (
                  <div className="grid grid-2">
                    {pendingVerification.map((ticket) => (
                      <div key={ticket.id} className="card">
                        <h3>{ticket.ticket_number}</h3>
                        <p>
                          <strong>Customer:</strong> {ticket.customer_name}
                        </p>
                        <p>
                          <strong>Address:</strong> {ticket.property_address}
                        </p>
                        <p>
                          <strong>Serial #:</strong> {ticket.serial_number}
                        </p>
                        <div className="form-group">
                          <label>Assign Price</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={priceAssignment[ticket.id] || ''}
                            onChange={(e) =>
                              setPriceAssignment({
                                ...priceAssignment,
                                [ticket.id]: e.target.value,
                              })
                            }
                          />
                        </div>
                        <button
                          className="btn btn-success btn-block"
                          onClick={() =>
                            handleAssignPrice(ticket.id, ticket.work_log_id)
                          }
                        >
                          Verify & Assign Price
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Technicians Tab */}
            {activeTab === 'technicians' && (
              <div className="card">
                <h2>Technicians</h2>
                {technicians.length === 0 ? (
                  <p>No technicians found</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {technicians.map((tech) => (
                        <tr key={tech.id}>
                          <td>{tech.name}</td>
                          <td>{tech.email}</td>
                          <td>{tech.phone}</td>
                          <td>
                            {tech.is_active ? (
                              <span className="badge badge-verified">Active</span>
                            ) : (
                              <span className="badge badge-billed">Inactive</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Invoicing Tab */}
            {activeTab === 'invoicing' && (
              <div className="card">
                <h2>Pending Invoices</h2>
                {pendingInvoices.length === 0 ? (
                  <p>No verified tickets pending invoicing</p>
                ) : (
                  <div className="grid grid-2">
                    {pendingInvoices.map((invoice) => (
                      <div key={invoice.id} className="card" style={{ backgroundColor: '#f9fafb' }}>
                        <h3>{invoice.ticket_number}</h3>
                        <p>
                          <strong>Customer:</strong> {invoice.customer_name}
                        </p>
                        <p>
                          <strong>Address:</strong> {invoice.property_address}
                        </p>
                        <p>
                          <strong>Price:</strong> ${invoice.price ? invoice.price.toFixed(2) : 'N/A'}
                        </p>
                        <p>
                          <strong>Current Status:</strong>{' '}
                          <span className={`badge badge-${invoice.billing_status || 'pending'}`}>
                            {invoice.billing_status || 'pending'}
                          </span>
                        </p>
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

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="card">
                <h2>User Management</h2>
                {allUsers.length === 0 ? (
                  <p>No users found</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span style={{ textTransform: 'capitalize' }}>{u.role}</span>
                          </td>
                          <td>{u.phone}</td>
                          <td>
                            {u.is_active ? (
                              <span className="badge badge-verified">Active</span>
                            ) : (
                              <span className="badge badge-billed">Suspended</span>
                            )}
                          </td>
                          <td>
                            {u.is_active && (
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeactivateUser(u.id)}
                              >
                                Suspend
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="grid grid-2">
                <div className="card">
                  <h3>Pending Tickets</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
                    {stats.pending_tickets || 0}
                  </p>
                </div>
                <div className="card">
                  <h3>Completed Tickets</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                    {stats.completed_tickets || 0}
                  </p>
                </div>
                <div className="card">
                  <h3>Verified Tickets</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                    {stats.verified_tickets || 0}
                  </p>
                </div>
                <div className="card">
                  <h3>Total Revenue</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                    ${(stats.total_revenue || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
