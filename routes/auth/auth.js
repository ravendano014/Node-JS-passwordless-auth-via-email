const router = require("express").Router()
const User = require("../../models/User")
const Joi = require("@hapi/joi")
const bcrypt = require("bcrypt")
const jsonwebtoken = require("jsonwebtoken")

/* Sign in with an email and password, receive a JWT */
router.post("/login", async (request, response) => {
    const schema = Joi.object({
        email: joiHelper.email,
        password: joiHelper.password
    })

    const { error } = schema.validate(request.body)
    if (error) {
        return response.status(400).send(error.details[0].message)
    }

    /* Search for a user */
    const query = {
        email: request.body.email
    }

    const user = await User.findOne(query)

    if (user) {
        /* Compare passwords via bcrypt */
        const isPasswordCorrect = await bcrypt.compare(request.body.password, user.password)

        if (isPasswordCorrect) {
            /* Add a session */
            const sessionId = stringHelper.secureRandomString()
            user.sessions.push(sessionId)
            await user.save()

            /* Sign the JWT with email and session */
            const token = jsonwebtoken.sign({
                email: user.email,
                sessionId
            }, process.env.TOKEN_SECRET)

            /* Respond with JWT */
            response.json(token)
        } else {
            response.status(401).send("Wrong email address or password")
        }
    } else {
        response.status(401).send("Wrong email address or password")
    }
})


module.exports = router
