var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var moment = require("moment");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();

router.get("/", function(req, res, next) {
    const id = req.session.id;
    const query = `SELECT "i"."id", "i"."inviterID", concat("u"."firstName", ' ', "u"."lastName") "name", "i"."type", "i"."contestID", "c"."name" AS "contestName", "i"."date" FROM "invitations" "i"
                        INNER JOIN "users" "u" ON "u"."id" = "i"."inviterID"
                        LEFT JOIN "contests" "c" ON "c"."id" = "i"."contestID"
                        WHERE "i"."targetID" = :id
                        ORDER BY "i"."date" DESC`;
    sequelize.query(query, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        for(let i = 0; i < response.length; ++i) {
            response[i].date = moment(response[i].date).from(moment(Date.now()));
        }
        res.json(response);
    }).catch(function(thrown) {
        console.log(thrown);
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Couldn't retrieve invitations"));
    });
});

router.post("/friend", function(req, res, next) {
    const uid = req.session.id;
    const id = req.body.id; //user to invite
    if(id === undefined || id.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid id"));
    }
    const query = `INSERT INTO "invitations" VALUES (DEFAULT, :uid, :id, 'friend', NULL, :date) RETURNING *`;
    sequelize.query(query, {replacements: {uid, id, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
       res.json(response);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid id"));
    });
});

router.post("/contest", function(req, res, next) {
    const uid = req.session.id;
    const {id, invited} = req.body;
    if(id === undefined || invited === undefined || invited.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid ID or invited list"));
    }
    else {
        const ids = invited.split(",");
        let query = `INSERT INTO "invitations" VALUES `;
        for(let i = 0; i < ids.length; ++i) {
            query += `(DEFAULT, :uid, ${ids[i]}, 'contest', :contestId, :date), `;
        }
        query = query.slice(0, -2);
        query += ` RETURNING *`;
        sequelize.query(query, {replacements: {uid, contestId: id, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, 
        type: sequelize.QueryTypes.INSERT}).then(function(response) {
            res.json(response);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid ID or invited list"));
        });
    }
});

router.delete("/", function(req, res, next) {
    const uid = req.session.id;
    const id = req.body.id;
    if(id === undefined || id.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid inviter id"));
    }
    const query = `DELETE FROM "invitations"
                        WHERE "id" = :id AND "targetId" = :uid`;
    sequelize.query(query, {replacements: {id, uid}, type: sequelize.QueryTypes.DELETE}).then(function(response) {
        res.json(response);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid inviter ID"));
    });
});

module.exports = router;