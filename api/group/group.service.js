const logger = require('../../services/logger.service')
const utilService = require('../../services/util.service')
const boardService = require('../board/board.service')

async function query(groupId, boardId) {
    if (!groupId || !boardId) return Promise.reject('Cannot get group')
    const data = (await boardService.query(boardId))
    const { board } = data
    if (!board) return Promise.reject('Board not found')
    return board.groups.find(anyGroup => anyGroup._id === groupId)
}

async function add(group, isFifo = true) {
    try {
        const { boardId } = group
        const data = await boardService.query(boardId)
        const { board } = data
        group._id = utilService.makeId()
        const groupToSave = _connectIds(group)
        if (!board.groups) board.groups = []
        isFifo
            ? board.groups.push(groupToSave)
            : board.groups.unshift(groupToSave)
        boardService.update(board)
    } catch (err) {
        logger.error('cannot insert group', err)
        throw err
    }
}

async function remove(groupId, boardId) {
    if (!groupId || !boardId) return Promise.reject('Cannot remove group')
    const data = await boardService.query(boardId)
    const { board } = data
    if (!board) return Promise.reject('Board not found')
    const idx = board.groups.findIndex(anyGroup => anyGroup._id === groupId)
    console.log(idx);
    if (idx === -1) return Promise.reject('Group not found')
    board.groups.splice(idx, 1)[0]
    await boardService.update(board)
}


async function update(group, isFifo = true) {
    const { boardId } = group
    if (!group || !boardId) return Promise.reject('Cannot save group')
    const data = (await boardService.query(boardId))
    const { board } = data
    if (!board) return Promise.reject('Board not found')
    if (group._id) {
        const idx = board.groups.findIndex(anyGroup => anyGroup._id === group._id)
        if (idx === -1) return Promise.reject('Group not found')
        board.groups[idx] = group
    } else {
        isFifo
            ? board.groups.unshift(group)
            : board.groups.push(group)
    }
    await boardService.update(board)
}

async function duplicate(groupId, boardId) {
    const group = await query(groupId, boardId)
    const duplicatedGroup = JSON.parse(JSON.stringify(group))
    duplicatedGroup._id = null
    duplicatedGroup.tasks.forEach(task => {
        delete task.groupId
        task._id = utilService.makeId()
    })
    await add(duplicatedGroup, true)
}

function _connectIds(group) {
    group._id = utilService.makeId()
    group.tasks.forEach(task => task.groupId = group._id)
    return group
}

module.exports = {
    query,
    add,
    update,
    remove,
    duplicate
}