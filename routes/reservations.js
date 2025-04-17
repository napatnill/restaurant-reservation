const express = require("express");
const { getReservations, getReservation, addReservation, updateReservation, deleteReservation } = require("../controllers/reservations");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router({mergeParams: true});

// re-route into other resource routers
const reviewRouter = require("./reviews");
router.use("/:reservationId/reviews", reviewRouter);

// ** Define routes explicitly **
router.get("/", protect, getReservations);
router.get("/:id",protect, getReservation);
router.post("/", protect, authorize("admin", "user"), addReservation);
router.put("/:id", protect, authorize("admin", "user"), updateReservation);
router.delete("/:id", protect, authorize("admin", "user"), deleteReservation);

// export router
module.exports = router;


// note: for mergeParams: true
// mergeParams: true tells Express:
// “Please allow this child router to access the params passed in from the parent router.”

// Parent router -> restaurantId
// Child  router -> reservation
// router.use("/:restaurantId/reservations", reservationRouter);