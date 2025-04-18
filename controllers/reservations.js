const Reservation = require("../models/Reservation");
const Restaurant = require("../models/Restaurant");
const Review = require("../models/Review");
const moment = require("moment-timezone");

// @desc    Get all reservations
// @route   GET /api/v1/reservations
// @access  private
exports.getReservations = async (req, res, next) => {
    let query;

    const restaurantPopulate = {
        path: "restaurant",
        select: "name address province tel openTime closeTime"
    };

    const reviewPopulate = {
        path: "review",
        select: "rating comment createdAt"
    };

    // general users can see only their reservations!
    if (req.user.role !== "admin") {
        query = Reservation.find({user: req.user.id})
            .populate(restaurantPopulate)
            .populate(reviewPopulate);
    } else { // if you are an admin, you can see all reservations!
        if (req.params.restaurantId) {
            console.log(req.params.restaurantId);
            query = Reservation.find({restaurant: req.params.restaurantId})
                .populate(restaurantPopulate)
                .populate(reviewPopulate);
        } else {
            query = Reservation.find()
                .populate(restaurantPopulate)
                .populate(reviewPopulate);
        }
    }

    try {
        const reservations = await query;

        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Can not find Reservation"});
    }
}

// @desc    Get single reservation
// @route   GET /api/v1/reservations/:id
// @access  private
exports.getReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate({
                path: "restaurant",
                select: "name address province tel openTime closeTime"
            })
            .populate({
                path: "review",
                select: "rating comment createdAt"
            });    

        if (!reservation) {
            return res.status(404).json({success: false, message: `No reservation with the id of ${req.params.id}`});
        }

        // only reservation owner or admin can view specific reservation
        if (reservation.user.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "You are not authorized to view this reservation" });
        }

        res.status(200).json({success: true, data: reservation});
    } catch(error) {
        console.log(error.message);
        return res.status(500).json({success: false, message: "Cannot find Reservation"});
    }
}

// @desc    Add reservation
// @route   POST /api/v1/restaurants/:restaurantId/reservations
// @access  private
exports.addReservation = async (req, res, next) => {
    try {
        // add restaurantId to req.body.restaurant
        req.body.restaurant = req.params.restaurantId;

        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({success: false, message: `No restaurant with the id of ${req.params.restaurantId}`});
        }

        // add user id to req.body.user
        req.body.user = req.user.id;

        // check for existed reservation
        const existedReservation = await Reservation.find({user: req.user.id});

        // if the user is not an admin, they can only create 3 reservations (3 tables).
        if (existedReservation.length >= 3 && req.user.role !== "admin") {
            return res.status(400).json({success: false, message: `The user with ID ${req.user.id} has already made 3 reservations (3 tables)`})
        }

        // Validate that reservationDate is within restaurant open-close time
        const reservationDateUtc = new Date(req.body.reservationDate);
        const reservationDateThai = moment(reservationDateUtc).tz("Asia/Bangkok");

        // Extract reservation time as HH:mm
        const reservationTime = reservationDateThai.format("HH:mm");
        
        const openTime = restaurant.openTime;
        const closeTime = restaurant.closeTime;

        // Time range check
        let isInTimeRange = false; // Normal range: e.g., 10:00 to 22:00

        if (openTime < closeTime) {
            isInTimeRange = (reservationTime >= openTime) && (reservationTime < closeTime);
        } else {
            // Overnight range: e.g., 20:00 to 02:00 (openTime > closeTime)
            isInTimeRange = (reservationTime >= openTime) || (reservationTime < closeTime);
        }

        if (!isInTimeRange) {
            return res.status(400).json({
                success: false,
                message: `Reservation time (${reservationTime}) must be within restaurant opening hours (${openTime} - ${closeTime})`
            });
        }

        // Proceed to create
        const reservation = await Reservation.create(req.body);
        res.status(201).json({success: true, data: reservation});
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success: false, message: "Cannot create Reservation"});
    }
}

// @desc    Update reservation
// @route   PUT /api/v1/reservations/:id
// @access  private
exports.updateReservation = async (req, res, next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({success: false, message: `No reservation with the id of ${req.params.id}`});
        }

        // make sure user is the reservation owner
        if (reservation.user.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to update this reservation`})
        }

        // Only validate reservationDate if it’s provided in update payload
        if (req.body.reservationDate) {
            const reservationDateUtc = new Date(req.body.reservationDate);
            const reservationDateThai = moment(reservationDateUtc).tz("Asia/Bangkok");

            // Load restaurant info for time range validation
            const restaurantId = req.body.restaurant || reservation.restaurant;
            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) {
                return res.status(404).json({
                    success: false,
                    message: `No restaurant with the id of ${restaurantId}`
                });
            }

            const reservationTime = reservationDateThai.format("HH:mm");
            const openTime = restaurant.openTime;
            const closeTime = restaurant.closeTime;

            let isInTimeRange = false;
            if (openTime < closeTime) {
                isInTimeRange = reservationTime >= openTime && reservationTime < closeTime;
            } else {
                isInTimeRange = reservationTime >= openTime || reservationTime < closeTime;
            }

            if (!isInTimeRange) {
                return res.status(400).json({
                    success: false,
                    message: `Reservation time (${reservationTime}) must be within restaurant opening hours (${openTime} - ${closeTime})`
                });
            }
        }

        // Proceed to update
        reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
        res.status(200).json({success: true, data: reservation});
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success: false, message: "Cannot update Reservation"});
    }
}

// @desc    Delete reservation
// @route   DELETE /api/v1/reservations/:id
// @access  private
exports.deleteReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({success: false, message: `No reservation with the id of ${req.params.id}`});
        }

        // make sure user is the reservation owner
        if (reservation.user.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to upadte this reservation`})
        }

        await Review.deleteOne({reservation: req.params.id});
        await reservation.deleteOne();
        res.status(200).json({success: true, data: {}});
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success: false, message: "Cannot delete Reservation"});
    }
}