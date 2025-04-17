const Review = require("../models/Review");
const Reservation = require("../models/Reservation");

// @desc    Get all reviews
// @route   GET /api/v1/reviews
// @access  Private
exports.getReviews = async (req, res) => {
    try {
        let reviews;

        if (req.user.role === "admin") {
            // Admin can view all reviews
            // note: Can use Review.find().populate because Review model has real fields for restaurant and reservation
            reviews = await Review.find()
                .populate("restaurant", "name")
                .populate("reservation", "reservationDate user");
        } else {
            // Registered user can view their reviews from their reservations
            const userReservations = await Reservation.find({ user: req.user.id }).select("_id");

            const reservationIds = userReservations.map(reservation => reservation._id);

            reviews = await Review.find({ reservation: { $in: reservationIds } })
                .populate("restaurant", "name")
                .populate("reservation", "reservationDate");
        }

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Cannot find Reviews" });
    }
};


// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Private
exports.getReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate("restaurant", "name")
            .populate({
                path: "reservation",
                select: "reservationDate user"
            });

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Check access: user must be owner or admin
        const reservationUserId = review.reservation.user.toString();

        if (reservationUserId !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorized to view this review" });
        }

        res.status(200).json({ success: true, data: review });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Cannot find Review" });
    }
};


// @desc    Get all reviews for a specific restaurant
// @route   GET /api/v1/restaurants/:restaurantId/reviews
// @access  Public
exports.getReviewsByRestaurant = async (req, res) => {
    try {
        const restaurantId = req.params.restaurantId;

        const reviews = await Review.find({ restaurant: restaurantId })
            .populate("reservation", "reservationDate")
            .populate("restaurant", "name");

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Cannot find Reviews" });
    }
};

// @desc    Add a review for a reservation
// @route   POST /api/v1/reservations/:reservationId/reviews
// @access  Private
exports.addReview = async (req, res) => {
    const { rating, comment } = req.body;
    const reservationId = req.params.reservationId;

    try {
        const reservation = await Reservation.findById(reservationId).populate("restaurant");

        if (!reservation) {
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }

        // Only reservation owner or admin can create review
        if (reservation.user.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "You can only review your own reservation" });
        }

        // Can only review after reservation date
        if (new Date() < reservation.reservationDate) {
            return res.status(400).json({ success: false, message: "You can only review after your reservation date has passed" });
        }

        // Check if already reviewed
        if (reservation.isReviewed) {
            return res.status(400).json({ success: false, message: "Review already exists for this reservation" });
        }

        const review = await Review.create({
            reservation: reservation._id,
            restaurant: reservation.restaurant._id,
            rating,
            comment
        });

        // Update reservation to mark it as reviewed
        reservation.isReviewed = true;
        await reservation.save();

        res.status(201).json({ success: true, data: review });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Cannot create Review" });
    }
};


// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
    try {
        let review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        const reservation = await Reservation.findById(review.reservation);
        if (!reservation) {
            return res.status(404).json({ success: false, message: "Associated reservation not found" });
        }

        // Only owner or admin can update
        if (reservation.user.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorized to update this review" });
        }

        review = await Review.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: review });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Cannot update Review" });
    }
};

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        const reservation = await Reservation.findById(review.reservation);
        if (!reservation) {
            return res.status(404).json({ success: false, message: "Associated reservation not found" });
        }

        // Only owner or admin can delete
        if (reservation.user.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorized to delete this review" });
        }

        // Delete the review
        await review.deleteOne();

        // Reset reservation's isReviewed flag
        reservation.isReviewed = false;
        await reservation.save();

        res.status(200).json({ success: true, message: "Review removed" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Cannot delete Review" });
    }
};
