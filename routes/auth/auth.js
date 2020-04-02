const router = require("express").Router()
const User = require("../../models/User")
const Joi = require("@hapi/joi")
const bcrypt = require("bcrypt")
const jsonwebtoken = require("jsonwebtoken")
const verifyToken = require("../../middleware/verifyToken")

/* Sign in with an email and password, receive a JWT */
router.post("/login", async (request, response) => {
    const schema = Joi.object({
        email: Joi.string().required().email(),
        password: Joi.string().required()
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
            /* Add a new valid session to the database */
            const sessionId = crypto.randomBytes(32).toString()
            user.sessions.push(sessionId)
            await user.save()

            /*
             *
             * Sign the JWT with the user's email address and session ID.
             * The session ID will allow us to revoke JWTs later on.
             * By default, the JWT also has an "iat" field.
             *
             */
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

/* Create a new user with a unique email and a password */
router.post("/signup", async (request, response) => {
    const schema = Joi.object({
        email: Joi.string().required().email(),
        password: Joi.string().required()
    })

    const { error } = schema.validate(request.body)
    if (error) {
        return response.status(400).send(error.details[0].message)
    }

    /* Store password securely with salt and hash */
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(request.body.password, salt)

    const newUser = new User({
        email: request.body.email,
        password: hashedPassword
    })

    /* Build indexes to ensure unique constraint is enforced */
    await User.init()

    try {
        /* Write to database */
        const user = await newUser.save()
        await user.save()

        response.send(`Signed up as ${user.email}`)
    } catch (e) {
        response.status(400).send(`Could not sign up as ${request.body.email}`)
    }
})

/* Expire all sessions including the current one (must be signed in) */
router.post("/signout", verifyToken, async (request, response) => {
    request.user.sessions = []
    await request.user.save()

    response.send("Signed out from all sessions")
})

module.exports = router
