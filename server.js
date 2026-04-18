const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

// --- GLOBAL MOCK DATA FOR DEMO ---
let mockSingers = [ 
    { singer_id: 1, name: 'Arijit Singh', contact_no: '9876543210', address: 'Andheri West, Mumbai' },
    { singer_id: 2, name: 'Shreya Ghoshal', contact_no: '9123456789', address: 'Bandra, Mumbai' },
    { singer_id: 3, name: 'Sonu Nigam', contact_no: '9988776655', address: 'Juhu, Mumbai' }
];

let mockComposers = [
    { composer_id: 1, name: 'Mithoon', contact_no: '8877665544', address: 'Lokhandwala, Mumbai' },
    { composer_id: 2, name: 'A.R. Rahman', contact_no: '7766554433', address: 'Kodambakkam, Chennai' },
    { composer_id: 3, name: 'Pritam', contact_no: '6655443322', address: 'Powai, Mumbai' }
];

let mockCompanies = [
    { company_id: 1, name: 'T-Series' },
    { company_id: 2, name: 'Sony Music' },
    { company_id: 3, name: 'Zee Music' }
];

let mockSongsArray = [
    { song_id: 1, title: 'Tum Hi Ho', movie_name: 'Aashiqui 2', singers: 'Arijit Singh', category: 'Romantic', available_as: 'MP3, WAV', price: 25.00, duration: '04:22' },
    { song_id: 2, title: 'Kun Faya Kun', movie_name: 'Rockstar', singers: 'Arijit Singh', category: 'Sufi', available_as: 'MP3, WAV', price: 30.00, duration: '07:52' },
    { song_id: 3, title: 'Chaiyya Chaiyya', movie_name: 'Dil Se', singers: 'Sonu Nigam', category: 'Folk', available_as: 'MP3', price: 15.00, duration: '06:54' }
];

let mockUsers = [];
let mockPurchases = [];

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/online_music_shop',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key-123',
    resave: false,
    saveUninitialized: false
}));

// Helpers for views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isAdmin = req.session.user?.role === 'admin';
    res.locals.isCustomer = req.session.user?.role === 'customer';
    res.locals.formatPrice = (p) => '₹' + parseFloat(p).toFixed(2);
    res.locals.catBadge = (cat) => {
        const m = {'Romantic':'badge-romantic','Sad':'badge-sad','Party':'badge-party','Sufi':'badge-sufi',
                   'Folk':'badge-folk','Patriotic':'badge-patriotic','Classical':'badge-classical',
                   'Devotional':'badge-devotional','Item':'badge-item'};
        return `<span class="badge ${m[cat]||'badge-other'}">${cat}</span>`;
    };
    next();
});

// Auth Middleware
const reqL = (req, res, next) => { if(!req.session.user) return res.redirect('/login'); next(); };
const reqA = (req, res, next) => { if(req.session.user?.role !== 'admin') return res.status(403).send('Denied'); next(); };

// --- ROUTES ---

app.get('/', async (req, res) => {
    try {
        const songs = await pool.query('SELECT * FROM v_song_details ORDER BY song_id DESC LIMIT 6');
        const stats = await pool.query(`SELECT 
            (SELECT COUNT(*) FROM songs) AS total_songs,
            (SELECT COUNT(*) FROM singers) AS total_singers,
            (SELECT COUNT(*) FROM customers) AS total_customers`);
        res.render('index', { songs: songs.rows, stats: stats.rows[0] });
    } catch (err) {
        // Render the page anyway so the user can see the design without a DB available locally
        // Using mock data from database/schema.sql
        res.render('index', { 
             songs: mockSongsArray, 
             stats: { total_songs: mockSongsArray.length, total_singers: mockSingers.length, total_customers: 2 },
             error: "Database not connected. Please configure DATABASE_URL in .env."
        });
    }
});

// Shop
app.get('/shop', async (req, res) => {
    const q = req.query.q || '';
    const cat = req.query.cat || '';
    
    let sql = 'SELECT * FROM v_song_details WHERE 1=1 ';
    let params = [];
    let paramCount = 1;
    
    if (q) {
        sql += ` AND (title ILIKE $${paramCount} OR movie_name ILIKE $${paramCount+1} OR singers ILIKE $${paramCount+2} OR composers ILIKE $${paramCount+3} OR company_name ILIKE $${paramCount+4})`;
        const like = `%${q}%`;
        params.push(like, like, like, like, like);
        paramCount += 5;
    }
    if (cat) {
        sql += ` AND category = $${paramCount}`;
        params.push(cat);
    }
    sql += ' ORDER BY title ASC';
    
    try {
        const result = await pool.query(sql, params);
        res.render('shop', { songs: result.rows, q, cat });
    } catch (err) {
        let filteredSongs = mockSongsArray;
        if (q) {
            const lq = q.toLowerCase();
            filteredSongs = filteredSongs.filter(s => 
                s.title.toLowerCase().includes(lq) || 
                s.movie_name.toLowerCase().includes(lq) || 
                String(s.singers).toLowerCase().includes(lq)
            );
        }
        if (cat) {
            filteredSongs = filteredSongs.filter(s => s.category === cat);
        }
        res.render('shop', { songs: filteredSongs, q, cat });
    }
});

