const jwt = require('jsonwebtoken');
const config = process.env;

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.status(403).send({ success: false, message: "A Tocken is Required for Authentucation" });
    }
    try {
        const decoded = jwt.verify(token, config.TOKEN_KEY);
        req.role = decoded.role;
        req.userId = decoded.user_id;
        req.fullName = decoded.fullName
        req.email = decoded.email
        // console.log("Role =" + req.role + ", UserId =" + req.userId)
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        })
    }
    return next();
}
module.exports = verifyToken;