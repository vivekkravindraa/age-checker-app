const express = require('express');

const { homeController } = require('../app/contollers/homeController');
const { customersController } = require('../app/contollers/customersController');
const { shopifyController } = require('../app/contollers/shopifyController');

const router = express.Router();

router.use('/', homeController);
router.use('/customers', customersController);
router.use('/shopify', shopifyController);

module.exports = { router }