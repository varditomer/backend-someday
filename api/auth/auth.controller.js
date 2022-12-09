const authService = require('./auth.service')
const logger = require('../../services/logger.service')
// const { google } = require('googleapis')

// const oauth2Client = new google.auth.OAuth2(
//     `856304661727-9s62u14qk5du0dmc3n12eeiah47o8j26.apps.googleusercontent.com`,
//     `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`,
//     `http://localhost:5173/api/auth/login`
// )

// const scopes = [
//     'https://www.googleapis.com/auth/drive.metadata.readonly'
// ];


// const authorizationUrl = oauth2Client.generateAuthUrl({
//     // 'online' (default) or 'offline' (gets refresh_token)
//     access_type: 'offline',
//     /** Pass in the scopes array defined above.
//       * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
//     scope: scopes,
//     // Enable incremental authorization. Recommended as a best practice.
//     include_granted_scopes: true
// });

// async function getDecodedOAuthJwtGoogle(token) {
//     const CLIENT_ID_GOOGLE = '856304661727-9s62u14qk5du0dmc3n12eeiah47o8j26.apps.googleusercontent.com'

//     try {
//         const client = new OAuth2Client(CLIENT_ID_GOOGLE)

//         const ticket = await client.verifyIdToken({
//             idToken: token,
//             audience: CLIENT_ID_GOOGLE,
//         })
//         return ticket
//     } catch (error) {
//         return { status: 500, data: error }
//     }
// }


async function login(req, res) {
    // const { username, password } = req.body
    try {
        // const { clientId, credential } = req.body
        // const ticket = await getDecodedOAuthJwtGoogle(credential)
        // console.log(ticket);
        // // res.writeHead(301, { "Location": authorizationUrl });
        // // const user = await authService.login(username, password)
        // // const loginToken = authService.getLoginToken(user)
        // // logger.info('User login: ', user)
        // // res.cookie('loginToken', loginToken, { sameSite: 'None', secure: true })
        // // res.json(user)
        res.send('Baba!')
    } catch (err) {
        logger.error('Failed to Login ' + err)
        res.status(401).send({ err: 'Failed to Login' })
    }
}

async function signup(req, res) {
    try {
        const credentials = req.body
        // Never log passwords
        // logger.debug(credentials)
        const account = await authService.signup(credentials)
        logger.debug(`auth.route - new account created: ` + JSON.stringify(account))
        const user = await authService.login(credentials.username, credentials.password)
        logger.info('User signup:', user)
        const loginToken = authService.getLoginToken(user)
        res.cookie('loginToken', loginToken, { sameSite: 'None', secure: true })
        res.json(user)
    } catch (err) {
        logger.error('Failed to signup ' + err)
        res.status(500).send({ err: 'Failed to signup' })
    }
}

async function logout(req, res) {
    try {
        res.clearCookie('loginToken')
        res.send({ msg: 'Logged out successfully' })
    } catch (err) {
        res.status(500).send({ err: 'Failed to logout' })
    }
}

module.exports = {
    login,
    signup,
    logout
}