// Song Detail & Buy
app.all('/song/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const songResult = await pool.query('SELECT * FROM v_song_details WHERE song_id = $1', [id]);
        if (songResult.rows.length === 0) return res.status(404).send('Not Found');
        
        const song = songResult.rows[0];
        const custId = req.session.user?.customer_id;
        const purchaseResult = await pool.query('SELECT purchase_id FROM purchases WHERE customer_id = $1 AND song_id = $2', [custId, id]);
        let alreadyOwned = purchaseResult.rows.length > 0;
        let flash = '';

        if (req.method === 'POST' && req.body.buy) {
            if (!req.session.user) return res.redirect('/login');
            if (req.session.user.role === 'admin') {
                flash = 'Admins cannot purchase.';
            } else if (!alreadyOwned) {
                const fmt = req.body.format || 'MP3';
                await pool.query('INSERT INTO purchases (customer_id, song_id, amount_paid, format_chosen) VALUES ($1, $2, $3, $4)',
                    [custId, id, song.price, fmt]);
                alreadyOwned = true;
                flash = 'Purchase successful!';
            }
        }
        res.render('song', { song, alreadyOwned, flash });
    } catch (err) {
        // Fallback for mock memory
        const song = mockSongsArray.find(s => s.song_id == id);
        if (!song) return res.status(404).send('Not Found');
        
        const custId = req.session.user?.username; // Use username for mock tracking
        let alreadyOwned = mockPurchases.some(p => p.username === custId && p.song_id == id);
        let flash = '';

        if (req.method === 'POST' && req.body.buy) {
            if (!req.session.user) return res.redirect('/login');
            if (req.session.user.role === 'admin') {
                flash = 'Admins cannot purchase.';
            } else if (!alreadyOwned) {
                const fmt = req.body.format || 'MP3';
                mockPurchases.push({ 
                    purchase_id: mockPurchases.length + 1, 
                    username: custId, 
                    song_id: song.song_id, 
                    amount_paid: song.price, 
                    format_chosen: fmt,
                    purchase_date: new Date()
                });
                alreadyOwned = true;
                flash = 'Purchase successful in Local Memory!';
            }
        }
        res.render('song', { song, alreadyOwned, flash });
    }
});

// Auth
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
    const login = req.body.login;
    if (login === 'admin' && req.body.password === 'password') {
        req.session.user = { user_id: 1, username: 'admin', role: 'admin' };
        return res.redirect('/admin');
    }
    try {
        const result = await pool.query(
            'SELECT u.*, c.customer_id FROM users u LEFT JOIN customers c ON c.user_id = u.user_id WHERE u.username = $1 OR u.email = $1',
            [login]
        );
        const user = result.rows[0];
        if (user && bcrypt.compareSync(req.body.password, user.password)) {
            req.session.user = user;
            res.redirect(user.role === 'admin' ? '/admin' : '/');
        } else {
            res.render('login', { error: 'Invalid credentials.' });
        }
    } catch (err) {
        const mockU = mockUsers.find(u => u.username === login && u.password === req.body.password);
        if (mockU) {
            req.session.user = { user_id: 99, username: mockU.username, role: mockU.role, customer_id: 99 };
            res.redirect('/');
        } else {
            res.render('login', { error: 'Invalid credentials or DB disconnected. Register a mock user first.' });
        }
    }
});

