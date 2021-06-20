const express = require('express')
const Router = express.Router()

// import controller
const todoController = require('./../controllers/TodoController')

// import middleware
const jwtVerify = require('./../middleware/JWT')

Router.post('/create', jwtVerify, todoController.create)
Router.post('/get', jwtVerify, todoController.get)
Router.patch('/update-status', jwtVerify, todoController.updateStatus)
Router.patch('/delete-task', jwtVerify, todoController.deleteTask)
module.exports = Router