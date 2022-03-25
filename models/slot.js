const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const slotSchema = new Schema({
    date: String,
    start: String,
    end: String,
    lab: {
        type: Schema.Types.ObjectId,
        ref: "lab"
    },
    students: [
        {
            type: Schema.Types.ObjectId,
            ref: "student"
        }
    ]
})

module.exports = mongoose.model("slot", slotSchema);