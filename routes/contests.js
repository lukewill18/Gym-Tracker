var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var moment = require("moment");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();

function verifyAccess(req, res, next) {
    const id = req.session.id;
    const contestId = req.params.id;
    const query = `SELECT "userID" FROM "contestUsers"
                        WHERE "userID" = :id AND "contestID" = :contestId`;
    sequelize.query(query, {replacements: {id, contestId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        if(response.length === 0) {
            next(createError(HTTPStatus.NOT_FOUND, "Could not find contest with this ID belonging to this user"));
        }
        else {
            next();
        }
    });
}

router.get("/", function(req, res, next) {
    const query = `SELECT "c"."id", "c"."name", "c"."type", "c"."routineID" FROM "contests" "c"
                        INNER JOIN "contestUsers" "cu" ON "c"."id" = "cu"."contestID"
                        WHERE "cu"."userID" = :id
                        ORDER BY "c"."createdAt" DESC`;
    sequelize.query(query, {replacements: {id: req.session.id},
    type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.render("contests", {contests: response});
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Error loading contests"));
    });
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
        const query = `INSERT INTO "contests" VALUES (DEFAULT, :routineID, :name, :type, :start, :end, :date) RETURNING "id", "name", "type", "routineID"`;
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

router.patch("/users", function(req, res, next) {
    const id = req.session.id;
    const contestId = req.body.id;
    if(contestId === undefined || contestId.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid contest ID"));
    }
    else {
        const checkAccess = `SELECT * FROM "invitations" WHERE "targetID" = :id AND "type" = 'contest' AND "contestID" = :contestId`;
        sequelize.query(checkAccess, {replacements: {id, contestId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            if(response.length === 0) {
                next(createError(HTTPStatus.NOT_FOUND, "No invitation found for this user to join this contest"));
            }
            else {
                addUserToContest(id, contestId).then(function(response) {
                    res.json(response);
                }).catch(function(thrown) {
                    next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to join contest"));
                });
            }
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Invalid input; could not create contest"));
        });
    }
});

router.get("/:id/workout", verifyAccess, function(req, res, next) {
    const id = req.params.id;
    const query = `SELECT "r"."name" "routineName", "r"."id" "routineId", "w"."name", "w"."id", json_agg(jsonb_build_object('name', "e"."name", 'id', "e"."id", 'sets', "we"."sets", 'reps', "we"."reps")) "exercises"
        FROM "workouts" "w"
        INNER JOIN "routines" "r" ON "r"."id" = "w"."routineId"
        LEFT JOIN (SELECT * FROM "workoutExercises" ORDER BY "order" ASC) "we" ON "we"."workoutId" = "w"."id"
        LEFT JOIN "exercises" "e" ON "e"."id" = "we"."exerciseId"
        WHERE "w"."routineId" = (SELECT "routineID" FROM "contests"
                                    where "id" = :id)
        GROUP BY "w"."id", "r"."name", "r"."id"
        ORDER BY "w"."order" ASC;`
    sequelize.query(query, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.render("workout", {workouts: response, contest: true, contestId: id})
    }).catch(function(thrown) {
        next(createErorr(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to load contest's routine"));
    });
});

router.get("/:id/standings", verifyAccess, function(req, res, next) {
    res.json("hi");
});

module.exports = router;