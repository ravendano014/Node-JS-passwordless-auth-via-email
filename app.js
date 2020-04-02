const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const cors = require("cors")

/* Dependencies */
const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

/* Database */
mongoose.connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useCreateIndex', true)
mongoose.set("useFindAndModify", false)

/* Routes */
app.use("/api/auth/", require("./routes/auth/signup"))
app.use("/api/auth/", require("./routes/auth/login"))
app.use("/api/auth/", require("./routes/auth/whoami"))
app.use("/api/auth/", require("./routes/auth/signout"))
app.use("/api/auth/", require("./routes/auth/email"))
app.use("/api/auth/", require("./routes/auth/password"))

/* Port */
const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Running on ${port}`))