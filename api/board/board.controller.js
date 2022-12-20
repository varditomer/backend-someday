const boardService = require('./board.service.js')
const logger = require('../../services/logger.service')

async function query(req, res) {
  try {
    // const parsedFilter = JSON.parse(req.query.filterBy)
    const id  = req.params?.id || ''
    const data = await boardService.query(id)
    res.send(data)
  } catch (err) {
    logger.error('Failed to get boards', err)
    res.status(500).send({ err: 'Failed to get boards' })
  }
}

async function add(req, res) {
  // const {loggedinUser} = req

  try {
    const board = req.body
    // board.owner = loggedinUser
    const data = await boardService.add(board)
    res.json(data)
  } catch (err) {
    logger.error('Failed to add board', err)
    res.status(500).send({ err: 'Failed to add board' })
  }
}


async function update(req, res) {
  try {
    const board = req.body
    const data = await boardService.update(board)
    res.json(data)
  } catch (err) {
    logger.error('Failed to update board', err)
    res.status(500).send({ err: 'Failed to update board' })

  }
}

async function remove(req, res) {
  try {
    const boardId = req.params.id
    await boardService.remove(boardId)
    res.send(boardId)
  } catch (err) {
    logger.error('Failed to remove board', err)
    res.status(500).send({ err: 'Failed to remove board' })
  }
}

async function removeTasks(req, res) {
  try {
    console.log(`11:`, )
    const { boardId, taskIds } = req.body
    const boardData = await boardService.removeManyTasks(taskIds, boardId)
    res.send(boardData)
  } catch (err) {
    logger.error('Failed to remove board', err)
    res.status(500).send({ err: 'Failed to remove board' })
  }
}

async function newBoardMsg(req, res) {
  const { loggedinUser } = req
  try {
    const boardId = req.params.id
    const msg = {
      txt: req.body.txt,
      by: loggedinUser
    }
    const savedMsg = await boardService.newBoardMsg(boardId, msg)
    res.json(savedMsg)
  } catch (err) {
    logger.error('Failed to update board', err)
    res.status(500).send({ err: 'Failed to update board' })

  }
}

async function deleteBoardMsg(req, res) {
  const { loggedinUser } = req
  try {
    const boardId = req.params.id
    const { msgId } = req.params

    const removedId = await boardService.deleteBoardMsg(boardId, msgId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove board msg', err)
    res.status(500).send({ err: 'Failed to remove board msg' })

  }
}

module.exports = {
  query,
  add,
  update,
  remove,
  removeTasks
}
