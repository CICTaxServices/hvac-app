# HVAC Service Management Application

A comprehensive web-based application for managing HVAC (Heating, Ventilation, and Air Conditioning) service calls, technician assignments, work documentation, and billing. Built with Node.js, React, PostgreSQL, and Docker.

## Features

### Service Call Management
- Create and track service tickets
- Assign technicians to service calls
- Real-time status updates (pending → assigned → completed → verified → billed)

### Technician Dashboard
- View assigned service calls
- Complete work entries with mandatory serial number photo
- Track work hours and parts used
- Submit work for owner verification

### Admin/Owner Dashboard
- Create new service tickets
- Assign technicians and track assignments
- Verify completed work with visual documentation
- Assign prices to completed work
- View real-time statistics and revenue

### Accounting Dashboard
- View tickets ready for billing
- Track billing status
- Invoice management

### Email Notifications
- Technician assignment emails
- Owner verification requests
- Accounting billing notifications

## Technology Stack

- **Backend:** Node.js, Express.js
- **Frontend:** React.js, React Router
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Email:** Nodemailer
- **Containerization:** Docker & Docker Compose

## System Requirements

- Docker & Docker Compose (latest version)
- Git
- 2GB RAM minimum
- 1GB disk space

## Installation & Setup

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   cd hvac-app
   ```

2. **Configure environment variables**
   ```bash
   # Copy the example .env file
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your settings
   nano backend/.env
   ```

   Update these critical settings:
   - `JWT_SECRET` - Change to a secure random string
   - `EMAIL_*` - Configure your SMTP email settings
   - `DB_PASSWORD` - Change the database password

3. **Build and start all services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database** (first run only)
   ```bash
   docker exec hvac-backend npm run db:init
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - PostgreSQL: localhost:5432

### Option 2: Local Development

#### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env

# Start the server
npm run dev  # with auto-reload
# OR
npm start   # standard start
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file (if needed)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start the development server
npm start
```

## Database Schema

### Users Table
- Stores user information (admin, technician, accounting staff)
- Supports JWT authentication

### Tickets Table
- Service call records with customer information
- Status tracking through workflow

### Work Logs Table
- Technician work documentation
- Mandatory serial number photo reference
- Hours worked and parts used

### Price Assignments Table
- Owner verification and pricing
- Links to work logs

### Billing Table
- Invoice and payment tracking
- Billing status management

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Tickets
- `POST /api/tickets` - Create ticket (admin only)
- `GET /api/tickets` - Get tickets (filtered by role)
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id/assign` - Assign technician (admin only)

### Technician Routes
- `POST /api/technicians/work-completion` - Submit completed work
- `GET /api/technicians/my-tickets` - Get assigned tickets
- `GET /api/technicians/profile` - Get technician profile

### Admin Routes
- `POST /api/admin/price-assignment` - Assign price to work
- `GET /api/admin/pending-verification` - Get work awaiting verification
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/deactivate` - Deactivate user
- `GET /api/admin/stats` - Get dashboard statistics

## User Roles

### Admin/Owner
- Create and manage service tickets
- Assign technicians
- Verify completed work
- Set pricing
- View statistics and revenue

### Technician
- View assigned service calls
- Submit work completion with photos
- Track work hours

### Accounting
- View tickets ready for billing
- Manage invoicing and payments

## Service Workflow

```
1. Service Call Intake
   └─> Admin creates ticket with customer details

2. Technician Assignment
   └─> Admin assigns technician
   └─> Technician receives email notification

3. Work Completion
   └─> Technician completes work
   └─> Uploads mandatory serial number photo
   └─> Owner receives verification request

4. Verification & Pricing
   └─> Owner verifies work
   └─> Assigns price/cost
   └─> Accounting department is notified

5. Billing
   └─> Accounting processes invoice
   └─> Customer is billed
   └─> Payment tracked
```

## Docker Management

### View running containers
```bash
docker-compose ps
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop services
```bash
docker-compose down
```

### Restart services
```bash
docker-compose restart
```

### Remove all data
```bash
docker-compose down -v
```

## Configuration

### Database
Modify `docker-compose.yml` to change:
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password  
- `POSTGRES_DB` - Database name

### Email Settings
Update in `backend/.env`:
- Email provider SMTP settings
- Sender email address
- Email credentials

### JWT Secret
Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Security Considerations

1. **Change default passwords** in docker-compose.yml and .env files
2. **Use HTTPS** in production
3. **Set strong JWT_SECRET** - use a random 32+ character string
4. **Restrict CORS** - configure CORS_ORIGIN to your domain
5. **Rate limiting** - consider adding rate limiting middleware
6. **Input validation** - all inputs are validated with Joi
7. **File upload limits** - configured to 5MB by default
8. **SQL injection protection** - using parameterized queries with pg library

## Mobile Responsiveness

The application is fully responsive and works on:
- Desktop browsers
- Tablets (iPad, Android tablets)
- Smartphones (iPhone, Android phones)

All CSS uses mobile-first design principles with proper viewport settings.

## Performance Optimization

- Database indexes on frequently queried fields
- Efficient pagination available for large datasets
- Image optimization for uploaded photos
- Caching headers configured
- Gzip compression enabled

## Troubleshooting

### Port already in use
```bash
# Change port in docker-compose.yml or use different port
docker-compose up -d --port 8000:3000
```

### Database connection issues
```bash
# Check database is running
docker exec hvac-postgres psql -U hvac_user -d hvac_db -c "SELECT 1"
```

### Email not sending
- Verify SMTP credentials in .env
- Check for firewall blocking port 587
- Enable "Less secure app access" if using Gmail
- Check application logs: `docker-compose logs backend`

### Frontend not connecting to API
- Verify backend is running: `docker-compose ps`
- Check REACT_APP_API_URL in frontend environment
- Check CORS settings in backend/.env

## Development Tips

1. **Hot reload backend:** Backend uses nodemon for auto-restart on file changes
2. **React hot reload:** Frontend supports automatic reload
3. **Database changes:** Modify schema.sql and restart services
4. **Testing:** Use Postman or curl to test API endpoints
5. **Browser DevTools:** Use Chrome DevTools for frontend debugging

## Production Deployment

For production deployment:

1. **Use environment variables** - Don't commit .env to version control
2. **Enable HTTPS** - Use Let's Encrypt or similar
3. **Use reverse proxy** - Nginx or Apache
4. **Configure backups** - Regular database backups
5. **Monitor logs** - Set up log aggregation
6. **Scale containers** - Use orchestration (Kubernetes)
7. **Security scanning** - Regular security updates

## Support & Issues

- Check logs: `docker-compose logs -f`
- Review API documentation in endpoints section
- Test with curl or Postman before reporting issues

## License

MIT License

## Author

Created for HVAC Service Management Solutions

---

**Ready to deploy?** Follow the Docker installation steps and you'll have a fully functional HVAC service management system running in minutes!
