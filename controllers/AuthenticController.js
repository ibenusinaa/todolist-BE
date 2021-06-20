const validator = require('validator')
const fs = require('fs')
const handlebars = require('handlebars')
const jwt = require('jsonwebtoken')

// import connection
const db = require('./../connection/Connection')

// import function hash
const hashPassword = require('./../helpers/Hash')

// import transporter
const transporter = require('./../helpers/transporter')

// #### REGISTER ####
const register = (req, res) => {
    try {
        // step 1, ambil semua input dari FE
        const data = req.body
        console.log(data)

        // step 2. validasi data
        if(!data.email || !data.password) throw {message: 'Kamu belum memasukkan semua data!'}
        
        // validasi email menggunakan npm validator
        if(!(validator.isEmail(data.email))) throw {message: 'Email invalid'}

        // validasi length password
        if(data.password.length < 6) throw {message: 'Minimal password 6 karakter'}

        // step 3. Hash Password
        let passwordHashed
        let activation_code
        try {
            passwordHashed = hashPassword(data.password)
            activation_code = passwordHashed.slice(12, 17)
            console.log(passwordHashed)
            console.log(activation_code)
            const dataToSend = {
                email: data.email,
                password: passwordHashed,
                activation_code: activation_code
            }

            // step 4. Store data ke DB, cek email sudah kedaftar atau belum
            let query = `SELECT * FROM users WHERE email = ?`
            db.query(query, data.email, (err, result) => {
                try {
                    if(err) throw err

                    if(result.length === 0){
                        // insert data
                       
                        db.query('INSERT INTO users SET ?', dataToSend, (err, result) => {
                            try {
                                if(err) throw err
                                
                                // step 5. send email confirmation
                                fs.readFile('D:/purwadhika/BackEnd/todolist_backend/template/EmailConfirmation.html', {encoding: 'utf-8'}, (err, file)=> {
                                    if(err) throw err

                                    const template = handlebars.compile(file)
                                    const templateResult = template({email: data.email, link: `http://localhost:3000/confirmation/${result.insertId}/${passwordHashed}/false`, 
                                                                     linkButton:`http://localhost:3000/confirmation/${result.insertId}/${passwordHashed}/true`, code: activation_code})
                                    transporter.sendMail({
                                        from: 'ibenu.sina@gmail.com',
                                        to: data.email,
                                        subject: 'Testing Email Confirmation',
                                        html: templateResult
                                    })
                                
                                    .then((response) => {
                                        res.status(200).send({
                                            error: false,
                                            message: 'Registration Success! We have sent an email to your email address, please kindly check your email to confirm your account :)'
                                        })
                                    })
                                    .catch((error) => {
                                        res.status(500).send({
                                            error: true,
                                            message: error.message
                                        })
                                    })
                                })
                            } catch (error) {
                                res.status(500).send({
                                    error: true,
                                    message: error.message
                                })
                            }
                        })
                    }else{
                        // 
                        res.status(200).send({
                            error: true,
                            message: 'Email sudah terdaftar'
                        })
                    }
                } catch (error) {
                    res.status(500).send({
                        error: true,
                        message: error.message
                    })
                }
            })
        } catch (error) {
            res.status(500).send({
                error: true,
                message: 'Hash password gagal'
            })
        }

        

    } catch (error) {
        res.status(406).send({
            error: true,
            message: error.message
        })
    }
}



const sendEmail = (req, res) => {
    transporter.sendMail({
        from: 'ibenu.sina@gmail.com',
        to: 'ibenu.sina@gmail.com',
        subject: 'Testing Email Confirmation',
        html: '<h1>Testing Halo</h1>'
    })

    .then((response) => {
        console.log(response)
    })
    .catch((error) => {
        console.log(error)
    })
}

