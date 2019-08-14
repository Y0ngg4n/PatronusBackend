const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db/cockroach/db');
const config = require('../../../public/config');

const generateAuthToken = async (email) => {
    // Generate an auth token for the user
    return jwt.sign({email: email}, config.JWT_PUBLIC_KEY);
};

const login = async (email, password, token) => {
    // Search for a user by email and password.
    return await new Promise((resolve) => {
        try {
            db.getAccountByEmail(email).then(function (value) {
                const account = value[0];
                if (!account) {
                    resolve(new Error("Invalid login credentials"));
                } else {
                    bcrypt.compare(password, account.password).then(result => {
                        db.updateTokenByEmail(email, token).then(updateResult => {
                            if (updateResult instanceof Error) {
                                resolve(updateResult)
                            }else{
                                resolve(account);
                            }
                        });
                    }, error => {
                        resolve(new Error("Invalid login credentials"));
                    });
                }
            });
        } catch (error) {
            resolve(error);
        }
    });
};

const register = async (email, password, nickname, token) => {
    return new Promise(((resolve) => {
        try {
            bcrypt.hash(password, 10, async (error, hashed) => {
                if (error) {
                    throw error;
                } else {
                    await db.registerNewAccount(email, hashed, nickname, token).then(value => {
                        if (value instanceof Error) {
                            resolve(value);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        } catch (error) {
            return resolve(error);
        }
    }));
};

const getOwnUser = async (token) => {
    return new Promise(((resolve) => {
        try {
            db.getAccountByToken(token).then(value => {
                if (value.length > 0) {
                    resolve(value);
                } else {
                    resolve(new Error("You are not allowed to do this!"));
                }
            });
        } catch (error) {
            return resolve(error);
        }
    }));
};

const logout = async (email) => {
    return new Promise(((resolve => {
        try {
            db.updateTokenByEmail(email, null).then(updateResult => {
                if (updateResult instanceof Error) {
                    resolve(updateResult)
                }else{
                    console.log(updateResult);
                    resolve();
                }
            });
        }catch (error) {
            return resolve(error);
        }
    })))
}

module.exports = {
    generateAuthToken,
    login,
    register,
    getOwnUser,
    logout
};
