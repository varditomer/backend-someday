const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const utilService = require('../../services/util.service')

async function query() {
    try {
        const collection = await dbService.getCollection('label')
        return (await collection.find()).toArray()
    } catch (err) {
        logger.error(`cannot lad labels`, err)
        throw err
    }
}

async function update(label, type) {
    try {
        const collection = await dbService.getCollection('label')
        const labels = (await collection.findOne(type)).toArray()
        const idx = labels.db.findIndex(anyLabel => anyLabel.id === label.id)
        if (idx !== -1) {
            labels.db[idx] = {...labels.db[idx], label}
        }
        await collection.updateOne({type},{labels})
        // await collection.updateOne({ type, db: { id: label.id } }, {$push:{ ...label }})
        return (await collection.find()).toArray()
    } catch (err) {
        logger.error(`cannot update label ${label._id}`, err)
        throw err
    }
}

async function add(label, type) {
    try {
        const collection = await dbService.getCollection('label')
        collection.updateOne({ type, db: {id: label.id}}, { $push: {...label} })
        return (await collection.find()).toArray()
    } catch (err) {
        logger.error(`cannot add label ${label.id}`, err)
        throw err
    }
}

async function remove(type, id) {
    try {
        const collection = await dbService.getCollection('label')
        collection.updateOne({ type }, { $pull: { db: { id } } })
        return (await collection.find()).toArray()
    } catch (err) {
        logger.error(`cannot remove label ${id}`, err)
        throw err
    }
}

module.exports = {
    add,
    update,
    remove,
    query,
}