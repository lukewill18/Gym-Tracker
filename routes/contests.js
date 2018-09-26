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

function addUserToContest(id, contestId) {
    const query = `INSERT INTO "contestUsers" VALUES (:contestId, :id) RETURNING *`;
    return sequelize.query(query, {replacements: {contestId, id}, type: sequelize.QueryTypes.INSERT});
}

router.post("/", function(req, res, next) {
    const id = req.session.id;
    const {name, routineID, type, start, end} = req.body;
    if(name === undefined || name.trim() === "" || routineID === undefined || routineID.toString().trim() === "" || type === undefined || type.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Missing one or more required parameters"));
    }
    else {
        const query = `INSERT INTO "contests" VALUES (DEFAULT, :routineID, :name, :type, :start, :end, :date) RETURNING "id"`;
        if(type === "progress") {
            if(start === undefined || start.toString().trim() === "" || end === undefined || end.toString().trim() === "") {
                next(createError(HTTPStatus.BAD_REQUEST, "Missing one or more required parameters"));
            }
            else {
                sequelize.query(query, {replacements: {routineID, name, type, start, end, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')},
                                type: sequelize.QueryTypes.INSERT}).then(function(response) {
                        addUserToContest(id, response[0][0].id).then(function() {
                        res.json(response[0][0]);
                    }).catch(function(thrown) {
                        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not add user to contest"));
                    });
                }).catch(function(thrown) {
                    next(createError(HTTPStatus.BAD_REQUEST, "Invalid input; could not create contest"));
                });
            }
        }
        else if (type !== "onetime") {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid type"));
        }
        else {
            sequelize.query(query, {replacements: {routineID, name, type, start: null, end: null, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')},
                                type: sequelize.QueryTypes.INSERT}).then(function(response) {
                addUserToContest(id, response[0][0].id).then(function() {
                    res.json(response[0][0]);
                }).catch(function(thrown) {
                    next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not add user to contest"));
                });
            }).catch(function(thrown) {
                next(createError(HTTPStatus.BAD_REQUEST, "Invalid input; could not create contest"));
            });
    }
    }
});

module.exports = router;