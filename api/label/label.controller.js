const labelService = require('./label.service.js')
const logger = require('../../services/logger.service')
const socketService = require('../../services/socket.service')

async function query(req, res) {
    try {
        const labels = await labelService.query()
        res.json(labels)
    } catch (err) {
        logger.error('Failed to add label', err)
        res.status(500).send({ err: 'Failed to load labels' })
    }
}

async function add(req, res) {
    // const {loggedinUser} = req
    try {
        const { label, type } = req.body
        const labels = await labelService.add(label, type)
        res.json(labels)
    } catch (err) {
        logger.error('Failed to add label', err)
        res.status(500).send({ err: 'Failed to add label' })
    }
}

async function update(req, res) {
    try {
        const { label, type } = req.body
        const labels = await labelService.update(label, type)
        res.json(labels)
    } catch (err) {
        logger.error('Failed to update label', err)
        res.status(500).send({ err: 'Failed to update label' })

    }
}

async function remove(req, res) {
    try {
        const { type, id } = req.body
        const labels = await labelService.remove(id, type)
        res.send(labels)
    } catch (err) {
        logger.error('Failed to remove label', err)
        res.status(500).send({ err: 'Failed to remove label' })
    }
}

module.exports = {
    add,
    query,
    remove,
    update,
}
