#  SwarBazaar — The Ultimate Bollywood Music Experience

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap_5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

**SwarBazaar** is a high-performance, modern web application designed for browsing and purchasing high-quality Bollywood music. Built as a college DBMS project, it showcases a fully normalized database architecture, secure user authentication, and a stunning, responsive dark-mode UI.

---

##  Key Features

###  For Customers
- **Dynamic Browse**: Search and filter songs by Category, Singer, Movie, or Composer.
- **Vibrant Hero Section**: Interactive "Now Playing" card with waveform animations.
- **Mood-Based Exploration**: Browse songs through a grid of categories (Romantic , Sufi , Party , etc.).
- **Digital Library**: Keep track of all your purchased songs in a dedicated "My Purchases" section.
- **Simplified Auth**: Fast registration requiring only a Username and Password.

###  For Administrators
- **Complete Visibility**: Natively view detailed tables for all Singers, Composers, and Record Companies.
- **Inventory Management**: Add new songs, singers, and composers directly through the UI.
- **Mock Persistence**: Built-in in-memory database fallback for local development without a live PostgreSQL connection.

---

##  Tech Stack

- **Backend**: Node.js & Express.js
- **Database**: PostgreSQL (Native Driver: `pg`)
- **Frontend**: EJS (Embedded JavaScript Templates) & Bootstrap 5
- **Styling**: Custom CSS with Glassmorphism & Micro-animations
- **Auth**: Express-Session & Bcrypt hashing

---

##  Quick Start

### 1. Local Development (Demo Mode)
No database setup is required to test the UI and logic!
```bash
# Clone the repository
git clone https://github.com/vixen2006/DBMS-.git

# Install dependencies
npm install

# Start the server
npm start
```
*The app will automatically detect if PostgreSQL is missing and fallback to a stable Mock Memory Database.*

### 2. Production Setup (PostgreSQL)
1. Setup a PostgreSQL database on **Render**, **Supabase**, or locally.
2. Initialize the schema using `database/schema.sql`.
3. Create a `.env` file based on `.env.example`:
```env
DATABASE_URL=your_postgres_url
SESSION_SECRET=your_secret_key
```

---

##  Database Architecture
The project follows a strictly normalized schema ensuring zero data redundancy.
- **Songs**: Linked to Singers, Composers, and Record Companies.
- **Purchases**: Tracks transaction history linked to Songs and Customers.
- **Users**: Secure credential storage with role-based access.

---

##  Test Credentials
| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `password` |
| **User** | Create your own via /register! |

---



###  College Project Disclaimer
This project was developed as a submission for a Database Management Systems (DBMS) course to demonstrate relational mapping, CRUD operations, and transaction integrity.

=========================================================================================================================
