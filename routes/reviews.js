const express = require("express");
const { getReviews, getReview, addReview, updateReview, deleteReview } = require("../controllers/reviews");
const { protect, authorize } = require("../middleware/auth");

// supports nested routes /restaurants/:restaurantId/reviews
const router = express.Router({ mergeParams: true }); 

router.get("/", protect, getReviews);
router.get("/:id", protect, getReview);
router.post("/", protect, authorize("admin", "user"), addReview);
router.put("/:id", protect, authorize("admin", "user"), updateReview);
router.delete("/:id", protect, authorize("admin", "user"), deleteReview);

module.exports = router;
