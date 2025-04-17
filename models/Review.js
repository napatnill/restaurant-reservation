const mongoose = require("mongoose");

const ReviewSchema = mongoose.Schema({
    reservation: {
        type: mongoose.Schema.ObjectId,
        ref: "Reservation",
        required: true,
        unique: true // ensures 1-to-1 relationship
    },
    restaurant: {
        type: mongoose.Schema.ObjectId,
        ref: "Restaurant",
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 300
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Review", ReviewSchema);