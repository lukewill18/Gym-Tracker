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
                next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, ""));
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
                        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, ""));
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

router.get("/friends", function(req, res, next) { 
    const id = req.session.id;
    if(id === undefined) {
        res.redirect("/");
    }
    else {
        const query = `SELECT "ids"."friendID" "id", concat("u"."firstName", ' ', "u"."lastName") "name", "ids"."pending" FROM
                            (SELECT "user2ID" AS "friendID", FALSE AS "pending" FROM "friendships" WHERE "user1ID" = :id
                        UNION
                            (SELECT "user1ID" AS "friendID", FALSE AS "pending" FROM "friendships" WHERE "user2ID" = :id)
                        UNION
                            (SELECT "i"."targetID" AS "friendID", TRUE AS "pending" FROM "invitations" "i"
                                WHERE "i"."inviterID" = :id AND "i"."type" = 'friend'
                                ORDER BY "i"."date" ASC)) "ids"
                        INNER JOIN "users" "u" ON "u"."id" = "ids"."friendID"`;
        sequelize.query(query, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            res.json(response);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to retrieve friends"));
        });
    }
});

router.post("/friend", function(req, res, next) {
    const id = req.session.id;
    const inviterID = req.body.inviterID;
    if(inviterID === undefined || inviterID.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid inviter ID"));
    }
    else {
        const checkInvite = `SELECT * FROM "invitations" 
                                WHERE "inviterID" = :inviterID AND "targetID" = :id AND "type" = 'friend'`;
        sequelize.query(checkInvite, {replacements: {inviterID, id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            if(response.length === 0)
                next(createError(HTTPStatus.BAD_REQUEST, "No friend request found"));
            else {
                const removeInvite = `DELETE FROM "invitations" WHERE "inviterID" = :inviterID AND "targetID" = :id AND "type" = 'friend'`;
                sequelize.query(removeInvite, {replacements: {inviterID, id}, type: sequelize.QueryTypes.DELETE}).then(function(response) {
                    const addFriend = `INSERT INTO "friendships" VALUES (:inviterID, :id) RETURNING *`;
                    return sequelize.query(addFriend, {replacements: {inviterID, id}, type: sequelize.QueryTypes.INSERT});
                }).then(function(response) {
                    res.json(response);
                }).catch(function(thrown) {
                    next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to add friend"));
                });
            }
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid inviter ID"));
        });
    }
});

router.get("/search/", function(req, res, next) {
    const name = req.query.name;
    const id = req.session.id;
    let exclude = [];
    if(req.query.exclude !== undefined) {
        exclude = req.query.exclude.split(",");
        if(id !== undefined) {
            exclude.push(id.toString());
        }
    }
    if(name === undefined)
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid name"));
    else {
        const query = `SELECT "id", concat("firstName", ' ', "lastName") AS name FROM "users"
                        WHERE concat("firstName", ' ', "lastName") LIKE concat('%', :name, '%');`;
        sequelize.query(query, {replacements: {name}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            res.json(response.filter(function(u) {
                return exclude.indexOf(u.id.toString()) === -1;
            }));
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid input; could not search"));
        });
    }
});

module.exports = router;