const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LabSchema = new Schema({
    name: String,
    url:String,
     college: {
         type: Schema.Types.ObjectId,
         ref: "college"
     },
     slots: [{
        type: Schema.Types.ObjectId,
        ref: "slot"
    }],
    department: String,
    capacity: Number
})
module.exports = mongoose.model("lab", LabSchema);