// ##### LOGIN #####
const login = (req, res) => {
    try {
        // Step 1, get all data
        const data = req.body
        console.log(data)
        // step 2, validasi inputannya kosong apa ngga
        if(!data.email || !data.password) throw {message: 'Masih ada data yang belum kamu isi'}

        // step 3. Hash password untuk cocokin data dengan DB
        const passwordHashed = hashPassword(data.password)

        // step 4. cari email & passwordd
        db.query('SELECT * FROM users WHERE email = ?  AND password = ? AND is_email_confirmed = ?', [data.email, passwordHashed, 1], (err, result) => {
            try {
                if(err) throw err

                if(result.length === 1) {
                    jwt.sign({id: result[0].id, activation_code: result[0].activation_code}, '123abc', (err, token) => {
                        try {
                            if(err) throw err
                            res.status(200).send({
                                error: false,
                                message: 'Login Success',
                                data: {
                                    token: token
                                }
                            })
                        } catch (error) {

                            res.status(500).send({
                                error: true,
                                message: 'Token Error'
                            })
                        }
                    })
                }else{
                    res.status(200).send({
                        error: true,
                        message: 'Email atau Password kamu salah'
                    })
                }

            } catch (error) {
                res.status(500).send({
                    error: true,
                    message: error.message
                })
            }
        })
    } catch (error) {
        res.status(406).send({
            error: true,
            message: error.message
        })
    }
}

// ### GET EMAIL ###
const getEmail = (req, res) => {
    let data = req.dataToken

    db.query('SELECT * FROM users WHERE id = ?', data.id, (err, result) => {
        try {
            if(err) throw err

            res.status(200).send({
                error: false,
                message: 'Get username success',
                email: result[0].email
                
            })
        } catch (error) {
            res.status(406).send({
                error: true,
                message: 'Get Username Error'
            })
        }
    })
}

// ### EMAIL CONFIRMATION ###
const emailConfirmation = (req, res) => {
    // Step  1. get ALl data

    const data = req.body
    console.log(data)

    // Step 2. Cek apakan akun sudah aktif
    db.query(`SELECT * FROM users WHERE id = ? AND password = ?`, [data.dataToSend.id, data.dataToSend.password], (err, result) => {
        try {
            if(err) throw err
            console.log(result)
            if(result[0].is_email_confirmed === 0){
                // step 3. akun belum aktif, update is email confirmed
                db.query('UPDATE users SET is_email_confirmed = 1 WHERE id = ? AND password = ?', [data.dataToSend.id, data.dataToSend.password], (err, result) => {
                    try {
                        if(err) throw err

                        res.status(200).send({
                            error: false,
                            message: 'Your account has been activated! Now you can use To-Do-List!'
                        })
                    } catch (error) {
                        res.status(500).send({
                            error: true,
                            message: error.message
                        })
                    }
                }) 
            }else{
                res.status(200).send({
                    error: true,
                    message: 'Your account already active'
                })
            }
        } catch (error) {
            res.status(500).send({
                error: true,
                messageL: error.message
            })
        }
    })
}

