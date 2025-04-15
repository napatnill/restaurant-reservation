const mongoose = require("mongoose");

const ReservationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    restaurant: {
        type: mongoose.Schema.ObjectId,
        ref: "Restaurant",
        required: true
    },
    reservationDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Reservation", ReservationSchema);