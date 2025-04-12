const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'dharshini@123',
  database: 'flashcard'
});

db.connect(err => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Successfully connected to database!');
    db.query('SHOW TABLES', (err, results) => {
      if (err) throw err;
      console.log('Tables in database:', results);
      db.end();
    });
  }
});