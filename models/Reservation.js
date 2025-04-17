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
    isReviewed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// For populate associated review from the reservation.
// For ex. -> const reservation = await Reservation.findById(id).populate("review");
ReservationSchema.virtual("review", {
    ref: "Review",
    localField: "_id",
    foreignField: "reservation",
    justOne: true // this makes it 1-to-1
});

module.exports = mongoose.model("Reservation", ReservationSchema);