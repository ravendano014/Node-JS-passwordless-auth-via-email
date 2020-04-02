const router = require("express").Router()
const User = require("../../models/User")
const Joi = require("@hapi/joi")
const bcrypt = require("bcrypt")
const jsonwebtoken = require("jsonwebtoken")
const verifyToken = require("../../middleware/verifyToken")
const crypto = require("crypto")

/* Request an email code to sign in with (and print to console) */
router.post("/request_login", async (request, response) => {
    const schema = Joi.object({
        email: Joi.string().required().email()
    })

    const { error } = schema.validate(request.body)
    if (error) {
        return response.status(400).send(error.details[0].message)
    }

    /* Search for a matching user */
    const query = {
        email: request.body.email,
    }

    const user = await User.findOne(query)

    if (user) {
        /* Create a new code that expires in 1 hour */
        user.loginCode = crypto.randomBytes(32).toString("hex")
        user.loginCodeExpires = Date.now() + 3.6e6
        await user.save()

        // TODO: Send an email via Sendgrid or something containing the login code
        // E.g. https://frontend.com/login?loginCode=be09de8717203adb3dee9522fe6ea1b9
        console.log(`New login code for ${user.email}: ${user.loginCode}`)
    }

    response.send("Please check your email inbox and spam folder")
})

/* Sign in with an email and temporary code */
router.post("/login", async (request, response) => {
    const schema = Joi.object({
        email: Joi.string().required().email(),
        loginCode: Joi.string().required()
    })

    const { error } = schema.validate(request.body)
    if (error) {
        return response.status(400).send(error.details[0].message)
    }

    /* Check if the login code is a match and is not expired */
    const query = {
        email: request.body.email,
        loginCode: request.body.loginCode,
        loginCodeExpires: {
            $gte: Date.now()
        }
    }

    const user = await User.findOne(query)

    if (user) {
        /* Add a new valid session to the database */
        const sessionId = crypto.randomBytes(32).toString("hex")
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

        /* Invalidate the last login code */
        user.loginCode = null
        user.loginCodeExpires = Date.now()
        await user.save()

        /* Respond with JWT */
        response.json({
            token
        })
    } else {
        response.status(401).send("This login code is either expired or invalid")
    }
})

/* Create a new user with a unique email address  */
router.post("/signup", async (request, response) => {
    const schema = Joi.object({
        email: Joi.string().required().email(),
    })

    const { error } = schema.validate(request.body)
    if (error) {
        return response.status(400).send(error.details[0].message)
    }

    const newUser = new User({
        email: request.body.email,
    })

    /* Build indexes to ensure unique constraint is enforced */
    await User.init()

    try {
        /* Write to database */
        const user = await newUser.save()
        await user.save()

        response.send(`Success; Please sign in to confirm your account`)
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
