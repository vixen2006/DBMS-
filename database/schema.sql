-- ============================================================
-- ONLINE MUSIC SHOP - DATABASE SCHEMA (MySQL)
-- Based exactly on Problem Statement #9
-- ============================================================

DROP DATABASE IF EXISTS online_music_shop;
CREATE DATABASE online_music_shop;
USE online_music_shop;

-- ============================================================
-- (a) Singers: Name, Contact no, Address
-- ============================================================
CREATE TABLE Singers (
    singer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact_no VARCHAR(15),
    address TEXT
);

-- ============================================================
-- (b) Composers: Name, Address, Contact no
-- ============================================================
CREATE TABLE Composers (
    composer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact_no VARCHAR(15),
    address TEXT
);

-- ============================================================
-- (c) Record Companies: Name, Contact no, Address
-- ============================================================
CREATE TABLE Record_Companies (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    contact_no VARCHAR(15),
    address TEXT
);

-- ============================================================
-- (d) Customers: Name, Contact no, Address
-- ============================================================
CREATE TABLE Customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact_no VARCHAR(15),
    address TEXT
);

-- ============================================================
-- (e) Songs: Title, Movie name, Price, Duration, Category, available_as, Size
-- Assumptions applied: Size in MB, Price in Rupees
-- Songs must be searchable by record company (Foreign Key)
-- ============================================================
CREATE TABLE Songs (
    song_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    movie_name VARCHAR(200) NOT NULL,
    price DECIMAL(8,2) NOT NULL COMMENT 'Price in Rupees',
    duration TIME NOT NULL,
    category VARCHAR(50),
    available_as VARCHAR(50) COMMENT 'e.g. MP3, WAV',
    size_mb DECIMAL(6,2) NOT NULL COMMENT 'Size in MB',
    company_id INT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES Record_Companies(company_id) ON DELETE CASCADE
);

-- ============================================================
-- M:N Junction Tables (Because a song can have multiple 
-- singers/composers, and a singer/composer can have many songs)
-- Searchable by Singer and Composer.
-- ============================================================

CREATE TABLE Song_Singers (
    song_id INT NOT NULL,
    singer_id INT NOT NULL,
    PRIMARY KEY (song_id, singer_id),
    FOREIGN KEY (song_id) REFERENCES Songs(song_id) ON DELETE CASCADE,
    FOREIGN KEY (singer_id) REFERENCES Singers(singer_id) ON DELETE CASCADE
);

CREATE TABLE Song_Composers (
    song_id INT NOT NULL,
    composer_id INT NOT NULL,
    PRIMARY KEY (song_id, composer_id),
    FOREIGN KEY (song_id) REFERENCES Songs(song_id) ON DELETE CASCADE,
    FOREIGN KEY (composer_id) REFERENCES Composers(composer_id) ON DELETE CASCADE
);

-- ============================================================
-- Purchase Simulation (Customer buys a song online)
-- ============================================================
CREATE TABLE Purchases (
    purchase_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    song_id INT NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) DEFAULT 'Not Specified',
    amount_paid DECIMAL(8,2) NOT NULL COMMENT 'Amount in Rupees',
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE RESTRICT,
    FOREIGN KEY (song_id) REFERENCES Songs(song_id) ON DELETE RESTRICT
);

-- ============================================================
-- INDEXES FOR SEARCH REQUIREMENTS (Assumption 3)
-- "Songs may be searched by song title, movie, singer, composer, and record company."
-- ============================================================
CREATE INDEX idx_song_title ON Songs(title);
CREATE INDEX idx_movie_name ON Songs(movie_name);
CREATE INDEX idx_singer_name ON Singers(name);
CREATE INDEX idx_composer_name ON Composers(name);
CREATE INDEX idx_company_name ON Record_Companies(name);

-- ============================================================
-- INSERT DEMO DATA FOR TESTING
-- ============================================================

INSERT INTO Singers (name, contact_no, address) VALUES
('Arijit Singh', '9876543210', 'Andheri West, Mumbai'),
('Shreya Ghoshal', '9123456789', 'Bandra, Mumbai'),
('Sonu Nigam', '9988776655', 'Juhu, Mumbai');

INSERT INTO Composers (name, contact_no, address) VALUES
('Pritam', '8877665544', 'Lokhandwala, Mumbai'),
('A.R. Rahman', '7766554433', 'Kodambakkam, Chennai'),
('Vishal-Shekhar', '6655443322', 'Powai, Mumbai');

INSERT INTO Record_Companies (name, contact_no, address) VALUES
('T-Series', '1122334455', 'Noida, UP'),
('Sony Music', '2233445566', 'Santacruz, Mumbai'),
('Zee Music', '3344556677', 'Worli, Mumbai');

INSERT INTO Customers (name, contact_no, address) VALUES
('Rahul Sharma', '9898989898', 'Navrangpura, Ahmedabad'),
('Priya Patel', '8787878787', 'Koramangala, Bangalore');

-- Insert Songs
INSERT INTO Songs (title, movie_name, price, duration, category, available_as, size_mb, company_id) VALUES
('Tum Hi Ho', 'Aashiqui 2', 25.00, '00:04:22', 'Romantic', 'MP3, WAV', 8.5, 1),
('Kun Faya Kun', 'Rockstar', 30.00, '00:07:52', 'Sufi', 'MP3, WAV', 12.0, 1),
('Chaiyya Chaiyya', 'Dil Se', 15.00, '00:06:54', 'Folk', 'MP3', 6.2, 2);

-- Link Songs to Singers
INSERT INTO Song_Singers (song_id, singer_id) VALUES
(1, 1), -- Tum Hi Ho by Arijit
(2, 2), -- Kun Faya Kun by Shreya (demo data mismatch just for example)
(3, 3); -- Chaiyya Chaiyya by Sonu (demo)

-- Link Songs to Composers
INSERT INTO Song_Composers (song_id, composer_id) VALUES
(1, 1), -- Pritam
(2, 2), -- Rahman
(3, 2); -- Rahman

-- Simulate a Purchase
INSERT INTO Purchases (customer_id, song_id, payment_method, amount_paid) VALUES
(1, 1, 'Credit Card', 25.00),
(2, 2, 'UPI', 30.00);

-- ============================================================
-- SQL QUERY TO DEMONSTRATE THE FULL SEARCH CAPABILITY 
-- (Showing how everything links together)
-- ============================================================
CREATE OR REPLACE VIEW Search_View AS
SELECT 
    s.title AS Song,
    s.movie_name AS Movie,
    s.price AS Price_Rs,
    s.size_mb AS Size_MB,
    rc.name AS Record_Company,
    GROUP_CONCAT(DISTINCT si.name) AS Singers,
    GROUP_CONCAT(DISTINCT c.name) AS Composers
FROM Songs s
JOIN Record_Companies rc ON s.company_id = rc.company_id
LEFT JOIN Song_Singers ss ON s.song_id = ss.song_id
LEFT JOIN Singers si ON ss.singer_id = si.singer_id
LEFT JOIN Song_Composers sc ON s.song_id = sc.song_id
LEFT JOIN Composers c ON sc.composer_id = c.composer_id
GROUP BY s.song_id, rc.name;
