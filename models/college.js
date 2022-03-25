const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose")
const CollegeSchema = new Schema({
    collegename: String,
    address: String,
    city: String,
    labs:[
        {
            type:Schema.Types.ObjectId,
            ref:'lab'
        }
    ]
});
CollegeSchema.plugin(passportLocalMongoose)
module.exports = mongoose.model("college", CollegeSchema);