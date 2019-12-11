const express = require('express');
const getAge = require('get-age');

const { Shopify } = require('../models/Shopify');

const router = express.Router();

router.get('/ageVerifier', (req, res) => {
    let shopDomain = req.query.shopDomain;
    let userAge = req.query.userAge;

    Shopify.findOne({ shopDomain })
        .then((shop) => {
            let age = getAge(userAge);
            let ageInShop = shop.ageLimit;

            if (age >= ageInShop) {
                res.send({
                    isVerified: true,
                    message: 'Age verified successfully.'
                })
            } else {
                res.send({
                    isVerified: false,
                    message: `You must be ${ageInShop} years old.`
                })
            }
        })
        .catch((error) => {
            res.send(error);
        })
})

module.exports = { customersController: router }
