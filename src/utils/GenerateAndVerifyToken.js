const jwt = require('jsonwebtoken');
const verifyToken = ({ token , signature = process.env.JWT_SECRET_KEY } = {}) => {
    const decoded = jwt.verify(token, signature);
    return decoded
}

module.exports = verifyToken;