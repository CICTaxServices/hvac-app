import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminPanel({ user, onLogout }) {
  const navigate = useNavigate();
  // Set default tab based on user role
  const defaultTab = user.role === 'accounting' ? 'invoicing' : 'tickets';
  const [activeTab, setActiveTab] = useState(defaultTab);
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
  const [verifyingTicket, setVerifyingTicket] = useState(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'technician',
    phone: '',
  });
  const [editUser, setEditUser] = useState({
    name: '',
    phone: '',
    role: '',
  });

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

      // Accounting users only see invoicing tab
      if (user.role === 'accounting') {
        if (activeTab === 'invoicing') {
          const response = await axios.get(`${API_URL}/admin/pending-invoices`, { headers });
          setPendingInvoices(response.data.invoices);
        }
      } else if (user.role === 'admin') {
        // Admin can see all tabs
        if (activeTab === 'tickets') {
          // Fetch both tickets and technicians for the dropdown
          const [ticketsRes, usersRes] = await Promise.all([
            axios.get(`${API_URL}/tickets`, { headers }),
            axios.get(`${API_URL}/admin/users`, { headers }),
          ]);
          // Filter out verified tickets
          setTickets(ticketsRes.data.tickets.filter((t) => t.status !== 'verified' && t.status !== 'invoiced'));
          setTechnicians(usersRes.data.users.filter((u) => u.role === 'technician'));
        } else if (activeTab === 'invoicing') {
          const response = await axios.get(`${API_URL}/admin/pending-invoices`, { headers });
          setPendingInvoices(response.data.invoices);
        } else if (activeTab === 'users') {
          const response = await axios.get(`${API_URL}/admin/users`, { headers });
          setAllUsers(response.data.users);
        } else if (activeTab === 'stats') {
          const response = await axios.get(`${API_URL}/admin/stats`, { headers });
          setStats(response.data.stats);
        }
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

  const handleActivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reactivate this user?')) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_URL}/admin/users/${userId}/activate`, {}, { headers });

      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to activate user');
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.name) {
      setError('Email, password, and name are required');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/auth/register`, newUser, { headers });

      setNewUser({
        email: '',
        password: '',
        name: '',
        role: 'technician',
        phone: '',
      });
      setShowNewUserForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleEditUser = async (userId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${API_URL}/admin/users/${userId}`,
        editUser,
        { headers }
      );

      setEditingUser(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/admin/users/${userId}`, { headers });

      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
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
          {user.role === 'admin' && (
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
          )}
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
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <button
                                className="btn btn-primary"
                                onClick={() => navigate(`/ticket/${ticket.id}`)}
                                style={{ marginRight: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                              >
                                View
                              </button>
                              {ticket.status === 'completed' && (
                                <button
                                  className="btn btn-success"
                                  onClick={() => setVerifyingTicket(ticket.id)}
                                  style={{ marginRight: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                >
                                  Verify
                                </button>
                              )}
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteTicket(ticket.id)}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
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

                {/* Verification Modal */}
                {verifyingTicket && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                    }}
                    onClick={() => setVerifyingTicket(null)}
                  >
                    <div
                      className="card"
                      style={{
                        maxWidth: '500px',
                        width: '90%',
                        backgroundColor: 'white',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h2>Verify Work & Assign Price</h2>
                      {(() => {
                        const ticket = tickets.find((t) => t.id === verifyingTicket);
                        return ticket ? (
                          <div>
                            <p>
                              <strong>Ticket:</strong> {ticket.ticket_number}
                            </p>
                            <p>
                              <strong>Customer:</strong> {ticket.customer_name}
                            </p>
                            <div className="form-group">
                              <label>Price *</label>
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
                                autoFocus
                              />
                            </div>
                            <div className="form-group">
                              <label>Notes (Optional)</label>
                              <textarea placeholder="Add any notes..." />
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.5rem',
                                justifyContent: 'flex-end',
                              }}
                            >
                              <button
                                className="btn btn-secondary"
                                onClick={() => setVerifyingTicket(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className="btn btn-success"
                                onClick={() => {
                                  handleAssignPrice(ticket.id, ticket.work_log_id);
                                  setVerifyingTicket(null);
                                }}
                              >
                                Verify & Assign Price
                              </button>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Verification Tab - HIDDEN */}
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


            {/* Invoicing Tab */}
            {activeTab === 'invoicing' && (
              <>
                {(() => {
                  const pendingInv = pendingInvoices.filter((inv) => inv.billing_status === 'pending');
                  const sentInv = pendingInvoices.filter((inv) => inv.billing_status === 'sent');
                  const paidInv = pendingInvoices.filter((inv) => inv.billing_status === 'paid');

                  const renderInvoiceCard = (invoice) => (
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
                      <p style={{ marginBottom: '1.5rem' }}>
                        <strong>Current Status:</strong>{' '}
                        <span
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            color: 'white',
                            backgroundColor:
                              invoice.billing_status === 'pending' ? '#f59e0b' :
                              invoice.billing_status === 'sent' ? '#3b82f6' :
                              invoice.billing_status === 'paid' ? '#10b981' : '#6b7280'
                          }}
                        >
                          {invoice.billing_status || 'pending'}
                        </span>
                      </p>
                      {invoice.invoice_number && (
                        <p>
                          <strong>Invoice #:</strong> {invoice.invoice_number}
                        </p>
                      )}
                      {user.role === 'accounting' && (
                        <>
                          <div className="form-group">
                            <label>Invoice Number</label>
                            <input
                              type="text"
                              placeholder="e.g., INV-2024-001"
                              value={invoiceNumber[invoice.billing_id] || invoice.invoice_number || ''}
                              onChange={(e) =>
                                setInvoiceNumber({
                                  ...invoiceNumber,
                                  [invoice.billing_id]: e.target.value,
                                })
                              }
                              disabled={invoice.invoice_number ? true : false}
                              style={{
                                backgroundColor: invoice.invoice_number ? '#e5e7eb' : 'white',
                                color: invoice.invoice_number ? '#6b7280' : 'black',
                                cursor: invoice.invoice_number ? 'not-allowed' : 'auto'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {invoice.billing_status === 'pending' && (
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
                            )}
                            {invoice.billing_status === 'sent' && (
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
                            )}
                            {invoice.billing_status === 'paid' && (
                              <div style={{ flex: 1, padding: '0.5rem', textAlign: 'center', backgroundColor: '#d1fae5', borderRadius: '4px', fontWeight: 'bold', color: '#065f46' }}>
                                ✓ Paid
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );

                  return (
                    <>
                      {pendingInv.length > 0 && (
                        <div className="card">
                          <h2>Ready to Bill</h2>
                          <div className="grid grid-2">
                            {pendingInv.map(renderInvoiceCard)}
                          </div>
                        </div>
                      )}

                      {sentInv.length > 0 && (
                        <div className="card">
                          <h2>Invoiced (Awaiting Payment)</h2>
                          <div className="grid grid-2">
                            {sentInv.map(renderInvoiceCard)}
                          </div>
                        </div>
                      )}

                      {paidInv.length > 0 && (
                        <div className="card">
                          <h2>Paid Invoices</h2>
                          <div className="grid grid-2">
                            {paidInv.map(renderInvoiceCard)}
                          </div>
                        </div>
                      )}

                      {pendingInv.length === 0 && sentInv.length === 0 && paidInv.length === 0 && (
                        <div className="card">
                          <p>No invoices to manage</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <>
                <div className="card">
                  <h2>User Management</h2>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowNewUserForm(!showNewUserForm)}
                    style={{ marginBottom: '1rem' }}
                  >
                    {showNewUserForm ? 'Cancel' : '+ Create New User'}
                  </button>

                  {showNewUserForm && (
                    <div className="card" style={{ backgroundColor: '#f9fafb', marginBottom: '1rem' }}>
                      <h3>Create New User</h3>
                      <form onSubmit={handleCreateUser}>
                        <div className="grid grid-2">
                          <div className="form-group">
                            <label>Name *</label>
                            <input
                              type="text"
                              value={newUser.name}
                              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Email *</label>
                            <input
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Password *</label>
                            <input
                              type="password"
                              value={newUser.password}
                              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Phone</label>
                            <input
                              type="tel"
                              value={newUser.phone}
                              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Role *</label>
                            <select
                              value={newUser.role}
                              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            >
                              <option value="technician">Technician</option>
                              <option value="admin">Admin</option>
                              <option value="accounting">Accounting</option>
                            </select>
                          </div>
                        </div>
                        <button type="submit" className="btn btn-success">
                          Create User
                        </button>
                      </form>
                    </div>
                  )}

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
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  setEditingUser(u.id);
                                  setEditUser({ name: u.name, phone: u.phone, role: u.role });
                                }}
                                style={{ marginRight: '0.25rem', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                              >
                                Edit
                              </button>
                              {u.is_active && (
                                <button
                                  className="btn btn-warning"
                                  onClick={() => handleDeactivateUser(u.id)}
                                  style={{ marginRight: '0.25rem', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                                >
                                  Suspend
                                </button>
                              )}
                              {!u.is_active && (
                                <button
                                  className="btn btn-success"
                                  onClick={() => handleActivateUser(u.id)}
                                  style={{ marginRight: '0.25rem', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                                >
                                  Activate
                                </button>
                              )}
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteUser(u.id)}
                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
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

                {editingUser && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                    }}
                    onClick={() => setEditingUser(null)}
                  >
                    <div
                      className="card"
                      style={{ maxWidth: '400px', width: '90%', backgroundColor: 'white' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h2>Edit User</h2>
                      <div className="form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          value={editUser.name}
                          onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input
                          type="tel"
                          value={editUser.phone}
                          onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Role</label>
                        <select
                          value={editUser.role}
                          onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                        >
                          <option value="technician">Technician</option>
                          <option value="admin">Admin</option>
                          <option value="accounting">Accounting</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setEditingUser(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            handleEditUser(editingUser);
                          }}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
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
