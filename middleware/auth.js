const jwt = require('jsonwebtoken');
const account = require('../src/models/account/account');
const config = require('../public/config');
const auth = async (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    try {
        const data = jwt.verify(token, config.JWT_PUBLIC_KEY);
        await account.getOwnUser(token).then(value => {
            if (value instanceof Error) {
                throw new Error(value.message);
            }
            req.token = token;
            req.user = value[0];
            next();
        });
    } catch (error) {
        res.status(401).send({error: 'Not authorized to access this resource'});
    }

};
module.exports = auth;
