const Restaurant = require("../models/Restaurant");
const Reservation = require("../models/Reservation");
const Review = require("../models/Review");

// @desc    Get all restaurants
// @route   GET /api/v1/restaurants
// @access  public
exports.getRestaurants = async (req, res, next) => {

    let reqQuery = {...req.query };

    // Fields to exclude
    const removeFields = ["select", "sort", "page", "limit"];
    removeFields.forEach( param => delete reqQuery[param] );

    // Transform query operators (gt, gte, lt, etc.)
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    reqQuery = JSON.parse(queryStr);

    // Apply $regex for partial search on specific fields
    const textFields = ["name", "address", "district", "province"];
    textFields.forEach(field => {
        if (reqQuery[field] && typeof reqQuery[field] === "string") {
            reqQuery[field] = { $regex: reqQuery[field], $options: "i" };
        }
    });

    // Build query
    query = Restaurant.find(reqQuery).populate("reservations");

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(",").join(" ");
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
    }
    
    // else {
    //     query = query.sort("-createdAt");
    // }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // connecting database should be in try catch
    try {
        const total = await Restaurant.countDocuments();

        query = query.skip(startIndex).limit(limit);

        // Executing query
        const restaurants = await query;
        console.log(req.query);

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page+1, limit};
        }

        if (startIndex > 0) {
            pagination.prev = { page: page-1, limit};
        }

        res.status(200).json({
            success: true,
            count: restaurants.length,
            pagination,
            data: restaurants
        })
    } catch(err) {
        res.status(400).json({success: false});
    }
}


// @desc    Get single restaurant
// @route   GET /api/v1/restaurants/:id
// @access  public
exports.getRestaurant = async (req, res, next) => {

    try {
        const restaurant = await Restaurant.findById(req.params.id); // _id in mongodb (if not found with given id, it will return null)

        if (!restaurant) {
            return res.status(400).json({success:false});
        }

        res.status(200).json({
            success: true,
            data: restaurant
        })
    } catch (err) {
        res.status(400).json({success:false});
    }
}


// @desc    Create new restaurant
// @route   POST /api/v1/restaurants
// @access  private
exports.createRestaurant = async (req, res, next) => {

    const restaurant = await Restaurant.create(req.body);
    res.status(201).json({
        success: true,
        data: restaurant
    });
}


// @desc    Update restaurant
// @route   PUT /api/v1/restaurants/:id
// @access  private
exports.updateRestaurant = async (req, res, next) => {
    
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});

        if (!restaurant) {
            return res.status(400).json({success: false});
        }

        res.status(200).json({
            success: true,
            data: restaurant
        });
    } catch (err) {
        res.status(400).json({success: false});
    }
}


// @desc    Delete restaurant
// @route   DELETE /api/v1/restaurants/:id
// @access  private
exports.deleteRestaurant = async (req, res, next) => {

    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if(!restaurant) {
            return res.status(404).json({success: false, message: `Restaurant not found with id of ${req.params.id}`});
        }

        await Review.deleteMany({restaurant: req.params.id});
        await Reservation.deleteMany({restaurant: req.params.id});
        await Restaurant.deleteOne({_id: req.params.id});
        
        res.status(200).json({success: true, data: {}})
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
}