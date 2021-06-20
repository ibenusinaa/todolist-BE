const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ibenu.sina@gmail.com', // email sender
        pass: 'rztupikrmfbpjdqp'
    },
    tls: {
        rejectUnauthorized: false
    }
})

module.exports = transporter