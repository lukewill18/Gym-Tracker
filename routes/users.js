var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var bcrypt = require("bcrypt");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();
router.post('/register', function(req, res, next) {
    const {firstName, lastName, email, password} = req.body;
    if(firstName === undefined || lastName === undefined || email === undefined || password === undefined ||
        firstName.toString().trim() === "" || lastName.toString().trim() === "" || email.toString().trim() === "" || password === "") {
            next(createError(HTTPStatus.BAD_REQUEST, "One or more fields left blank"));
        }
    else {
        bcrypt.hash(password, 10, function(err, hash) {
            if(err) {
                next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Error hashing password"));
                return;
            }
            const query = `INSERT INTO "users" VALUES (DEFAULT, :firstName, :lastName, :hash, :email) RETURNING "id"`;
            sequelize.query(query, {replacements: {firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), hash}, type: sequelize.QueryTypes.INSERT}).then(function(response) {
                req.session.id = response[0][0].id;
                res.status(HTTPStatus.CREATED).json(response[0][0]);
            }).catch(function(thrown) {
                console.log(thrown);
                next(createError(HTTPStatus.BAD_REQUEST, "One or more invalid fields; could not register"));
            });
        });
    }
});

router.post('/login', function(req, res, next) {
    const {email, password} = req.body;
    if(email === undefined || password === undefined || email.toString().trim() === "" || password.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "One or more fields left blank"));
    }
    else {
        const query = `SELECT "id", "password" FROM "users" WHERE "email" = :email`;
        sequelize.query(query, {replacements: {email: email.trim()}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            if(response.length === 0) {
                next(createError(HTTPStatus.BAD_REQUEST, "No users found matching email"));
            }
            else {
                bcrypt.compare(password, response[0].password, function(err, eql) {
                    if(err) {
                        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Error decrypting password"));
                    }
                    else if(eql) {
                        req.session.id = response[0].id;
                        res.json({id: response[0].id});
                    }
                });
            }
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid email; could not find user"));
        });
    }
});

module.exports = router;
