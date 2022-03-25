const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose")
const studentSchema = new Schema({
    email: {
        type: String,
        unique: true
    },
    college: {
        type: String,
    },
    bio: {
        type: String,
    },
    booking:[{
        type:Schema.Types.ObjectId,
        ref:"slot"
    }],

})
studentSchema.plugin(passportLocalMongoose)
module.exports = mongoose.model("student", studentSchema);