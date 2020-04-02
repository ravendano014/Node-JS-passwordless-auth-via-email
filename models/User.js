const mongoose = require("mongoose")

const schema = new mongoose.Schema({
    /* Credentials */
    email: {
        type: String,
        required: true,
        unique: true
    },

    loginCode: {
        type: String,
        default: null
    },

    loginCodeExpires: {
        type: Date,
        required: true,
        default: Date.now
    },

    /* For expiring JWTs */
    sessions: {
        type: Array,
        required: true,
        default: []
    },
})

module.exports = mongoose.model("User", schema)
