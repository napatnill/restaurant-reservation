const User = require("../models/User");

//@desc     Register user
//@route    POST /api/v1/auth/register
//@access   Public
exports.register = async (req, res, next) => { // function's name: register
    try {
        const { name, email, tel, password, role } = req.body; // get value of request's body

        // Create user
        const user = await User.create({
            name,
            email,
            tel,
            password,
            role
        });

        // Create token
        // const token = user.getSignedJwtToken();

        // return res.status(200).json({success: true, token: token});
        sendTokenResponse(user, 200, res);
        
    } catch (error) {
        console.log(error.stack);
        return res.status(400).json({success: false});
        
    }
}

//@desc     Login user
//@route    POST /api/v1/auth/login
//@access   Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({success: false, message: "Please provide an email and password"});
        }
    
        // Check for user
        const user = await User.findOne({email: email}).select("+password");
        if (!user) {
            return res.status(400).json({success: false, message: "Invalid credentials"});
        }
    
        // Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({success: false, message: "Invalid credentials"});
        }
    
        // Create token
        // const token = user.getSignedJwtToken();
        
        // return res.status(200).json({success: true, token: token});
        sendTokenResponse(user, 200, res);
        
    } catch (err) {
        return res.status(401).json({success: false, msg: "Cannot convert email or password to string"})
    }
}

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
  
    res.status(200).json({
      success: true,
      data: {},
    });
}


// Get token from model, create cookie and send respond
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === "production") {
        options.secure = true;
    }

    return res.status(statusCode).cookie("token", token, options).json({
        success: true,
        token: token
    });
}


//@desc     Get current Logged in user
//@route    GET /api/v1/auth/login
//@access   Private
exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    
    return res.status(200).json({success: true, data: user});
}


//@desc     Update current logged-in user's profile (name, tel, email, password)
//@route    PUT /api/v1/auth/me
//@access   Private
exports.updateMe = async (req, res) => {
    const fieldsToUpdate = {};

    // check field that has to update and put the updated value from req.body to object "fieldsToUpdate"
    const allowedFields = ["name", "tel", "email", "password"];
    for (const field of allowedFields) {
        if (req.body[field]) {
            fieldsToUpdate[field] = req.body[field];
        }
    }

    try {
        // If password is being updated, hash it manually before update
        if (fieldsToUpdate.password) {
            const bcrypt = require("bcryptjs");
            const salt = await bcrypt.genSalt(10);
            fieldsToUpdate.password = await bcrypt.hash(fieldsToUpdate.password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Cannot update user profile" });
    }
};
