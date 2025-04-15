const express = require("express");
const { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant } = require("../controllers/restaurants");
const { protect, authorize } = require("../middleware/auth");
const reservationRouter = require("./reservations");

const router = express.Router();

// re-route into other resource routers
router.use("/:restaurantId/reservations/", reservationRouter);

// ** Define routes explicitly **
router.get("/", getRestaurants);
router.get("/:id", getRestaurant);
router.post("/", protect, authorize("admin"), createRestaurant);
router.put("/:id", protect, authorize("admin"), updateRestaurant);
router.delete("/:id", protect, authorize("admin"), deleteRestaurant);

// export router
module.exports = router;