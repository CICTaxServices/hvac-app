# HVAC Service App - Quick Start Guide

## 🚀 Start in 5 Minutes

### Prerequisites
- Docker & Docker Compose installed
- Port 3000, 5000, 5432 available

### Step 1: Get the code
```bash
cd hvac-app
```

### Step 2: Configure (Optional but Recommended)
```bash
# Edit settings
nano backend/.env

# Key things to change:
# - JWT_SECRET (use any random string for testing)
# - EMAIL_* settings (for actual email notifications)
# - DB_PASSWORD (for security)
```

### Step 3: Start everything
```bash
docker-compose up -d
```

Wait 30 seconds for services to initialize.

### Step 4: Access the app
- **Web App:** http://localhost:3000
- **API:** http://localhost:5000/api/health

## 📝 Test Users (Create these via signup)

### Admin User
- Email: `admin@hvac.com`
- Password: `password123`
- Role: Admin

### Technician User
- Email: `tech@hvac.com`
- Password: `password123`
- Role: Technician

### Accounting User
- Email: `accounting@hvac.com`
- Password: `password123`
- Role: Accounting

## 📱 Test the Workflow

### As Admin:
1. Login with admin account
2. Click "Create New Service Ticket"
3. Fill in customer details
4. Assign a technician
5. Go to "Verification" tab to see completed work

### As Technician:
1. Login with technician account
2. View assigned tickets
3. Click "Complete & Submit Work"
4. Add description, parts used, hours
5. **MANDATORY:** Upload a photo (serial number photo)
6. Submit

### As Admin (Verification):
1. Go back to Admin panel
2. Click "Verification" tab
3. Review completed work
4. Enter a price and click "Verify & Assign Price"

### As Accounting:
1. Login with accounting account
2. View "Ready to Bill" tickets
3. Process invoicing

## 🛠 Useful Commands

```bash
# View all running services
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Delete everything and start fresh
docker-compose down -v
docker-compose up -d
```

## 🐛 Troubleshooting

### "Port 3000 already in use"
Change the port in docker-compose.yml:
```yaml
frontend:
  ports:
    - "8000:3000"  # Now on port 8000
```

### "Cannot connect to database"
Wait 30 seconds after starting, or check logs:
```bash
docker-compose logs postgres
```

### "Login not working"
- Make sure you created a user via "Sign Up" first
- Check backend logs: `docker-compose logs backend`

### "Photo upload not working"
- File must be an image (JPG, PNG)
- Must be under 5MB
- Check browser console for errors

## 📊 Key Features to Try

1. **Mobile responsive** - Open on phone/tablet to see responsive design
2. **Email notifications** - Check logs to see notification templates
3. **Real-time status** - Watch ticket status change through workflow
4. **Statistics** - Admin dashboard shows revenue and ticket counts
5. **User roles** - Each role has different permissions

## 🔒 Security Notes

- JWT tokens expire after 7 days
- Passwords are hashed with bcrypt
- All file uploads are validated
- SQL queries use parameterized statements
- CORS is configured

## 📱 Mobile Access

Access from any device on your network:
```
http://YOUR_COMPUTER_IP:3000
```

Example: `http://192.168.1.100:3000`

## 🎯 Next Steps

1. **Customize** - Edit CSS in `frontend/src/styles/index.css`
2. **Add features** - Extend controllers and routes
3. **Deploy** - Move to production with environment variables
4. **Connect to email** - Configure SMTP settings in .env
5. **Scale** - Add more technicians and manage workflows

## 📞 Need Help?

Check the main README.md for:
- Detailed API documentation
- Database schema
- Production deployment guide
- Troubleshooting section

---

**Happy service managing! 🔧**