// ### CODE CONFIRMATION ###
const codeConfirmation = (req, res) => {
    const data = req.body
    console.log(data)
    db.query(`SELECT * FROM users WHERE id = ? AND activation_code = ?`, [data.dataToSend.id, data.dataToSend.activation_code], (err, result) => {
        try {
            if(err) throw err
            console.log(result)
            if(result[0].is_email_confirmed === 0){
                db.query(`UPDATE users SET is_email_confirmed = 1 WHERE id = ? AND activation_code = ?`, [data.dataToSend.id, data.dataToSend.activation_code], (err, result) => {
                    try {
                        if(err) throw err
                        console.log(result)
                        res.status(200).send({
                            error: false,
                            message: 'Your account has been activated! Now you can use To-Do-List!'
                        })
                    } catch (error) {
                        res.status(500).send({
                            error: true,
                            message: error.message
                        })
                    }
                })
            }else if(result[0].is_email_confirmed === 1){
                res.status(200).send({
                    error: true,
                    message: 'Your account already active'
                })
            }else{
                res.status(200).send({
                    error: true,
                    message: 'Data not found'
                })
            }
        } catch (error) {
            res.status(406).send({
                error: true,
                message: 'Your activation code is wrong'
            })
        }
    })
}
// send email forgot password
const sendForgotPassword = (req, res) => {
    try {
        // ambil data email dari req
        console.log(req.body.email)
        const email = req.body.email

        if(!email) throw {message: 'Kamu belum mengisi email'}
        if(!(validator.isEmail(email))) throw {message: 'Email Invalid'}

        db.query(`SELECT * FROM users WHERE email = ?`, email, (err, result) => {
            try {
                if(err) throw err
                console.log(result)
                if(result.length === 1){
                    jwt.sign({email: email}, '123abc', (err, token) => {
                        try {
                            if(err) throw err

                            fs.readFile('D:/purwadhika/BackEnd/todolist_backend/template/forgotPassConfirmation.html', {encoding: 'utf-8'}, (err, file) => {
                        if(err) throw err

                        const template = handlebars.compile(file)
                        const templateResult = template({email: email, link:`http://localhost:3000/reset-password/${token}`, linkButton: `http://localhost:3000/reset-password/${token}`})

                        transporter.sendMail({
                            from: 'ibenu.sina@gmail.com',
                            to: email,
                            subject: 'To-Do-List Reset Password',
                            html: templateResult
                        })
                        .then((response) => {
                            res.status(200).send({
                                error: false,
                                message: 'We have sent a link to your email address, please click the link to set your new password '
                            })
                        })
                        .catch((error) => {
                            res.status(500).send({
                                error: true,
                                message: error.message
                            })
                        })
                    })
                        } catch (error) {
                            res.status(500).send({
                                error: true,
                                message: 'token error'
                            })
                        }
                    })
                    
                }else{
                    res.status(200).send({
                        error: true,
                        message: 'Email anda tidak terdaftar'
                    })
                }
            } catch (error) {
                res.status(406).send({
                    error: true,
                    message: error.message
                })
            }
        })

    } catch (error) {
        
    }
}

const resetPassword = (req, res) => {
    let data = req.body
    let passwordHashed = hashPassword(data.password)

    try {

        if(data.password.length < 6) throw {message: 'Password anda kurang dari 6 karakter'}
        jwt.verify(data.email, '123abc', (err, dataToken) => {
            try {
                if(err) throw err

                db.query(`SELECT * FROM users WHERE email = ?`, dataToken.email, (err, result) => {
                    try {
                        console.log(result)
                        if(err) throw err
        
                        if(result.length === 1){
                            db.query(`UPDATE users SET password = ? WHERE email = ?`, [passwordHashed, dataToken.email], (err, result) => {
                                try {
                                    if(err) throw err
        
                                    res.status(200).send({
                                        error: false,
                                        message: 'Password has been reset! Now you can login using your new password'
                                    })
                                } catch (error) {
                                    res.status(500).send({
                                        error: true,
                                        message: error.message
                                    })
                                }
                            })
                        }else{
                            res.status(200).send({
                                error: true,
                                message: 'Email anda sudah dihapus oleh sistem'
                            })
                        }
                    } catch (error) {
                        res.status(500).send({
                            error: true,
                            message: error.message
                        })
                    }
                })
            } catch (error) {
                res.status(500).send({
                    error: true,
                    message: 'token error'
                })
            }
        })
    } catch (error) {
        res.status(406).send({
            error: true,
            message: error.message
        })
    }
}

const checkUserVerified = (req, res) => {
    // step 1, get token dulu, dari token kita bisa cari dia akun mana
    // trus apakah akunnya udah confirmed atau belum
    let data = req.dataToken

    db.query('SELECT * FROM users where id =?', data.id, (err, result) => {
        try {
            if(err) throw err

            res.status(200).send({
                error: false,
                is_email_confirmed: result[0].is_email_confirmed
            })
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message
            })
        }
    })
   
}
module.exports = {
    register: register,
    sendEmail: sendEmail,
    login: login,
    emailConfirmation : emailConfirmation,
    codeConfirmation: codeConfirmation,
    forgotPassword: sendForgotPassword,
    resetPassword: resetPassword,
    checkUserVerified: checkUserVerified,
    getEmail: getEmail
}
