-- HVAC Service Management Database Schema

-- Users table (Admin/Owner, Technicians, Accounting)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'admin', 'technician', 'accounting'
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  property_address TEXT NOT NULL,
  service_type VARCHAR(100),
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, assigned, completed, verified, billed
  assigned_technician_id INTEGER REFERENCES users(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work logs (what technician did at the property)
CREATE TABLE IF NOT EXISTS work_logs (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  technician_id INTEGER NOT NULL REFERENCES users(id),
  work_description TEXT NOT NULL,
  parts_used TEXT,
  hours_worked DECIMAL(5, 2),
  serial_number VARCHAR(255) NOT NULL, -- Equipment serial number (mandatory)
  serial_photo_path TEXT NOT NULL, -- Photo of serial number as base64 (mandatory)
  completed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price assignment (owner verifies and sets price)
CREATE TABLE IF NOT EXISTS price_assignments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  work_log_id INTEGER NOT NULL REFERENCES work_logs(id),
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'assigned', -- assigned, approved
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing records
CREATE TABLE IF NOT EXISTS billing (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  price_assignment_id INTEGER REFERENCES price_assignments(id),
  amount DECIMAL(10, 2) NOT NULL,
  billing_status VARCHAR(50) DEFAULT 'pending', -- pending, sent, paid
  invoice_number VARCHAR(50),
  billing_date TIMESTAMP,
  due_date TIMESTAMP,
  paid_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  ticket_id INTEGER REFERENCES tickets(id),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_tech ON tickets(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_ticket ON work_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_technician ON work_logs(technician_id);
CREATE INDEX IF NOT EXISTS idx_billing_ticket ON billing(ticket_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Modify work_logs column to store base64 images (if table already exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_logs') THEN
    ALTER TABLE work_logs ALTER COLUMN serial_photo_path TYPE TEXT;
  END IF;
END $$;
