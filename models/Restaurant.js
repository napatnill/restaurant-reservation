const mongoose = require("mongoose");

const RestaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a name"],
        unique: true,
        trim: true,
        maxlength: [50, "Name can not be more than 50 characters"]
    },
    address: {
        type: String,
        required: [true, "Please add an address"],
        trim: true
    },
    district: {
        type: String,
        required: [true, "Please add a district"],
        trim: true
    },
    province: {
        type: String,
        required: [true, "Please add a province"],
        trim: true
    },
    postalCode: {
        type: String,
        trim: true,
        required: [true, "Please add a postalcode"],
        match: [/^\d{5}$/, "Please use a valid 5-digit postal code"]
    },
    tel: {
        type: String,
        required: [true, "Please add a telephone number"],
        trim: true
    },
    openTime: {
        type: String,
        required: [true, "Please add opening time"],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Please use a valid time in HH:mm format"]
    },
    closeTime: {
        type: String,
        required: [true, "Please add closing time"],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Please use a valid time in HH:mm format"]
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Reverse populate with virtuals
RestaurantSchema.virtual("reservations", {
    ref: "Reservation",
    localField: "_id",
    foreignField: "restaurant",
    justOne: false
})

module.exports = mongoose.model("Restaurant", RestaurantSchema);