const express = require('express')
// const { requireAuth, requireAdmin } = require('../../middlewares/requireAuth.middleware')
const { add, query, update, remove } = require('./label.controller')
const router = express.Router()

// middleware that is specific to this router
// router.use(requireAuth)
router.get('/', query)
router.post('/', add)
router.put('/:id', update)
router.delete('/', remove)


module.exports = router