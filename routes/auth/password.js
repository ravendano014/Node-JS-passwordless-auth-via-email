const router = require("express").Router()
const Joi = require("@hapi/joi")
const bcrypt = require("bcrypt")
const verifyToken = require("../../middleware/verifyToken")
const User = require("../../models/User")
const crypto = require("crypto")

/* Allow the signed in user to change their old password */
router.post("/change_password", verifyToken, async (request, response) => {
    const schema = Joi.object({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required()
    })

    const { error } = schema.validate(request.body)
    if (error) {
        return response.status(400).send(error.details[0].message)
    }

    /* Make sure old passord is correct */
    const isPasswordCorrect = await bcrypt.compare(request.body.oldPassword, request.user.password)
    if (!isPasswordCorrect) {
        return response.status(400).send("Old password is not correct")
    }

    /* Store password securely with salt and hash */
    const salt = await bcrypt.genSalt(10)
    const hashedNewPassword = await bcrypt.hash(request.body.newPassword, salt)

    /* Update password in database */
    request.user.password = hashedNewPassword
    await request.user.save()

    response.send("Updated your password")
})

/* Request a password reset email and make a reset password token */
router.post("/forgot_password", async (request, response) => {
    const schema = Joi.object({
        email: Joi.string().required().email()
    })

    const { error } = schema.validate(request.body)
    if (error) {
        return response.status(400).send(error.details[0].message)
    }

    const query = {
        email: request.body.email
    }

    const user = await User.findOne(query)

    if (user) {
        /* Create a password reset token that expires in 6 hours */
        user.resetPasswordToken = crypto.randomBytes(32).toString("hex")
        user.resetPasswordTokenExpires = Date.now() + 2.16e7
        await user.save()

        // TODO: Send an email via Sendgrid or something containing the token
        // e.g. https://frontend.com/reset_password?token=be09de8717203adb3dee9522fe6ea1b9
        console.log(`New reset token for ${user.email}: ${user.resetPasswordToken}`)

        response.send("Please check your email inbox and spam folder")
    } else {
        response.send("Please check your email inbox and spam folder")
    }
})

/* Reset a password using */
router.post("/reset_password", async (request, response) => {
    const schema = Joi.object({
        resetPasswordToken: Joi.string().required(),
        newPassword: Joi.string().required()
    })

    const { error } = schema.validate(request.body)
    if (error) {
        return response.status(400).send(error.details[0].message)
    }

    /* Search for a user with a matching reset token that isn't expired */
    const query = {
        resetPasswordToken: request.body.resetPasswordToken,
        resetPasswordTokenExpires: {
            $gte: Date.now()
        }
    }

    const user = await User.findOne(query)

    if (user) {
        /* Once again store password securely */
        const salt = await bcrypt.genSalt(10)
        const hashedNewPassword = await bcrypt.hash(request.body.newPassword, salt)

        /* Save to database */
        user.password = hashedNewPassword
        await user.save()

        /* Now reset the token and expiration */
        user.resetPasswordToken = null
        user.resetPasswordTokenExpires = Date.now()
        await user.save()

        response.send(`Password for ${user.email} successfully reset`)
    } else {
        response.status(400).send("This password reset link is either expired or invalid")
    }
})

module.exports = router