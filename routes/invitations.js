var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var moment = require("moment");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();

router.get("/", function(req, res, next) {
    const id = req.session.id;
    const query = `SELECT "i"."inviterID", concat("u"."firstName", ' ', "u"."lastName") "name", "i"."type", "i"."date" FROM "invitations" "i"
                        INNER JOIN "users" "u" ON "u"."id" = "i"."inviterID"
                        WHERE "i"."targetID" = :id
                        ORDER BY "i"."date" DESC`;
    sequelize.query(query, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        for(let i = 0; i < response.length; ++i) {
            response[i].date = moment(response[i].date).from(moment(Date.now()));
        }
        res.json(response);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Couldn't retrieve invitations"));
    });
});

router.post("/friend", function(req, res, next) {
    const uid = req.session.id;
    const id = req.body.id; //user to invite
    if(id === undefined || id.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid id"));
    }
    const query = `INSERT INTO "invitations" VALUES (:uid, :id, 'friend', :date) RETURNING *`;
    sequelize.query(query, {replacements: {uid, id, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
       res.json(response);
    }).catch(function(thrown) {
        console.log(thrown);
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid id"));
    });
});

router.delete("/", function(req, res, next) {
    const id = req.session.id;
    const inviterID = req.body.inviterID;
    if(inviterID === undefined || inviterID.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid inviter id"));
    }
    const query = `DELETE FROM "invitations"
                        WHERE "inviterID" = :inviterID AND "targetID" = :id`;
    sequelize.query(query, {replacements: {inviterID, id}, type: sequelize.QueryTypes.DELETE}).then(function(response) {
        res.json(response);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid inviter ID"));
    });
});

module.exports = router;