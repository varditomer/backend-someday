const groupService = require('./group.service.js')
const logger = require('../../services/logger.service')


async function add(req, res) {
  // const {loggedinUser} = req
  try {
    const { group, isFifo } = req.body
    await groupService.add(group, isFifo)
    res.json(group)
  } catch (err) {
    logger.error('Failed to add group', err)
    res.status(500).send({ err: 'Failed to add group' })
  }
}


async function update(req, res) {
  try {
    const { group } = req.body
    await groupService.update(group)
    res.json(group)
  } catch (err) {
    logger.error('Failed to update group', err)
    res.status(500).send({ err: 'Failed to update group' })

  }
}

async function remove(req, res) {
  try {
    const { groupId, boardId } = req.body
    await groupService.remove(groupId, boardId)
    res.send(groupId)
  } catch (err) {
    logger.error('Failed to remove group', err)
    res.status(500).send({ err: 'Failed to remove group' })
  }
}

async function duplicate(req, res) {
  try {
    const { groupId, boardId } = req.body
    await groupService.duplicate(groupId, boardId)
    res.send(groupId)
  } catch (err) {
    logger.error('Failed to remove group', err)
    res.status(500).send({ err: 'Failed to remove group' })
  }
}

module.exports = {
  add,
  update,
  remove,
  duplicate
}
