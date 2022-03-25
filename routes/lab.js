const express = require('express');
const router = express.Router();
const Lab = require("../models/lab");
const College = require("../models/college")
const catchAsync = require('../utils/catchAsync');
const Slot = require("../models/slot")

router.get('/', catchAsync(async (req, res) => {
    const labs = await Lab.find({ college: req.user._id }).populate("college");
    res.render("lab/index", { labs })
}))

router.get('/new', (req, res) => {
    res.render("lab/new");
})

router.post('/',catchAsync(async (req, res) => {
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
    console.log(req.body)
    res.redirect("/lab")
}))

router.get('/:id', catchAsync(async (req, res) => {
    const lab = await Lab.findById(req.params.id).populate("slots");
    const college = await College.findById(lab.college)
    res.render("lab/show", { lab, college });
}))

router.get('/:id/edit', catchAsync(async (req, res) => {
    const lab = await Lab.findById(req.params.id);
    res.render("lab/edit", { lab });
}))

router.put("/:id", catchAsync(async (req, res) => {
    const { id } = req.params;
    const lab = await Lab.findByIdAndUpdate(id, {
        ...req.body.lab,
    });
    res.redirect(`/lab/${lab._id}`);
}))

module.exports = router;