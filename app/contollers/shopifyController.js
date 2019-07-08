const dotenv = require('dotenv').config();
const express = require('express');
const router = express.Router();

const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const scopes = 'read_products';
const forwardingAddress = "https://4f527423.ngrok.io";

const { Shopify } = require('../models/Shopify');

router.get('/', (req, res) => {
    const shop = req.query.shop;
    if (shop) {
        const state = nonce();
        const redirectUri = forwardingAddress + '/shopify/callback';
        const installUrl = 'https://' + shop +
            '/admin/oauth/authorize?client_id=' + apiKey +
            '&scope=' + scopes +
            '&state=' + state +
            '&redirect_uri=' + redirectUri;

        res.cookie('state', state);
        res.redirect(installUrl);
    } else {
        return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
    }
});

router.get('/callback', (req, res) => {
    const { shop, hmac, code, state } = req.query;
    const stateCookie = cookie.parse(req.headers.cookie).state;

    if (state !== stateCookie) {
        return res.status(403).send('Request origin cannot be verified');
    }

    if (shop && hmac && code) {
        // DONE: Validate request is from Shopify
        const map = Object.assign({}, req.query);
        delete map['signature'];
        delete map['hmac'];
        const message = querystring.stringify(map);
        const providedHmac = Buffer.from(hmac, 'utf-8');
        const generatedHash = Buffer.from(
            crypto
                .createHmac('sha256', apiSecret)
                .update(message)
                .digest('hex'),
            'utf-8'
        );
        let hashEquals = false;

        try {
            hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
        } catch (e) {
            hashEquals = false;
        };

        if (!hashEquals) {
            return res.status(400).send('HMAC validation failed');
        }

        // DONE: Exchange temporary code for a permanent access token
        const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
        const accessTokenPayload = {
            client_id: apiKey,
            client_secret: apiSecret,
            code,
        };

        request.post(accessTokenRequestUrl, { json: accessTokenPayload })
            .then((accessTokenResponse) => {
                const accessToken = accessTokenResponse.access_token;
                // DONE: Use access token to make API call to 'shop' endpoint
                const shopRequestUrl = 'https://' + shop + '/admin/api/2019-04/shop.json';
                const shopRequestHeaders = { 'X-Shopify-Access-Token': accessToken };

                let body = {
                    shopDomain: shop,
                    accessToken,
                    ageLimit: 0
                }

                Shopify.findOne({ shopDomain: shop }).then(user => {
                    if (!user) {
                        let userData = new Shopify(body);
                        userData
                            .save()
                            .then(userSaved => {
                                if (userSaved) {
                                    console.log('Shop created.');
                                }
                            })
                            .catch(err => {
                                console.log(err);
                            });
                    } else {
                        user.accessToken = body.accessToken;
                        user
                            .save()
                            .then(tokenUpdated => {
                                if (tokenUpdated) {
                                    console.log('Shop found. Token updated.')
                                }
                            })
                            .catch(err => {
                                console.log(err);
                            });
                    }
                });

                request.get(shopRequestUrl, { headers: shopRequestHeaders })
                    .then((shopResponse) => {
                        if (shopResponse) {
                            // res.status(200).end(shopResponse);
                            // res.status(200).redirect(`${process.env.REACT_URL}`)
                            res.render('app', {
                                title: 'Shopify Node App',
                                shop: shop,
                                success: ''
                            });
                        }
                    })
                    .catch((error) => {
                        res.status(error.statusCode).send(error.error.error_description);
                    });
            })
            .catch((error) => {
                res.status(error.statusCode).send(error.error.error_description);
            });

    } else {
        res.status(400).send('Required parameters missing');
    }
});

router.get('/setAge/:shopDomain', (req, res) => {
    let shopDomain = req.params.shopDomain;
    let age = req.query.age;

    if(age) {
        Shopify.findOneAndUpdate({ shopDomain }, { $set: { ageLimit: age } }, { new: true })
        .then((ageUpdated) => {
            if(ageUpdated) {
                res.status(200).send({
                    message: `Successfully updated the age limit to ${ageUpdated.ageLimit}.`
                })
            }
        })
        .catch((error) => {
            res.status(404).send(error);
        })
    }
})

router.get('/getAge/:shopDomain', (req,res) => {
    let shopDomain = req.params.shopDomain;

    Shopify.findOne({ shopDomain })
    .then((shop) => {
        if(shop) {
            res.status(200).send({
                ageLimit: shop.ageLimit
            })
        }
    })
    .catch((error) => {
        res.status(404).send(error);
    })
})

module.exports = { shopifyController: router }