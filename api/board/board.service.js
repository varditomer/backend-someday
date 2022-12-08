const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const utilService = require('../../services/util.service')
const ObjectId = require('mongodb').ObjectId

async function query(filterBy = {}) {
    try {
        let board
        const collection = await dbService.getCollection('board')
        if (filterBy.id) board = await collection.findOne({ _id: ObjectId(filterBy.id) })
        else board = (await collection.find().toArray())[0]
        if (filterBy.groupTitles || filterBy.tasks) board = await _multiFilter(filterBy, board)
        else {
            if (filterBy.userId) board = _filterByPerson(board, filterBy.userId)
            if (filterBy.txt) board = _filterByTxt(board, filterBy.txt)
        }
        const res = {
            board,
            miniBoards: await _getMiniBoards(board),
            dataMap: await _getDataMap(board)
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
        return { board: newBoard, miniBoards: _getMiniBoards(), dataMap: _getDataMap(newBoard) }
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
    } catch (err) {
        logger.error(`cannot update board ${board._id}`, err)
        throw err
    }
}

async function removeManyTasks(taskIds, boardId) {
    if (!taskIds?.length || !boardId) return
    const board = await query(boardId)
    if (!board) return Promise.reject('Cannot finf board')
    board.groups = board.groups.reduce((groupArr, group) => {
        if (!taskIds.length) {
            groupArr.push(group)
            return groupArr
        }
        group.tasks = group.tasks.reduce((tasksToKeep, task) => {
            if (!taskIds.length) {
                tasksToKeep.push(task)
                return tasksToKeep
            }
            const idx = taskIds.indexOf(task._id)
            if (idx === -1) tasksToKeep.push(task)
            else taskIds.splice(idx, 1)
            return tasksToKeep
        }, [])
        groupArr.push(group)
        return groupArr
    }, [])
    await update(board)
}



async function _getDataMap(board) {
    const personFilter = [
        {
            _id: "u102",
            fullname: "Refael Abramov",
            imgUrl: "src/assets/imgs/refael-avatar.png",
            color: 'rgb(236, 105, 192)',
            isAdmin: true,
            contact: {
                mail: 'refaelavramov@gmail.com'
            }
        },
        {
            _id: "u103",
            fullname: "Tomer Vardi",
            imgUrl: "src/assets/imgs/tomer-avatar.png",
            color: 'rgb(55, 124, 80)',
            isAdmin: true,
            contact: {
                mail: 'tomervardi@gmail.com'
            }
        },
        {
            _id: "u104",
            fullname: "Ronen Boxer",
            imgUrl: "src/assets/imgs/ronen-avatar.png",
            color: 'rgb(238, 109, 64)',
            isAdmin: true,
            contact: {
                mail: 'ronenboxer@gmail.com'
            }
        }
    ]
    const groupTitle = []
    const taskFilter = {
        status: [],
        priority: [],
        date: [],
        text: [],
        numbers: []
    }
    board.groups.forEach(group => {
        if (!groupTitle.includes(group.title)) groupTitle.push(group.title)
        group.tasks.forEach(task => {
            for (let prop in taskFilter) {
                if (!taskFilter[prop].includes(task[prop])) taskFilter[prop].push(task[prop])
            }
        })
    })
    return {
        groupTitle,
        tasks: { ...taskFilter, person: personFilter }
    }
}

async function _getMiniBoards() {
    const collection = await dbService.getCollection('board')
    let boards = await collection.find({}).toArray()
    boards = boards.map(({ _id, title }) => ({ _id, title }))
    return boards
}


function _filterByPerson(board, id) {
    if (!id) return board
    board.groups = board.groups.filter(group => {
        if (!group.tasks || !group.tasks.length) return false
        group.tasks = group.tasks.filter(task => {
            return task?.person?.some(person => person._id === id)
        })
        return (group.tasks && group.tasks.length)
    })
    return board
}

function _filterByTxt(board, txt) {
    if (!txt) return board
    const regex = new RegExp(txt, 'ig')
    board.groups = board.groups.reduce((groupArr, group) => {
        const isGroupTitleMatch = regex.test(group.title)
        if (isGroupTitleMatch) {
            group.title = group.title.replaceAll(regex, match => `<span class="highlight">${match}</span>`)
        }

        group.tasks = group.tasks.reduce((taskArr, task) => {
            if (regex.test(task.title)) {
                task.title = task.title.replaceAll(regex, match => `<span class="highlight">${match}</span>`)
                taskArr.push(task)
            }
            return taskArr
        }, [])

        if (group.tasks?.length || isGroupTitleMatch) groupArr.push(group)
        return groupArr

    }, [])
    return board
}

async function _multiFilter(filterBy, board) {
    board.groups = board.groups.reduce((filteredGroups, group) => {
        if (filterBy?.groupTitle && filterBy.groupTitle !== group.title) return filteredGroups
        if (filterBy.tasks) group.tasks = group.tasks.reduce((filteredTasks, task) => {
            const taskFilter = JSON.parse(JSON.stringify(filterBy.tasks))
            if (taskFilter.person?.length &&
                !taskFilter.person.every(id => {
                    return (task.person && task.person.find(person => person._id === id))
                })) return filteredTasks
            delete taskFilter.person
            for (let prop in taskFilter) {
                if (task[prop] !== taskFilter[prop]) return filteredTasks
            }
            filteredTasks.push(task)
            return filteredTasks
        }, [])
        if (group.tasks.length) filteredGroups.push(group)
        return filteredGroups
    }, [])
    return board
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
