const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

// import router
const authRouter = require('./routers/AuthenticRouter')
const todoRouter = require('./routers/TodoRouter')

// cors
app.use(cors())

// body parser
app.use(express.json())

// initialze port
const PORT = 4000

//ROUTE
app.get('/', (req, res) => {
    res.status(200).send(`
    <h1> Authentication System API </h1>
    `)
})

app.use('/authentication-system', authRouter)
app.use('/todo', todoRouter)

app.listen(PORT, () => console.log('API RUNNING ON PORT ' + 4000))