const Cryptr = require('cryptr')
const bcrypt = require('bcrypt')
const userService = require('../user/user.service')
const logger = require('../../services/logger.service')
const cryptr = new Cryptr(process.env.SECRET1 || 'Secret-Puk-1234')

async function login(username, password) {
    logger.debug(`auth.service - login with username: ${username}`)

    const user = await userService.getByUsername(username)
    if (!user) return Promise.reject('Invalid username or password')

    //todo: add google auth - no password needed.
    const match = await bcrypt.compare(password, user.password)
    if (!match) return Promise.reject('Invalid username or password')

    delete user.password
    user._id = user._id.toString()
    return user
}

// const user = {
//     username: 'guest',
//     password: '1234',
//     fullname: 'Guest',
//     imgUrl: `https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png`,
// }
// const user2 = {
//     username: 'refarefa1',
//     password: '12345678',
//     fullname: 'Refael Abramov',
//     imgUrl: `https://res.cloudinary.com/someday/image/upload/v1670765493/refael-avatar_qxmtkr.png`,
// }
// const user3 = {
//     username: 'vtomer',
//     password: '12345678',
//     fullname: 'Tomer Vardi',
//     imgUrl: `http://res.cloudinary.com/someday/image/upload/v1670708469/tomer-avatar_e1olwt.png`,
// }
// const user4 = {
//     username: 'ronchu',
//     password: 'qwer',
//     fullname: 'Ronen Boxer',
//     imgUrl: `http://res.cloudinary.com/someday/image/upload/v1670765366/ronen-avatar_b077bs.png`,
// }
// signup(user)
// signup(user2)
// signup(user3)
// signup(user4)

async function signup({ username, password, fullname, imgUrl }) {
    const saltRounds = 10

    logger.debug(`auth.service - signup with username: ${username}, fullname: ${fullname}`)
    if (!username || !password || !fullname) return Promise.reject('Missing required signup information')

    const userExist = await userService.getByUsername(username)
    if (userExist) return Promise.reject('Username already taken')

    const hash = await bcrypt.hash(password, saltRounds)
    return userService.add({ username, password: hash, fullname, imgUrl })
}


function getLoginToken(user) {
    const userInfo = { _id: user._id, fullname: user.fullname, isAdmin: user.isAdmin }
    return cryptr.encrypt(JSON.stringify(userInfo))
}

function validateToken(loginToken) {
    return true
    try {
        const json = cryptr.decrypt(loginToken)
        const loggedinUser = JSON.parse(json)
        return loggedinUser

    } catch (err) {
        console.log('Invalid login token')
    }
    return null
}


module.exports = {
    signup,
    login,
    getLoginToken,
    validateToken
}