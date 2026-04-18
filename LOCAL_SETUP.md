# Local Development Setup Guide

## Prerequisites

You need to install these on your computer:

### 1. PHP 8.1 or higher
**Check if installed:**
```bash
php --version
```

**Install:**
- **Mac:** `brew install php`
- **Windows:** Download from [php.net](https://windows.php.net/download/)
- **Linux:** `sudo apt install php php-pgsql` (Ubuntu/Debian)

### 2. PostgreSQL 14 or higher
**Check if installed:**
```bash
psql --version
```

**Install:**
- **Mac:** `brew install postgresql@16`
- **Windows:** Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Linux:** `sudo apt install postgresql postgresql-contrib`

**Start PostgreSQL:**
- **Mac:** `brew services start postgresql@16`
- **Windows:** Starts automatically after install
- **Linux:** `sudo systemctl start postgresql`

---

## Setup Steps

### Step 1: Clone/Download the Project

```bash
cd /path/to/your/projects
# If you have the zip, extract it
# Or clone from GitHub
```

### Step 2: Create Database

Open terminal and run:

```bash
# Create a new database
createdb online_music_shop
```

**If you get "command not found":**
- **Mac:** Add to PATH: `export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"`
- **Windows:** Use pgAdmin GUI or SQL Shell
- **Linux:** Switch to postgres user: `sudo -u postgres createdb online_music_shop`

### Step 3: Import Database Schema

```bash
# Navigate to project directory
cd /path/to/DBMS\ PROJ

# Import the schema
psql online_music_shop < node_app/schema.sql
```

**Alternative (if psql command doesn't work):**
```bash
psql -U postgres -d online_music_shop -f node_app/schema.sql
```

You should see output like:
```
CREATE TABLE
CREATE TABLE
INSERT 0 3
...
```

### Step 4: Configure Database Connection

**Option A: Set Environment Variable (Recommended)**

**Mac/Linux:**
```bash
export DATABASE_URL="postgresql://localhost/online_music_shop"
```

**Windows (Command Prompt):**
```cmd
set DATABASE_URL=postgresql://localhost/online_music_shop
```

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://localhost/online_music_shop"
```

**Option B: Edit config/db.php**

If environment variable doesn't work, edit `config/db.php` and update the fallback values:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'online_music_shop');
define('DB_USER', 'postgres');  // Your PostgreSQL username
define('DB_PASS', '');          // Your PostgreSQL password (if any)
define('DB_PORT', 5432);
```

### Step 5: Start PHP Development Server

```bash
# Make sure you're in the project root directory
cd /path/to/DBMS\ PROJ

# Start the server
php -S localhost:8000
```

You should see:
```
[Fri Apr 17 02:00:00 2026] PHP 8.1.0 Development Server (http://localhost:8000) started
```

### Step 6: Open in Browser

Open your web browser and go to:
```
http://localhost:8000
```

---

## Login Credentials

### Admin Account
- **Username:** `admin`
- **Password:** `password`
- **Access:** Full admin dashboard, manage songs, singers, composers, companies

### Customer Accounts
- **Username:** `alice` | **Password:** `password`
- **Username:** `bob` | **Password:** `password`
- **Access:** Browse songs, make purchases, view purchase history

---

## Troubleshooting

### "Connection refused" or "Database connection failed"
**Solution:**
1. Check if PostgreSQL is running:
   ```bash
   # Mac
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```
2. Verify database exists:
   ```bash
   psql -l | grep online_music_shop
   ```
3. Check your PostgreSQL username/password in `config/db.php`

### "Call to undefined function pg_connect"
**Solution:** Install PHP PostgreSQL extension
```bash
# Mac
brew install php-pgsql

# Linux
sudo apt install php-pgsql

# Then restart PHP server
```

### "Port 8000 already in use"
**Solution:** Use a different port
```bash
php -S localhost:8080
# Then open http://localhost:8080
```

### Pages showing PHP code instead of rendering
**Solution:** Make sure you're using `php -S` command, not just opening files directly in browser

### "Session not working" or "Cannot login"
**Solution:** Check PHP session directory has write permissions
```bash
# Mac/Linux
sudo chmod 777 /tmp
```

---

## Project Structure

```
DBMS PROJ/
├── admin/              # Admin dashboard pages
├── auth/               # Login/Register pages
├── customer/           # Customer pages
├── config/             # Database & helper functions
├── includes/           # Header/Footer templates
├── assets/             # CSS/JS/Images
├── node_app/           # PostgreSQL schema
├── index.php           # Homepage
└── song.php            # Song details page
```

---

## Stopping the Server

Press `Ctrl + C` in the terminal where PHP server is running

---

## Next Steps

1. Browse songs on homepage
2. Login as admin to add/edit content
3. Login as customer to make purchases
4. Check `admin/dashboard.php` for statistics

---

## Need Help?

- Check PostgreSQL logs: `tail -f /usr/local/var/log/postgresql@16.log` (Mac)
- Check PHP errors: Look at terminal where `php -S` is running
- Verify database tables: `psql online_music_shop -c "\dt"`