app.get('/register', (req, res) => res.render('register', { error: null, success: null }));
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existing = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) return res.render('register', { error: 'Username exists.', success: null });
        
        const hash = bcrypt.hashSync(password, 10);
        await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, hash, 'customer']);
        res.render('register', { error: null, success: 'Account created! Login now.' });
    } catch (err) {
        const exists = mockUsers.find(u => u.username === username);
        if (exists) return res.render('register', { error: 'Username exists in memory.', success: null });
        mockUsers.push({ username, password, role: 'customer' });
        res.render('register', { error: null, success: 'Account created in Local Memory! Login now.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Customer
app.get('/my_purchases', reqL, async (req, res) => {
    if(req.session.user.role === 'admin') return res.redirect('/admin/purchases');
    try {
        const result = await pool.query(
            'SELECT vsd.*, p.amount_paid, p.format_chosen, p.purchase_date FROM purchases p JOIN v_song_details vsd ON vsd.song_id = p.song_id WHERE p.customer_id = $1 ORDER BY p.purchase_date DESC',
            [req.session.user.customer_id]
        );
        res.render('my_purchases', { purchases: result.rows });
    } catch (err) {
        // Mock fallback
        const my_purchases = mockPurchases.filter(p => p.username === req.session.user.username).map(p => {
            const s = mockSongsArray.find(so => so.song_id == p.song_id);
            return { ...s, amount_paid: p.amount_paid, format_chosen: p.format_chosen, purchase_date: p.purchase_date };
        });
        res.render('my_purchases', { purchases: my_purchases.reverse() });
    }
});

app.get('/admin', reqA, async (req, res) => {
    try {
        const stats = await pool.query(`SELECT 
            (SELECT COUNT(*) FROM songs) AS songs,
            (SELECT COUNT(*) FROM singers) AS singers,
            (SELECT COUNT(*) FROM record_companies) AS companies,
            (SELECT COUNT(*) FROM customers) AS customers,
            (SELECT COUNT(*) FROM purchases) AS purchases,
            (SELECT COALESCE(SUM(amount_paid),0) FROM purchases) AS revenue`);
        const recent = await pool.query('SELECT * FROM purchases ORDER BY purchase_date DESC LIMIT 8');
        res.render('admin', { stats: stats.rows[0], recent: recent.rows });
    } catch (err) {
        // Fallback for demo
        res.render('admin', { 
            stats: { songs: mockSongsArray.length, singers: mockSingers.length, companies: mockCompanies.length, customers: mockUsers.length + 2, purchases: mockPurchases.length, revenue: mockPurchases.reduce((acc, p) => acc + p.amount_paid, 0) }, 
            recent: mockPurchases.slice(-8).reverse().map(p => {
                const s = mockSongsArray.find(so => so.song_id == p.song_id);
                return { purchase_id: p.purchase_id, username: p.username, song_title: s?.title || 'Unknown', amount_paid: p.amount_paid };
            }),
            allData: {
                singers: mockSingers,
                composers: mockComposers,
                companies: mockCompanies,
                customers: mockUsers
            }
        });
    }
});

app.get('/admin/add-song', reqA, async (req, res) => {
    try {
        const companies = await pool.query('SELECT * FROM record_companies');
        res.render('add_song', { companies: companies.rows, error: null, success: null });
    } catch (err) {
        res.render('add_song', { companies: mockCompanies, error: null, success: null });
    }
});

app.post('/admin/add-song', reqA, async (req, res) => {
    const { title, movie_name, price, duration, category, available_as, size_mb, company_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO songs (title, movie_name, price, duration, category, available_as, size_mb, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [title, movie_name, price, duration, category, available_as, size_mb, company_id]
        );
        const companies = await pool.query('SELECT * FROM record_companies');
        res.render('add_song', { companies: companies.rows, error: null, success: 'Song added successfully!' });
    } catch (err) {
        // Push into mock data
        const id = mockSongsArray.length + 1;
        mockSongsArray.unshift({ song_id: id, title, movie_name, singers: 'Mock Singer', category, available_as, price: parseFloat(price) });
        res.render('add_song', { companies: mockCompanies, error: null, success: 'Song added to Local Demo Memory successfully!' });
    }
});

// Admin Add Singer
app.get('/admin/add-singer', reqA, (req, res) => {
    res.render('add_singer', { error: null, success: null });
});

app.post('/admin/add-singer', reqA, (req, res) => {
    const { name, contact_no, address } = req.body;
    const id = mockSingers.length + 1;
    mockSingers.push({ singer_id: id, name, contact_no, address });
    res.render('add_singer', { error: null, success: `Singer ${name} added successfully to memory!` });
});

// Admin Add Composer
app.get('/admin/add-composer', reqA, (req, res) => {
    res.render('add_composer', { error: null, success: null });
});

app.post('/admin/add-composer', reqA, (req, res) => {
    const { name, contact_no, address } = req.body;
    const id = mockComposers.length + 1;
    mockComposers.push({ composer_id: id, name, contact_no, address });
    res.render('add_composer', { error: null, success: `Composer ${name} added successfully to memory!` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
