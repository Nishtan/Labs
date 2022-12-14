if (process.env.NODE_ENV !== "production") { require("dotenv").config() }
let currentstudent = undefined
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
const multer = require("multer")
const { storage } = require("./cloudinary")
const upload = multer({ storage })
const secret = process.env.SECRET || "thisshouldbesecret";
const checksum_lib = require("./paytm/checksum");
const config = require("./paytm/config");
const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });
// const {isLoggedIn} = require('./middleware')


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

var count;

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
app.get('/student/research', (req, res) => {
    res.render("college/research");
    
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

        res.redirect("/college/login")
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
        const { username, email, password, college, bio } = req.body
        const student = new Student({ username, email, college, bio })
        const registeredStudent = await Student.register(student, password)
        res.redirect("/student/login")
    }
    catch (e) {
        res.send("not registeredddd")
    }
})

app.get('/student/login', (req, res) => {
    res.render("student/login");
})

app.post('/student/login', passport.authenticate('Student', { failureFlash: true, failureRedirect: '/student/login' }), async (req, res) => {
    currentstudent = req.user;
    res.redirect("/student/dashboard")
})

app.get('/student/dashboard', (req, res) => {
    res.render("student/show", { currentstudent });
})

app.get('/student/logout', (req, res) => {
    req.logOut();
    currentstudent = undefined
    res.render("student/login");
})
//Student Auth end

app.get('/student', async (req, res) => {
    const labs = await Lab.find({}).populate("college")
    res.render("lab/index", { labs });
})

app.get('/gateway', async (req, res) => {
    res.render("payment",{currentstudent});
})
app.post('/book', async (req, res) => {
    const foundstudent = await student.findById(currentstudent._id)
    foundstudent.booking.push(req.body.id)
    const bookedSlot = await Slot.findById(req.body.id)
    bookedSlot.students.push(currentstudent._id)
    // await bookedSlot.save()
    // await foundstudent.save()
    res.redirect("/gateway")
})
app.post("/paynow", [parseUrl, parseJson], (req, res) => {
    // Route for making payment

    var paymentDetails = {
        amount: req.body.amount,
        customerId: req.body.name,
        customerEmail: req.body.email,
        customerPhone: req.body.phone
    }
    if (!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
        res.status(400).send('Payment failed')
    } else {
        var params = {};
        params['MID'] = config.PaytmConfig.mid;
        params['WEBSITE'] = config.PaytmConfig.website;
        params['CHANNEL_ID'] = 'WEB';
        params['INDUSTRY_TYPE_ID'] = 'Retail';
        params['ORDER_ID'] = 'TEST_' + new Date().getTime();
        params['CUST_ID'] = paymentDetails.customerId;
        params['TXN_AMOUNT'] = paymentDetails.amount;
        params['CALLBACK_URL'] = 'http://localhost:3000/callback';
        params['EMAIL'] = paymentDetails.customerEmail;
        params['MOBILE_NO'] = paymentDetails.customerPhone;


        checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
            var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
            // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

            var form_fields = "";
            for (var x in params) {
                form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
            }
            form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
            res.end();
        });
    }
});
app.post("/callback", (req, res) => {
    // Route for verifiying payment

    var body = '';

    req.on('data', function (data) {
        body += data;
    });

    req.on('end', function () {
        var html = "";
        var post_data = qs.parse(body);

        // received params in callback
        console.log('Callback Response: ', post_data, "\n");


        // verify the checksum
        var checksumhash = post_data.CHECKSUMHASH;
        // delete post_data.CHECKSUMHASH;
        var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);
        console.log("Checksum Result => ", result, "\n");


        // Send Server-to-Server request to verify Order Status
        var params = { "MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID };

        checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {

            params.CHECKSUMHASH = checksum;
            post_data = 'JsonData=' + JSON.stringify(params);

            var options = {
                hostname: 'securegw-stage.paytm.in', // for staging
                // hostname: 'securegw.paytm.in', // for production
                port: 443,
                path: '/merchant-status/getTxnStatus',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': post_data.length
                }
            };


            // Set up the request
            var response = "";
            var post_req = https.request(options, function (post_res) {
                post_res.on('data', function (chunk) {
                    response += chunk;
                });

                post_res.on('end', function () {
                    console.log('S2S Response: ', response, "\n");

                    var _result = JSON.parse(response);
                    if (_result.STATUS == 'TXN_SUCCESS') {
                        res.send('payment sucess')
                    } else {
                        res.send('payment failed')
                    }
                });
            });

            // post the data
            post_req.write(post_data);
            post_req.end();
        });
    });
});

app.get('/student/bookings', async (req, res) => {
    const student = await Student.findById(currentstudent._id).populate("booking")
    const bookings = student.booking
    res.render("booking", { bookings })
})

//Here only that college labs are got
app.get('/lab', async (req, res) => {
    const labs = await Lab.find({ college: req.user._id }).populate("college");
    res.render("college/collegeshow", { labs })
})

app.get('/lab/new', (req, res) => {
    res.render("lab/new");
})

app.post('/lab', upload.single('images'), async (req, res) => {
    const lab = new Lab(req.body.lab)
    count = req.body.lab.capacity;
    const college = await College.findById(req.user._id)
    lab.college = college._id
    const today = new Date();
    let tempdate = new Date();
    for (let i = today.getDay(); i <= 6; i++) {
        req.body.slots.map(async (e) => {
            const temp = new Slot(e);
            temp.start = e.start;
            temp.end = e.end;
            temp.lab = lab._id
            temp.date = String(tempdate.getDate()) + '-' + String(tempdate.getMonth()) + '-' + String(tempdate.getFullYear());
            lab.slots.push(temp._id);
            await temp.save();
        })
        tempdate = new Date(tempdate.getTime() + 1000 * 60 * 60 * 24)
    }
    lab.url = req.file.path
    college.labs.push(lab);
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