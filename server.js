require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database Connection Pool
let pool;
async function initializeDatabase() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'dharshini@123',
      database: process.env.DB_NAME || 'flashcard',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully!');
    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
}

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Routes

// Signup
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      process.env.JWT_SECRET || 'secret_key', 
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Login successful', 
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Create a new flashcard set
app.post('/sets', authenticateToken, async (req, res) => {
  try {
    const { set_name } = req.body;
    const userId = req.user.id;

    if (!set_name) {
      return res.status(400).json({ message: 'Set name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO sets (user_id, set_name) VALUES (?, ?)',
      [userId, set_name]
    );

    res.json({ 
      message: 'Set created successfully',
      set_id: result.insertId,
      set_name
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating set' });
  }
});

// Add word to a set
app.post('/words', authenticateToken, async (req, res) => {
  try {
    const { set_id, word, definition } = req.body;
    
    if (!set_id || !word || !definition) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    await pool.execute(
      'INSERT INTO words (set_id, word, definition) VALUES (?, ?, ?)',
      [set_id, word, definition]
    );

    res.json({ message: 'Word added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding word' });
  }
});

// Get user's sets
app.get('/sets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [sets] = await pool.execute(
      'SELECT * FROM sets WHERE user_id = ?',
      [userId]
    );
    res.json(sets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sets' });
  }
});

// Get words in a set
app.get('/sets/:setId/words', authenticateToken, async (req, res) => {
  try {
    const { setId } = req.params;
    const [words] = await pool.execute(
      'SELECT * FROM words WHERE set_id = ?',
      [setId]
    );
    res.json(words);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching words' });
  }
});

// Add to favorites - UPDATED VERSION
app.post('/favorites', authenticateToken, async (req, res) => {
  try {
    const { set_id } = req.body;
    const userId = req.user.id;

    if (!set_id) {
      return res.status(400).json({ message: 'set_id is required' });
    }

    // Check if set exists and belongs to user
    const [set] = await pool.execute(
      'SELECT * FROM sets WHERE set_id = ? AND user_id = ?',
      [set_id, userId]
    );

    if (set.length === 0) {
      return res.status(404).json({ message: 'Set not found' });
    }

    // Check if already favorited
    const [existing] = await pool.execute(
      'SELECT * FROM favorites WHERE user_id = ? AND set_id = ?',
      [userId, set_id]
    );

    if (existing.length > 0) {
      // Remove from favorites
      await pool.execute(
        'DELETE FROM favorites WHERE user_id = ? AND set_id = ?',
        [userId, set_id]
      );
      await pool.execute(
        'UPDATE sets SET is_favorite = FALSE WHERE set_id = ?',
        [set_id]
      );
      return res.json({ 
        message: 'Removed from favorites',
        action: 'removed'
      });
    }

    // Add to favorites
    await pool.execute(
      'INSERT INTO favorites (user_id, set_id) VALUES (?, ?)',
      [userId, set_id]
    );
    await pool.execute(
      'UPDATE sets SET is_favorite = TRUE WHERE set_id = ?',
      [set_id]
    );
    
    return res.json({ 
      message: 'Added to favorites',
      action: 'added'
    });
    
  } catch (error) {
    console.error('Error in favorites:', error);
    res.status(500).json({ message: 'Error updating favorites' });
  }
});
// Add this new route to server.js before starting the server

// Delete a set
app.delete('/sets/:setId', authenticateToken, async (req, res) => {
  try {
    const { setId } = req.params;
    const userId = req.user.id;

    // First delete all words in the set
    await pool.execute('DELETE FROM words WHERE set_id = ?', [setId]);
    
    // Then delete the set
    const [result] = await pool.execute(
      'DELETE FROM sets WHERE set_id = ? AND user_id = ?',
      [setId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Set not found or not owned by user' });
    }

    res.json({ message: 'Set deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting set' });
  }
});

// Start Server
async function startServer() {
  await initializeDatabase();
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});