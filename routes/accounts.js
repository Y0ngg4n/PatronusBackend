const account = require('../src/models/account/account');
const db = require('../src/db/cockroach/db');
const auth = require('../middleware/auth');

const express = require('express');
const router = express.Router();
const accounts = require("../src/models/account/account");

router.post('/accounts/register', async (req, res) => {
    // Create a new user
    try {
        const {email, password, nickname} = req.body;
        const token = await accounts.generateAuthToken(email);
        await accounts.register(email, password, nickname, token).then(value => {
            if (value instanceof Error) {
                return res.status(401).send({error: value.message});
            } else {
                return res.status(201).send({token});
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(400).send(error);
    }
});

router.post('/accounts/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const token = await account.generateAuthToken(email);
        await accounts.login(email, password, token).then(userAccount => {
            if (userAccount instanceof Error) {
                return res.status(401).send({error: userAccount.message});
            } else {
                return res.status(200).send(getUserData(userAccount, token));
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(400).send(error);
    }
});

router.post('/accounts/me', auth, async (req, res) => {
    try {
        if (req.user instanceof Error) {
            throw req.user;
        } else {
            return res.status(200).send(getUserData(req.user, req.token));
        }
    } catch (error) {
        console.log(error);
        return res.status(400).send(error);
    }
});

router.post('/accounts/logout', auth, async (req, res) => {
    try {
        if (req.user instanceof Error) {
            throw req.user;
        } else {
            await accounts.logout(req.user.email).then(value => {
                return res.status(200).send("Successfully logged out!");
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(400).send(error);
    }
});

const getUserData = (userAccount, token) => {
    return {
        uuid: userAccount.uuid,
        email: userAccount.email,
        nickname: userAccount.nickname,
        token: token,
    };
};

module.exports = router;
