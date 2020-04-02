const router = require("express").Router()
const verifyToken = require("../../middleware/verifyToken")

/* This route will only work if the user provides authorization via JWT. */
router.get("/whoami", verifyToken, async (request, response) => {
    /* 
     *
     * Notice how thanks to our verify token middleware, we can get information
     * about the logged in user by using request.user? You can use this for
     * permissions, creating documents and more. 
     *
     */
    response.json(request.user)
})

module.exports = router