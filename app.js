if (process.env.NODE_ENV !== "production") { require("dotenv").config() }
let currentstudent=undefined
const express = require("express");
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejs = require('ejs');
const Lab = require("./models/lab")
const College = require("./models/college")
const Student = require("./models/student")
const Slot = require("./models/slot")
const flash = require('connect-flash')
const ejsMate = require('ejs-mate');
const session = require('express-session');
const passport = require("passport")
const localStrategy = require("passport-local")
const methodOverride = require('method-override');
const student = require("./models/student");
const secret = process.env.SECRET || "thisshouldbesecret"
app.engine('ejs', ejsMate)
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))

app.use(express.static(path.join(__dirname, "public")))
app.use(methodOverride("_method"))
app.use(flash())
const dbUrl = 'mongodb://localhost:27017/lab'

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind('console', "connection error:"))
db.once("open", () => {
    console.log("Database connected")
})
const sessionConfig = {
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        //secure:true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))

app.use(passport.initialize())
app.use(passport.session())
passport.use("College", new localStrategy(College.authenticate()))
passport.serializeUser(College.serializeUser())
passport.deserializeUser(College.deserializeUser())

app.use(passport.initialize())
app.use(passport.session())
passport.use("Student", new localStrategy(Student.authenticate()))
passport.serializeUser(Student.serializeUser())
passport.deserializeUser(Student.deserializeUser())


app.use((req, res, next) => {
    res.locals.currentUser = req.user
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    next()
}
)
app.get('/', (req, res) => {
    res.render("home");
})
//College Auth Start
app.get('/college/register', (req, res) => {
    res.render("college/register");
})
app.post('/college/register', async (req, res) => {
    try {
        const { username, collegename, password } = req.body
        const college = new College({ username, collegename })
        const registeredCollege = await College.register(college, password)
        
        res.send("registeredddd!!!")
    }
    catch (e) {
        res.send("not registeredddd")
    }
})
app.get('/college/login', (req, res) => {
    res.render("college/login");
})
app.post('/college/login', passport.authenticate('College', { failureFlash: true, failureRedirect: '/college/login' }), async (req, res) => {
    res.redirect("/lab")
})
app.get('/college/logout', (req, res) => {
    req.logOut();
    res.render("college/login");
})
//College Auth end

//Student Auth Start
app.get('/student/register', (req, res) => {
    res.render("student/register");
})
app.post('/student/register', async (req, res) => {
    try {
        const { username, email, password } = req.body
        const student = new Student({ username, email })
        const registeredStudent = await Student.register(student, password)
        res.send("registeredddd!!!")
    }
    catch (e) {
        res.send("not registeredddd")
    }
})
app.get('/student/login', (req, res) => {
    res.render("student/login");
})
app.post('/student/login', passport.authenticate('Student', { failureFlash: true, failureRedirect: '/student/login' }), async (req, res) => {
    currentstudent=req.user;
    res.redirect("/student")
})
app.get('/student/logout', (req, res) => {
    req.logOut();
    currentstudent=undefined
    res.render("student/login");
})
//Student Auth end
app.get('/student', async (req, res) => {
    const labs = await Lab.find({}).populate("college")
    res.render("lab/index", { labs });
})
app.post('/book', async (req, res) => {
    const foundstudent=await student.findById(currentstudent._id)
    foundstudent.booking.push(req.body.id)
    await foundstudent.save()
    res.redirect("/student/bookings")
 })
 app.get('/student/bookings', async (req, res) => {
     const student=await Student.findById(currentstudent._id).populate("booking")
     console.log(req.user);
     const bookings=student.booking
     console.log(student,bookings);
     res.render("booking",{bookings})
 })
//Here only that college labs are got
app.get('/lab', async (req, res) => {
    const labs = await Lab.find({ college: req.user._id }).populate("college");
    res.render("lab/index", { labs })
})

app.get('/lab/new', (req, res) => {
    res.render("lab/new");
})

app.post('/lab', async (req, res) => {

    const lab = new Lab(req.body.lab)
    const college = await College.findById(req.user._id)
    lab.college = college._id
    const today = new Date();
    let tempdate = new Date();
    for (let i = today.getDay() + 1; i <= 6; i++) {
        req.body.slots.map(async (e) => {
            const temp = new Slot(e);
            temp.start = e.start;
            temp.end = e.end;
            temp.lab = lab._id
            temp.date = String(tempdate.getDate()) + '-' + String(tempdate.getMonth()) + '-' + String(tempdate.getFullYear());
            lab.slots.push(temp._id)
            await temp.save()
        })
        tempdate = new Date(tempdate.getTime() + 1000 * 60 * 60 * 24)
    }
    college.labs.push(lab._id)
    await lab.save()
    await college.save()
    res.redirect("/lab")
})

app.get('/lab/:id', async (req, res) => {
    const lab = await Lab.findById(req.params.id).populate("slots");
    const college = await College.findById(lab.college)
    res.render("lab/show", { lab, college });
})
app.get('/lab/:id/edit', async (req, res) => {
    const lab = await Lab.findById(req.params.id);
    res.render("lab/edit", { lab });
})

app.put("/lab/:id", async (req, res) => {
    const { id } = req.params;
    const lab = await Lab.findByIdAndUpdate(id, {
        ...req.body.lab,
    });
    res.redirect(`/lab/${lab._id}`);
})

app.listen(3000, () => {
    console.log("Listening on port 3000");
})