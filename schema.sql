-- PostgreSQL Schema for Online Music Shop

-- Singers
CREATE TABLE IF NOT EXISTS singers (
    singer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_no VARCHAR(15),
    address TEXT,
    nationality VARCHAR(50) DEFAULT 'Indian',
    bio TEXT
);

-- Composers
CREATE TABLE IF NOT EXISTS composers (
    composer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_no VARCHAR(15),
    address TEXT,
    nationality VARCHAR(50) DEFAULT 'Indian',
    bio TEXT
);

-- Record Companies
CREATE TABLE IF NOT EXISTS record_companies (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_no VARCHAR(15),
    address TEXT,
    country VARCHAR(50) DEFAULT 'India',
    description TEXT,
    website VARCHAR(200)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer'
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    address TEXT
);

-- Songs
CREATE TABLE IF NOT EXISTS songs (
    song_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    movie_name VARCHAR(200) NOT NULL,
    price DECIMAL(8,2) NOT NULL,
    duration TIME NOT NULL,
    category VARCHAR(50),
    available_as VARCHAR(50),
    size_mb DECIMAL(6,2) NOT NULL,
    company_id INTEGER NOT NULL REFERENCES record_companies(company_id) ON DELETE CASCADE
);

-- Song-Singer Junction
CREATE TABLE IF NOT EXISTS song_singers (
    song_id INTEGER NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
    singer_id INTEGER NOT NULL REFERENCES singers(singer_id) ON DELETE CASCADE,
    PRIMARY KEY (song_id, singer_id)
);

-- Song-Composer Junction
CREATE TABLE IF NOT EXISTS song_composers (
    song_id INTEGER NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
    composer_id INTEGER NOT NULL REFERENCES composers(composer_id) ON DELETE CASCADE,
    PRIMARY KEY (song_id, composer_id)
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
    purchase_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    song_id INTEGER NOT NULL REFERENCES songs(song_id) ON DELETE RESTRICT,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount_paid DECIMAL(8,2) NOT NULL,
    format_chosen VARCHAR(50) DEFAULT 'MP3',
    UNIQUE(customer_id, song_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_song_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_movie_name ON songs(movie_name);
CREATE INDEX IF NOT EXISTS idx_singer_name ON singers(name);
CREATE INDEX IF NOT EXISTS idx_composer_name ON composers(name);
CREATE INDEX IF NOT EXISTS idx_company_name ON record_companies(name);

-- View for song details
CREATE OR REPLACE VIEW v_song_details AS
SELECT 
    s.song_id,
    s.title,
    s.movie_name,
    s.price,
    s.duration,
    s.category,
    s.available_as,
    s.size_mb,
    rc.name AS company_name,
    STRING_AGG(DISTINCT si.name, ', ' ORDER BY si.name) AS singers,
    STRING_AGG(DISTINCT c.name, ', ' ORDER BY c.name) AS composers
FROM songs s
JOIN record_companies rc ON s.company_id = rc.company_id
LEFT JOIN song_singers ss ON s.song_id = ss.song_id
LEFT JOIN singers si ON ss.singer_id = si.singer_id
LEFT JOIN song_composers sc ON s.song_id = sc.song_id
LEFT JOIN composers c ON sc.composer_id = c.composer_id
GROUP BY s.song_id, rc.name;

-- View for purchase details
CREATE OR REPLACE VIEW v_purchase_details AS
SELECT 
    p.purchase_id,
    p.customer_id,
    c.full_name AS customer_name,
    p.song_id,
    s.title AS song_title,
    s.movie_name,
    p.amount_paid,
    p.format_chosen,
    p.purchase_date
FROM purchases p
JOIN customers c ON p.customer_id = c.customer_id
JOIN songs s ON p.song_id = s.song_id;

-- Demo Data
INSERT INTO singers (name, contact_no, address) VALUES
('Arijit Singh', '9876543210', 'Mumbai'),
('Shreya Ghoshal', '9123456789', 'Mumbai'),
('Sonu Nigam', '9988776655', 'Mumbai')
ON CONFLICT DO NOTHING;

INSERT INTO composers (name, contact_no, address) VALUES
('Pritam', '8877665544', 'Mumbai'),
('A.R. Rahman', '7766554433', 'Chennai'),
('Vishal-Shekhar', '6655443322', 'Mumbai')
ON CONFLICT DO NOTHING;

INSERT INTO record_companies (name, contact_no, address) VALUES
('T-Series', '1122334455', 'Noida'),
('Sony Music', '2233445566', 'Mumbai'),
('Zee Music', '3344556677', 'Mumbai')
ON CONFLICT DO NOTHING;

-- Admin user (password: password)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@music.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT DO NOTHING;

-- Customer users
INSERT INTO users (username, email, password, role) VALUES
('alice', 'alice@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer'),
('bob', 'bob@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer')
ON CONFLICT DO NOTHING;

INSERT INTO customers (user_id, full_name, phone, address) VALUES
((SELECT user_id FROM users WHERE username = 'alice'), 'Alice Kumar', '9898989898', 'Bangalore'),
((SELECT user_id FROM users WHERE username = 'bob'), 'Bob Sharma', '8787878787', 'Delhi')
ON CONFLICT DO NOTHING;

INSERT INTO songs (title, movie_name, price, duration, category, available_as, size_mb, company_id) VALUES
('Tum Hi Ho', 'Aashiqui 2', 25.00, '00:04:22', 'Romantic', 'MP3, WAV', 8.5, 1),
('Kun Faya Kun', 'Rockstar', 30.00, '00:07:52', 'Sufi', 'MP3, WAV', 12.0, 1),
('Chaiyya Chaiyya', 'Dil Se', 15.00, '00:06:54', 'Folk', 'MP3', 6.2, 2)
ON CONFLICT DO NOTHING;

INSERT INTO song_singers (song_id, singer_id) VALUES (1, 1), (2, 1), (3, 3) ON CONFLICT DO NOTHING;
INSERT INTO song_composers (song_id, composer_id) VALUES (1, 1), (2, 2), (3, 2) ON CONFLICT DO NOTHING;
