const groupService = require('../group/group.service')
const utilService = require('../../services/util.service')
const boardService = require('../board/board.service')


async function add(task, isFifo, isDuplicate) {
    task._id = utilService.makeId()
    const group = await groupService.query(task.groupId, task.boardId)
    isFifo
        ? group.tasks.push(isDuplicate ? _replaceTaskEntitiesIds(task) : task)
        : group.tasks.unshift(isDuplicate ? _replaceTaskEntitiesIds(task) : task)
    await groupService.update(group)
}

async function update(task, isFifo = true, isDuplicate = false) {
    const { groupId, boardId } = task
    if (!task || !groupId) return Promise.reject('Cannot save task')
    const group = await groupService.query(groupId, boardId)
    if (!group) return Promise.reject('group not found')
    if (task.groupId !== group._id) return Promise.reject('Unmatched group')
    let savedTask
    if (task._id) {
        const idx = group.tasks.findIndex(anyTask => anyTask._id === task._id)
        if (idx === -1) return Promise.reject('Task not found and cannot be updated')
        group.tasks[idx] = task
        savedTask = task
    } else {
        savedTask = { ...task, _id: utilService.makeId() }
        if (isDuplicate) _replaceTaskEntitiesIds(savedTask)
        isFifo
            ? group.tasks.push(savedTask)
            : group.tasks.unshift(savedTask)
    }
    await groupService.update(group)
}

async function remove(task) {
    const { groupId, boardId } = task
    if (!task._id || !groupId) return Promise.reject('Cannot remove task')
    const group = await groupService.query(groupId, boardId)
    if (!group) return Promise.reject('group not found')
    const idx = group.tasks.findIndex(anyTask => anyTask._id === task._id)
    if (idx === -1) return Promise.reject('Task not found and cannot be removed')
    const removedTask = group.tasks.splice(idx, 1)
    await groupService.update(group)
}


async function addMany(tasks, tasksCopy, boardId) {
    const data = await boardService.query(boardId)
    const { board } = data
    const boardCopy = JSON.parse(JSON.stringify(board))
    boardCopy.groups.forEach((group, groupIdx) => {
        tasks.forEach((task, taskIdx) => {
            if (group.tasks.find(anyTask => anyTask._id === task._id)) {

                board.groups[groupIdx].tasks.push(tasksCopy[taskIdx])
            }
        })
    })
    // console.log(board.groups[0])
    boardService.update(board)
}

function _replaceTaskEntitiesIds(taskToDuplicate) {
    const { taskId: _id } = taskToDuplicate
    taskToDuplicate.comments?.ForEach(comment => {
        comment._id = utilService.makeId()
        comment.taskId = taskId
        return
    })
}

module.exports = {
    add,
    update,
    remove,
    addMany,
}