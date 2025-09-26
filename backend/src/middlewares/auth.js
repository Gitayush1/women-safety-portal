const jwt = require("jsonwebtoken");
const User = require("../models/Police");

const userAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).send("Please Login!");
        }
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decode._id).lean(); 

        if (!user) {
            throw new Error("User not found");
        }

        req.user = user; 
        next();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = { userAuth };
