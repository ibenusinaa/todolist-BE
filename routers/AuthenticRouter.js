const express = require('express')
const Router = express.Router()

// import controller
const authController = require('./../controllers/AuthenticController')

// import middleware
const jwtVerify = require('./../middleware/JWT')

Router.post('/register', authController.register)
Router.get('/send-email', authController.sendEmail)
Router.post('/login', authController.login)
Router.patch('/confirmation', authController.emailConfirmation)
Router.patch('/code-confirmation', authController.codeConfirmation)
Router.patch('/forgot-password', authController.forgotPassword)
Router.patch('/reset-Password', authController.resetPassword)
Router.post('/user-verify', jwtVerify, authController.checkUserVerified)
Router.post('/get-email', jwtVerify, authController.getEmail)

module.exports = Router