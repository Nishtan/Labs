const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ImageSchema = new Schema({
    url: String,
    filename: String
})
const LabSchema = new Schema({
    name: String,
    photos: [ImageSchema],
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