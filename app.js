if (process.env.NODE_ENV !== "production") { require("dotenv").config() }
const express = require("express");
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejs = require('ejs');
const flash = require('connect-flash')
const ejsMate = require('ejs-mate');
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.engine('ejs', ejsMate)
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))
const dbUrl ='mongodb://localhost:27017/your-volunteer'

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind('console', "connection error:"))
db.once("open", () => {
    console.log("Database connected")
})
app.get('/', (req, res) => {
    res.render("test");
})

app.listen(3000, () => {
    console.log("Listening on port 3000");
})