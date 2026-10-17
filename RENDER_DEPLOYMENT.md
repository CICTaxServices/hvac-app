# Deploy HVAC App to Render.com

Render is the perfect temporary home for your HVAC app! Here's how to deploy in ~15 minutes.

## ✅ Why Render Works Great:

- ✓ Free tier available (perfect for temporary hosting)
- ✓ PostgreSQL database included
- ✓ Docker support
- ✓ Automatic SSL/HTTPS
- ✓ Environment variables management
- ✓ Easy scaling when you get your server
- ✓ Git integration (auto-deploys on push)

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

```bash
cd hvac-app

# Initialize git (if not already)
git init
git add .
git commit -m "Initial HVAC app commit"

# Create a GitHub repo at github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/hvac-app.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Account

1. Go to **https://render.com**
2. Sign up (free account)
3. Connect your GitHub account

### Step 3: Manual Service Setup (Easiest Way)

#### Option A: Using Render Dashboard (Recommended for Beginners)

**Create Backend Service:**

1. Click **New +** → **Web Service**
2. Select your GitHub repo
3. Fill in:
   - **Name:** `hvac-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free (or Starter for production)

4. Click **Advanced** and add Environment Variables:
   ```
   PORT = 5000
   NODE_ENV = production
   JWT_SECRET = <generate random string>
   EMAIL_HOST = smtp.gmail.com
   EMAIL_PORT = 587
   EMAIL_USER = your-email@gmail.com
   EMAIL_PASSWORD = your-app-password
   EMAIL_FROM = noreply@hvacservice.com
   CORS_ORIGIN = https://hvac-frontend.onrender.com
   ```

5. Scroll down, find **Database** section
   - Click **Create PostgreSQL Database**
   - Name: `hvac-db`
   - Render will auto-inject: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

6. Click **Create Web Service**
7. Wait for deployment (~5 min)
8. Copy the URL (e.g., `https://hvac-backend.onrender.com`)

**Create Frontend Service:**

1. Click **New +** → **Web Service** again
2. Select your GitHub repo (same one)
3. Fill in:
   - **Name:** `hvac-frontend`
   - **Environment:** `Node`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Start Command:** `npm install -g serve && serve -s frontend/build -l 3000`
   - **Plan:** Free

4. Click **Advanced** and add Environment Variables:
   ```
   REACT_APP_API_URL = https://hvac-backend.onrender.com/api
   ```
   (Use the backend URL you copied above)

5. Click **Create Web Service**
6. Wait for deployment (~5 min)

### Step 4: Initialize Database

Once backend is deployed:

1. Go to your backend service on Render
2. Click the **Shell** tab
3. Run:
   ```bash
   psql $DATABASE_URL < backend/models/schema.sql
   ```

### Step 5: Test It Out

1. **Frontend:** `https://hvac-frontend.onrender.com`
2. **Backend API:** `https://hvac-backend.onrender.com/api/health`

## ⚡ Quick Reference - Environment Variables

### Backend Needs:
```
PORT = 5000
NODE_ENV = production
JWT_SECRET = (generate: openssl rand -hex 32)
DB_HOST = (auto from postgres)
DB_PORT = (auto from postgres)
DB_USER = (auto from postgres)
DB_PASSWORD = (auto from postgres)
DB_NAME = (auto from postgres)
CORS_ORIGIN = https://hvac-frontend.onrender.com
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = app-specific-password
EMAIL_FROM = noreply@hvacservice.com
```

### Frontend Needs:
```
REACT_APP_API_URL = https://hvac-backend.onrender.com/api
```

## 📧 Setup Gmail Email Notifications

To enable email notifications:

1. Enable 2FA on your Gmail account
2. Create an **App Password** (not your regular password):
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google generates a 16-char password
   - Copy that password to `EMAIL_PASSWORD` in Render

## 🔄 Auto-Deploy on Code Changes

Render automatically redeploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Render detects the push and auto-deploys!
# Check status in Render dashboard
```

## 📊 Render Pricing (Free Tier Limits)

| Feature | Free Tier | Cost When Upgraded |
|---------|-----------|-------------------|
| Web Service | 1 (spins down after 15 min idle) | $7/mo |
| PostgreSQL | 256 MB | $15/mo |
| Bandwidth | 100 GB/mo | Included |
| Build Time | 500 hrs/mo | Included |

**Total Cost:** $0 free, ~$22/mo upgraded (still cheap!)

### Free Tier Notes:
- Services go to sleep after 15 min of inactivity
- First request wakes them up (~30 sec delay)
- Perfect for development/testing
- Great temporary solution!

## 🆘 Troubleshooting

### "Deployment Failed"
1. Check the **Logs** tab in Render dashboard
2. Common issues:
   - Missing environment variables
   - Database not initialized
   - Build command errors

### "Can't Connect to Database"
1. In backend service → **Logs** → look for connection error
2. Make sure `DB_*` environment variables are set
3. Run schema.sql again in Shell tab

### "Frontend Shows Blank Page"
1. Check browser console for errors
2. Verify `REACT_APP_API_URL` is correct
3. Make sure backend service is running

### "Email Not Sending"
1. Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
2. Check backend logs for email errors
3. Gmail requires app-specific password (not regular password)

## 🎯 When You Get Your New Server

1. **Export data** (PostgreSQL dump):
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Import to your new server:**
   ```bash
   psql -U your_user -d your_db < backup.sql
   ```

3. **Update your app** to point to new server
4. **Keep Render as backup** until fully migrated

## 📱 Access Your App

- **Frontend:** `https://hvac-frontend.onrender.com`
- **Backend API:** `https://hvac-backend.onrender.com/api`
- **Health Check:** `https://hvac-backend.onrender.com/api/health`

## 🚀 Advanced: Using render.yaml

If you want to deploy everything with one file:

1. Ensure `render.yaml` is in your repo root
2. Go to Render dashboard → **New +** → **Infrastructure as Code**
3. Connect your repo
4. Render reads `render.yaml` and creates everything automatically

(The `render.yaml` file is already in your hvac-app folder!)

## 💡 Pro Tips

1. **Always use HTTPS** - Render provides free SSL
2. **Monitor costs** - Check the Render billing page
3. **Keep backups** - Export database regularly
4. **Use environment variables** - Never commit secrets
5. **Scale up when needed** - Upgrade plan for production
6. **Monitor logs** - Check them regularly for issues

## 📞 Support

- Render Docs: https://render.com/docs
- Contact: support@render.com
- Status: https://status.render.com

---

**You're ready to deploy! Your HVAC app will be live in minutes.** 🎉
