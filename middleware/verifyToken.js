const jsonwebtoken = require("jsonwebtoken")
const User = require("../models/User")
const responseHelper = require("../helpers/responseHelper")

/* Make sure that the JWT's user exists and session is valid */
module.exports = async function (request, response, next) {
    const auth = request.header.authorization.replace("Bearer ", "")

    if (auth) {
        /* Decode the JWT to get information inside */
        const body = jsonwebtoken.verify(auth, process.env.TOKEN_SECRET)

        const query = {
            email: body.email
        }

        const user = await User.findOne(query)

        /* Check if the user exists, and if the session is valid */
        if (user) {
            if (user.sessions.includes(body.sessionId)) {
                /*
                 *
                 * Make note of this: in routes with this middleware, you can access
                 * the user's document by using request.user! Very convenient.
                 * 
                 */
                request.user = user

                next()
            } else {
                response.status(401).send("Authorization expired")
            }
        } else {
            response.status(401).send("Authorization invalid")
        }
    } else {
        response.status(401).send("Authorization required")
    }
}
