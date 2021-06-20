  
// Import Connection
const db = require('./../connection/Connection')

const create = (req, res) => {
    try {
        // Step1. Get All Data
        const data = req.body
        const dataToken = req.dataToken

        console.log(data)
        console.log(dataToken.id)

        // Step2. Validasi Data
        if(!data.title || !data.description || !data.date) throw { message: 'Data Must Be Filled!' }

        let dataToInsert = {
            title: data.title,
            description: data.description,
            date: data.date,
            users_id: dataToken.id
        }

        // Step3. Insert Data
        db.query(`INSERT INTO todolists SET ?`, dataToInsert, (err, result) => {
            try {
                if(err) throw err

                res.status(200).send({
                    error: false,
                    message: 'Create Todo Success'
                })
            } catch (error) {
                res.status(500).send({
                    error: true,
                    message: error
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

const get = (req, res) => {
    // get data by token (dari jwt middleware)
    let idUser = req.dataToken.id

    db.query(`SELECT * FROM todolists WHERE users_id = ?`, idUser, (err, result) => {
        try {
            if(err) throw err
            
            let newData = []
            result.forEach((value) => {
                let dateIndex = null
                newData.forEach((val, index) => {
                    
                    if(val.date === (value.date).toDateString()){
                        dateIndex = index
                    }
                
                })
                    if(dateIndex === null){
                        newData.push(
                            {
                                localTime: (value.date).toLocaleString().slice(0,9),
                                
                                date: (value.date).toDateString(),
                                todolists: [{
                                    id: value.id, title: value.title, description: value.description, status: value.status, time: (value.date).toString().split(' ')[4].slice(0, 5)
                                }]
                            }
                        )
                    }else{
                        newData[dateIndex].todolists.push({id: value.id, title: value.title, description: value.description, status: value.status, time: (value.date).toString().split(' ')[4].slice(0, 5)})
                    }
                // sort by date
                newData.sort((a,b) => {
                    return a.localTime.split('/')[1] - b.localTime.split('/')[1]
                })
                // sort by month
                newData.sort((a,b) => {
                    return a.localTime.split('/')[0] - b.localTime.split('/')[0]
                })
                
            })

            res.status(200).send({
                error: false,
                message: 'Get Data Success',
                data: newData
            })
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message
            })
        }
    })
}

const updateStatus = (req, res) => {
    let idUser = req.dataToken.id
    let idTodolist = req.body.idTodolist
    
    console.log(req.body)

    db.query('SELECT * FROM todolists WHERE users_id = ? AND id = ?', [idUser, idTodolist], (err, result) => {
        try {
            if(err) throw err

            if(result.length === 1){
                db.query('UPDATE todolists SET status = 0 WHERE users_id = ? AND id = ?', [idUser, idTodolist], (err, result) => {
                    try {
                        if(err) throw err

                        res.status(200).send({
                            error: false,
                            message: 'Task has been updated'
                        })
                    } catch (error) {
                        res.status(500).send({
                            error: true,
                            message: error.message
                        })
                    }
                })
            }else{
                res.status(500).send({
                    error: true,
                    message: 'Todolists not found'
                })
            }
        } catch (error) {
            res.status(406).send({
                error: true,
                message: error.message
            })
        }
    })
}

const deleteTask = (req, res) => {
    let idUser = req.dataToken.id
    let idTodolist = req.body.idTodolist

    db.query('SELECT * FROM todolists WHERE users_id = ? AND id = ?', [idUser, idTodolist], (err, result) => {
        try {
            if(err) throw err
            
            if(result.length === 1){

                db.query('DELETE FROM todolists WHERE users_id = ? AND id = ?', [idUser, idTodolist], (err,result) => {
                    try {
                        if(err) throw err

                        res.status(200).send({
                            error: false,
                            message: 'Delete Task Success'
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
                    message: 'Delete Failed'
                })
            }
        } catch (error) {
            res.status(406).send({
                error: true,
                message: error.message
            })
        }
    })
}

module.exports = {
    create: create,
    get: get,
    updateStatus: updateStatus,
    deleteTask: deleteTask

}