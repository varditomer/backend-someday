const taskService = require('./task.service.js')
const logger = require('../../services/logger.service')
const socketService = require('../../services/socket.service')

async function add(req, res) {
    // const {loggedinUser} = req
    try {
        const { task, isFifo } = req.body
        // task.owner = loggedinUser
        await taskService.add(task, isFifo)
        res.json(task)
    } catch (err) {
        logger.error('Failed to add task', err)
        res.status(500).send({ err: 'Failed to add task' })
    }
}
async function addMany(req, res) {
    // const {loggedinUser} = req
    try {
        const { tasks, tasksCopy, boardId } = req.body
        await taskService.addMany(tasks, tasksCopy, boardId)
        res.json(tasks)
    } catch (err) {
        logger.error('Failed to add task', err)
        res.status(500).send({ err: 'Failed to add task' })
    }
}

async function update(req, res) {
    try {
        const { task, isFifo, isDuplicate } = req.body
        await taskService.update(task, isFifo, isDuplicate)
        res.json(task)
    } catch (err) {
        logger.error('Failed to update task', err)
        res.status(500).send({ err: 'Failed to update task' })

    }
}

async function remove(req, res) {
    try {
        const task = req.body
        await taskService.remove(task)
        res.send(task)
    } catch (err) {
        logger.error('Failed to remove task', err)
        res.status(500).send({ err: 'Failed to remove task' })
    }
}

async function duplicate(req, res) {
    try {
        const { taskId, boardId } = req.params
        await taskService.addMany([taskId], [null], boardId)
        res.send(taskId)
    } catch (err) {
        logger.error('Failed to remove task', err)
        res.status(500).send({ err: 'Failed to remove task' })
    }
}

module.exports = {
    add,
    addMany,
    remove,
    update,
    duplicate
}
