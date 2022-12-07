const express = require('express')
// const { requireAuth, requireAdmin } = require('../../middlewares/requireAuth.middleware')
const { log } = require('../../middlewares/logger.middleware')
const {  add, update, remove, duplicate } = require('./group.controller')
const router = express.Router()

// middleware that is specific to this router
// router.use(requireAuth)

router.post('/', add)
router.post('/:id', duplicate)
router.put('/:id', update)
router.delete('/', remove)

// router.post('/:id/msg', requireAuth, addCarMsg)
// router.delete('/:id/msg/:msgId', requireAuth, removeCarMsg)

module.exports = router