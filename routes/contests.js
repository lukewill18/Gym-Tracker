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

function addUserToContest(id, contestId, invitationId) {
    const query = `INSERT INTO "contestUsers" VALUES (:contestId, :id) RETURNING *`;
    return sequelize.query(query, {replacements: {contestId, id}, type: sequelize.QueryTypes.INSERT}).then(function() {
        if(invitationId) {
            return sequelize.query(`DELETE FROM "invitations" WHERE "id" = :id`, 
                {replacements: {id: invitationId}, type: sequelize.QueryTypes.DELETE});
        }
    });
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
        const checkAccess = `SELECT "id" FROM "invitations" WHERE "targetID" = :id AND "type" = 'contest' AND "contestID" = :contestId`;
        sequelize.query(checkAccess, {replacements: {id, contestId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
            if(response.length === 0) {
                next(createError(HTTPStatus.NOT_FOUND, "No invitation found for this user to join this contest"));
            }
            else {
                const invitationId = response[0].id;
                addUserToContest(id, contestId, invitationId).then(function(response) {
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

function loadRoutine(req, res, next) {
    const id = req.params.id;
    const query = `SELECT "r"."name" "routineName", "r"."id" "routineId", "w"."name", "w"."id", json_agg(jsonb_build_object('name', "e"."name", 'id', "e"."id", 'sets', "we"."sets", 'reps', "we"."reps")) "exercises"
                        FROM "workouts" "w"
                        INNER JOIN "routines" "r" ON "r"."id" = "w"."routineId"
                        LEFT JOIN (SELECT * FROM "workoutExercises" ORDER BY "order" ASC) "we" ON "we"."workoutId" = "w"."id"
                        LEFT JOIN "exercises" "e" ON "e"."id" = "we"."exerciseId"
                        WHERE "w"."routineId" = (SELECT "routineID" FROM "contests"
                                                    where "id" = :id)
                        GROUP BY "w"."id", "r"."name", "r"."id"
                        ORDER BY "w"."order" ASC;`;
    sequelize.query(query, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.render("workout", {workouts: response, contest: true, contestId: id})
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to load contest's routine"));
    });
}

router.get("/:id/workout", verifyAccess, function(req, res, next) {
    const uid = req.session.id;
    const id = req.params.id;
    const checkType = `SELECT "type" FROM "contests" WHERE "id" = :id`;
    sequelize.query(checkType, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        if(response[0].type === "onetime") {
            const checkLogged = `SELECT "id" FROM "logs" WHERE "contestId" = :id AND "userId" = :uid`;
            sequelize.query(checkLogged, {replacements: {id, uid}, type: sequelize.QueryTypes.SELECT}).then(function(check) {
                if(check.length > 0) {
                    res.redirect("/contests/" + id.toString() + "/standings");
                    return;
                }
                else {
                    loadRoutine(req, res, next);
                }
            }).catch(function(thrown) {
                next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to load contest's routine"));
            });
        }
        else {
            const checkOver = `SELECT "start", "end" FROM "contests" WHERE "id" = :id`;
            sequelize.query(checkOver, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(dates) {
                console.log(dates);//HERE
            }).catch(function(thrown) {
                next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to load contest's routine"));
            });
        }
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to load contest's routine"));
    });
});

function displayOneTimeStandings(req, res, next) {
    const id = req.params.id;
    const checkComplete = `SELECT (SELECT count("id") FROM (SELECT "id" FROM "logs" WHERE "contestId" = :id) "l") >=
                                ((SELECT count("id") FROM (SELECT "id" FROM "invitations" WHERE "contestID" = :id) "i") +
                                (SELECT count("userID") FROM (SELECT "userID" FROM "contestUsers" WHERE "contestID" = :id) "u")) "done"`;
    sequelize.query(checkComplete, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(done) {
        if(done[0].done) {
            const getLogs = `SELECT "l"."userId", concat("u"."firstName", ' ', "u"."lastName") "name", json_agg("s".*) "sets" FROM "logs" "l"
                                LEFT JOIN "sets" "s" ON "s"."logId" = "l"."id"
                                INNER JOIN "users" "u" ON "u"."id" = "l"."userId"
                                WHERE "l"."contestId" = :id
                                GROUP BY "l"."userId", "u"."firstName", "u"."lastName"`;
            sequelize.query(getLogs, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(logs) {
                res.render("standings", {results: logs, type: "onetime"});
            }).catch(function(thrown) {
                next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to load standings"));
            });
        }
        else {
            res.render("standings", {results: [], type: "onetime"});
        }
    }).catch(function(thrown) {
        console.log(thrown);

        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to load standings"))
    });
}

function displayProgressStandings(req, res, next) {
    res.render("standings", {results: [], type: "progress"});
}

router.get("/:id/standings", verifyAccess, function(req, res, next) {
    const id = req.params.id;
    const checkType = `SELECT "type" FROM "contests" WHERE "id" = :id`;
    sequelize.query(checkType, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        if(response[0].type === "onetime") {
            displayOneTimeStandings(req, res, next);
        } 
        else { 
            displayProgressStandings(req, res, next);
        }
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to load standings"))
    });
//    res.render("standings");
});

module.exports = router;