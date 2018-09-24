var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var moment = require("moment");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();

router.get("/", function(req, res, next) {
    res.render("contests", {contests: []});
});

module.exports = router;