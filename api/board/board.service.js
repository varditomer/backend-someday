const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const utilService = require('../../services/util.service')
const userService = require('../../api/user/user.service')
const ObjectId = require('mongodb').ObjectId

async function query(id) {
    try {
        let board
        const collection = await dbService.getCollection('board')
        if (id) board = await collection.findOne({ _id: ObjectId(id) })
        else board = (await collection.findOne())
        if (!board.groups) board.groups = []
        const dataMap = await _getDataMap(board)
        const miniBoards = await _getMiniBoards()
        const stats = _getBoardStats(board, dataMap.tasks)
        const res = {
            board,
            miniBoards,
            dataMap,
            stats
        }
        return res
    } catch (err) {
        logger.error('cannot find board', err)
        throw err
    }
}

async function remove(boardId) {
    try {
        const collection = await dbService.getCollection('board')
        await collection.deleteOne({ _id: ObjectId(boardId) })
    } catch (err) {
        logger.error(`cannot remove board ${boardId}`, err)
        throw err
    }
}

async function add(board) {
    try {
        const collection = await dbService.getCollection('board')
        let newBoard = await collection.insertOne(board)
        newBoard = newBoard.ops[0]
        newBoard = _connectIds(newBoard)
        await update(newBoard)
        const dataMap = _getDataMap(board)
        // console.log(`dataMap`, dataMap)
        const miniBoards = await _getMiniBoards()
        const stats = _getBoardStats(board, dataMap.tasks)
        return {
            board,
            miniBoards,
            dataMap,
            stats
        }
    } catch (err) {
        logger.error('cannot insert board', err)
        throw err
    }
}

async function update(board) {
    try {
        const collection = await dbService.getCollection('board')
        const boardCopy = JSON.parse(JSON.stringify(board))
        delete boardCopy._id
        await collection.updateOne({ _id: ObjectId(board._id) }, { $set: boardCopy })
        const dataMap = _getDataMap(board)
        const miniBoards = await _getMiniBoards()
        const stats = _getBoardStats(board, dataMap.tasks)
        return {
            board,
            miniBoards,
            dataMap,
            stats
        }
    } catch (err) {
        logger.error(`cannot update board ${board._id}`, err)
        throw err
    }
}

async function removeManyTasks(taskIds, boardId) {
    if (!taskIds?.length || !boardId) return
    const data = await query(boardId)
    if (!data) return Promise.reject('Cannot find board')
    const { board } = data
    board.groups = board.groups.map(group => {
        group.tasks = group.tasks.reduce((tasks, task) => {
            if (!taskIds.includes(task._id)) tasks.push(task)
            return tasks
        }, [])
        return group
    })
    await update(board)
    const dataMap = _getDataMap(board)
    const miniBoards = await _getMiniBoards()
    const stats = _getBoardStats(board, dataMap.tasks)
    return {
        board,
        miniBoards,
        dataMap,
        stats
    }
}



async function _getDataMap(board) {
    const personFilter = await userService.query()
    // console.log(personFilter);
    const groupTitle = []
    const taskFilter = {
        status: [],
        priority: [],
        date: [],
        text: [],
        numbers: []
    }
    board.groups?.forEach(group => {
        if (!groupTitle.includes(group.title)) groupTitle.push(group.title)
        group.tasks.forEach(task => {
            for (let prop in taskFilter) {
                if (task[prop] && !taskFilter[prop].includes(task[prop])) taskFilter[prop].push(task[prop])
            }
        })
    })
    return {
        group: groupTitle,
        tasks: { ...taskFilter, person: personFilter }
    }
}

async function _getMiniBoards() {
    const collection = await dbService.getCollection('board')
    let boards = await collection.find({}).toArray()
    boards = boards.map(({ _id, title }) => ({ _id, title }))
    return boards
}

function _getBoardStats(board, taskDataMap) {
    const valCountMap = {}
    const taskCount = board.groups?.reduce((taskCounter, group) => {
        if (!valCountMap[group.title]) valCountMap[group.title] = 0
        valCountMap[group.title]++
        taskCounter += group.tasks.length
        group.tasks.forEach(task => {
            for (const key in taskDataMap) {
                const value = task[key]
                if (value && taskDataMap[key].includes(value)) {
                    if (!valCountMap[value]) valCountMap[value] = 0
                    valCountMap[value]++
                }
            }
        })
        return taskCounter
    }, 0) || {}
    return { valCountMap, taskCount }
}

function _connectIds(board) {
    board.groups.forEach(group => {
        group._id = group._id || utilService.makeId()
        group.boardId = board._id
        group.tasks.forEach(task => {
            task._id = utilService.makeId()
            task.boardId = board._id
            task.groupId = group._id
        })
    })
    return board
}


// async function addBoardMsg(boardId, msg) {
//     try {
//         msg.id = utilService.makeId()
//         const collection = await dbService.getCollection('board')
//         await collection.updateOne({ _id: ObjectId(boardId) }, { $push: { msgs: msg } })
//         return msg
//     } catch (err) {
//         logger.error(`cannot add board msg ${boardId}`, err)
//         throw err
//     }
// }

// async function removeBoardMsg(boardId, msgId) {
//     try {
//         const collection = await dbService.getCollection('board')
//         await collection.updateOne({ _id: ObjectId(boardId) }, { $pull: { msgs: {id: msgId} } })
//         return msgId
//     } catch (err) {
//         logger.error(`cannot add board msg ${boardId}`, err)
//         throw err
//     }
// }

module.exports = {
    remove,
    query,
    add,
    update,
    removeManyTasks
}
