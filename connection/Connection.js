const mysql = require('mysql')

// Connection
const db = mysql.createConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_SQLPORT
})

module.exports = db