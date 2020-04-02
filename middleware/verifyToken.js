const jsonwebtoken = require("jsonwebtoken")
const User = require("../models/User")

/* Make sure that the JWT's user exists and session is not expired */
module.exports = async function (request, response, next) {
    let auth = request.headers.authorization

    if (auth) {
        auth = auth.replace("Bearer ", "")

        /* Decode the JWT to get information inside */
        const body = jsonwebtoken.verify(auth, process.env.TOKEN_SECRET)

        console.log(body)

        const query = {
            email: body.email
        }

        const user = await User.findOne(query)

        /* Check if the user exists, and if the session is not expired */
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
            response.status(401).send("Authorization does not exist")
        }
    } else {
        response.status(401).send("Authorization required")
    }
}
