var async = require('async');
var fs = require('fs');
var pg = require('pg');

// Connect to the "bank" database.
var config = {
    user: 'patronus',
    host: 'localhost',
    database: 'patronus',
    port: 26257
};

// Create a pool.
const pool = new pg.Pool(config);

const createTables = async () => {
    return await new Promise((resolve) => {
        pool.connect(function (err, client, done) {
            logErrors(err, client, done);
            async.waterfall([
                function (next) {
                    client.query("CREATE TABLE IF NOT EXISTS accounts (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(), " +
                        "email STRING NOT NULL UNIQUE CHECK (email LIKE '%@%'), password STRING NOT NULL, nickname STRING NOT NULL UNIQUE," +
                        "token STRING);", next);
                },
            ]).then(value => {
                done();
                if (value instanceof Error) {
                    resolve(value);
                } else {
                    resolve();
                }
            });
        });
    });
};

const getAccountByToken = async (token) => {
    return await new Promise((resolve) => {
        pool.connect((err, client, done) => {
            logErrors(err, client, done);
            client.query({
                text: "SELECT * FROM accounts WHERE token=$1 AND token IS NOT NULL",
                values: [token],
                callback: function (err, results) {
                    done();
                    if (err) {
                        resolve(err);
                    } else if (results) {
                        resolve(results.rows);
                    } else {
                        resolve(false);
                    }
                }
            });
        });
    });
};


const getAccountByEmail = async (email) => {
    return await new Promise((resolve) => {
        pool.connect((err, client, done) => {
            logErrors(err, client, done);
            client.query({
                text: "SELECT * FROM accounts WHERE email=$1",
                values: [email],
                callback: function (err, results) {
                    done()
                    if (err) {
                        resolve(err);
                    } else if (results) {
                        resolve(results.rows);
                    } else {
                        resolve(false);
                    }
                }
            });
        });
    });
};

const registerNewAccount = async (email, password, nickname, token) => {
    return await new Promise((resolve) => {
        pool.connect(function (err, client, done) {
            logErrors(err, client, done);
            client.query({
                text: "SELECT * FROM accounts WHERE email=$1",
                values: [email],
                callback: function (err, results) {
                    if (results.rowCount > 0) {
                        resolve(new Error("User with this Email allready exists"));
                    } else {
                        client.query({
                            text: "INSERT INTO accounts (email, password, nickname, token) VALUES ($1, $2, $3, $4);",
                            values: [email, password, nickname, token],
                            callback: function (err, results) {
                                done();
                                if (err) {
                                    resolve(err);
                                } else if (results) {
                                    resolve(results.rows);
                                } else {
                                    resolve(false);
                                }
                            }
                        });
                    }
                }
            });
        });
    });
};

const updateTokenByEmail = async (email, token) => {
    return await new Promise((resolve) => {
        pool.connect(function (err, client, done) {
            logErrors(err, client, done);
            client.query({
                text: "UPDATE accounts SET token=$1 WHERE email=$2",
                values: [token, email],
                callback: function (err, results) {
                    done();
                    if (err) {
                        resolve(err);
                    } else if (results) {
                        resolve(results.rows);
                    } else {
                        resolve();
                    }
                }
            });

        });
    });
};

function logErrors(err, client, done) {

    if (err) {
        console.error('Could not connect to cockroachdb', err);
        done()
    } else {
        console.log("Successfully connected to cockroachdb");
    }
}

module.exports = {
    createTables,
    getAccountByToken,
    getAccountByEmail,
    registerNewAccount,
    updateTokenByEmail,
};

