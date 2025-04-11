const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');



// Initialize Express
const app = express();

// Middleware for JSON parsing
app.use(bodyParser.json());
app.use(cors());

// MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'dharshini@123',
  database: 'flashcard'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
  } else {
    console.log('Connected to the MySQL database.');
  }
});



// Signup route
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: 'Error hashing password' });
    }

    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, hashedPassword], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error saving user to database' });
      }
      res.status(200).json({ message: 'User signed up successfully' });
    });
  });
});

app.post("/sets", (req, res) => {
  const { id, set_name } = req.body;
  const sql = "INSERT INTO sets (id, set_name) VALUES (?, ?)";
  db.query(sql, [id, set_name], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Set created successfully!", set_id: result.insertId });
  });
});
// Add words to a set
app.post("/words", (req, res) => {
  const { set_id, word, definition } = req.body;
  const sql = "INSERT INTO words (set_id, word, definition) VALUES (?, ?, ?)";
  db.query(sql, [set_id, word, definition], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Word added successfully!" });
  });
});
// Get user ID (Assuming user is authenticated via token)
app.post("/sets", (req, res) => {
  const { id, set_name } = req.body;

  // Validate the input
  if (!id || !set_name) {
    return res.status(400).json({ message: "User ID and set name are required." });
  }

  // SQL query to insert the set into the database
  const sql = "INSERT INTO sets (id, set_name) VALUES (?, ?)";
  db.query(sql, [id, set_name], (err, result) => {
    if (err) {
      console.error("Error creating set:", err);
      return res.status(500).json({ message: "Error creating the set." });
    }

    // Respond with success and the new set ID
    res.json({ message: "Set created successfully!", set_id: result.insertId });
  });
});
app.get("/get-user-id", (req, res) => {
  // Simulate fetching user ID from session or token
  const userId = 1; // Replace with actual logic to fetch user ID
  if (!userId) {
    return res.status(401).json({ message: "User not logged in." });
  }
  res.json({ id: userId });
});
// Save a set
app.post("/save-set", (req, res) => {
  const { id, set_name } = req.body;

  if (!id || !set_name) {
    return res.status(400).json({ message: "User ID and set name are required." });
  }

  const sql = "INSERT INTO sets (id, set_name) VALUES (?, ?)";
  db.query(sql, [id, set_name], (err, result) => {
    if (err) {
      console.error("Error saving set:", err);
      return res.status(500).json({ message: "Error saving the set." });
    }
    res.json({ message: "Set saved successfully!", set_id: result.insertId });
  });
});
app.post("/favorites", (req, res) => {
  const { id, set_id } = req.body;
  const sql = "INSERT INTO favorites (id, set_id) VALUES (?, ?)";
  db.query(sql, [id, set_id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Set favorited successfully!" });
  });
});
// Log a revision
app.post("/revisions", (req, res) => {
  const { id, set_id, revision_date } = req.body;
  const sql = "INSERT INTO revisions (id, set_id, revision_date) VALUES (?, ?, ?)";
  db.query(sql, [id, set_id, revision_date], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Revision logged successfully!" });
  });
});


// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;  // Change from 'username' to 'email'

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';  // Change from 'username' to 'email'
  db.query(query, [email], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving user' });
    }

    if (result.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = result[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: 'Error comparing passwords' });
      }

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, 'secret_key', {
        expiresIn: '1h',
      });

      res.status(200).json({ message: 'Login successful', token });
    });
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
