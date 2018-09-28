var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var moment = require("moment");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();

function verifyAccess(req, res, next) { //check access to routine
    const id = req.session.id;
    const routineId = req.params.id;
    const query = `SELECT "id" FROM "routines"
                        WHERE "ownerId" = :id AND "id" = :routineId`;
    sequelize.query(query, {replacements: {id, routineId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        if(response.length === 0) {
            next(createError(HTTPStatus.NOT_FOUND, "Could not find routine with this ID belonging to this user"));
        }
        else {
            next();
        }
    });
}

router.get('/', function(req, res, next) {
    const id = req.session.id;
    const query = `SELECT "id", "name" FROM "routines"
                        WHERE "ownerId" = :id
                        ORDER BY "lastUsed" DESC`;
    sequelize.query(query, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.render("routines", {routines: response});
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not load routines"));
    }); 
});

router.get('/all', function(req, res, next) {
    const id = req.session.id;
    const query = `SELECT "id", "name" FROM "routines"
                        WHERE "ownerId" = :id
                        ORDER BY "lastUsed" DESC`;
    sequelize.query(query, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.json(response);
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not load routines"));
    }); 
});

router.get("/new", function(req, res, next) {
    res.render("routineeditor", {workouts: []});
});

router.get("/:id/edit", verifyAccess, function(req, res, next) {
    const id = req.params.id;
    const query = `SELECT "r"."name" "routineName", "r"."id" "routineId", "w"."name", "w"."id", json_agg(jsonb_build_object('name', "e"."name", 'id', "e"."id", 'sets', "we"."sets", 'reps', "we"."reps")) "exercises"
                        FROM "workouts" "w"
                        INNER JOIN "routines" "r" ON "r"."id" = "w"."routineId"
                        LEFT JOIN (SELECT * FROM "workoutExercises" ORDER BY "order" ASC) "we" ON "we"."workoutId" = "w"."id"
                        LEFT JOIN "exercises" "e" ON "e"."id" = "we"."exerciseId"
                        WHERE "w"."routineId" = :id
                        GROUP BY "w"."id", "r"."name", "r"."id"
                        ORDER BY "w"."order" ASC;`;
    sequelize.query(query, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.render("routineeditor", {workouts: response});
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not load workouts"));
    });
});

router.patch("/:id/", verifyAccess, function(req, res, next) {
    const id = req.params.id;
    const {name, workouts} = req.body;
    let data;
    try {
        data = JSON.parse(workouts);
    }
    catch(e) {
        next(createError(HTTPStatus.BAD_REQUEST, "Could not parse data object"));
        return;
    }
    const deleteQuery = `DELETE FROM "workouts" WHERE "routineId" = :id`;
    sequelize.query(deleteQuery, {replacements: {id}, type: sequelize.QueryTypes.DELETE}).then(function(response) {
        const updateName = `UPDATE "routines"
                                SET "name" = :name,
                                    "lastUsed" = :date
                                WHERE "id" = :id`;
        sequelize.query(updateName, {replacements: {name, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z'), id}, type: sequelize.QueryTypes.UPDATE}).then(function(response) {
            sequelize.transaction(function(t) {
                const createWorkout = `INSERT INTO "workouts" VALUES (DEFAULT, :routineId, :workout, :index) RETURNING "id"`;
                let workoutPromises = [];
                Object.keys(data).forEach(function(workout, index) {
                    workoutPromises.push(sequelize.query(createWorkout, {replacements: {routineId: id, workout, index},
                    type: sequelize.QueryTypes.INSERT, transaction: t}).then(function(workoutResponse) {
                        return workoutResponse[0][0].id;
                    }));
                });
                return Promise.all(workoutPromises).then(function(workoutIds) {
                    const createExercise = `INSERT INTO "exercises" VALUES (DEFAULT, :exercise)
                                                ON CONFLICT ("name") DO UPDATE SET "name" = excluded."name"
                                                RETURNING "id"`;
                    let exercisePromises = [];
                    Object.keys(data).forEach(function(workout, ind1) {
                        const exercises = data[workout];
                        Object.keys(exercises).forEach(function(exercise, index) {
                            exercisePromises.push(sequelize.query(createExercise, {replacements: {exercise}, type: sequelize.QueryTypes.INSERT, transaction: t}).then(function(exerciseResponse) {
                                return {workId: workoutIds[ind1], id: exerciseResponse[0][0].id, index, reps: exercises[exercise].reps, sets: exercises[exercise].sets}
                            }));
                        });
                    });   
                    return Promise.all(exercisePromises).then(function(exerciseIds) {
                        let addPromises = [];
                        const addExercise = `INSERT INTO "workoutExercises" VALUES (:exId, :workId, :sets, :reps, :index) RETURNING *`;
                        for(let i = 0; i < exerciseIds.length; ++i) {
                            addPromises.push(sequelize.query(addExercise, {replacements: {exId:exerciseIds[i].id, workId: exerciseIds[i].workId, sets: parseInt(exerciseIds[i].sets),
                            reps: parseInt(exerciseIds[i].reps), index: exerciseIds[i].index}, type: sequelize.QueryTypes.INSERT, transaction: t}).then(function(response) {
                                return response[0][0];
                            }));
                        }
                        return Promise.all(addPromises).then(function(data) {
                            return data;
                        });
                    });
            }).then(function(response) {
                res.json(response);
            }).catch(function(thrown) {
                next(createError(HTTPStatus.BAD_REQUEST, "Error changing one or more parts of request"));
            });
        }).catch(function(thrown) {
            next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not update routine name"));
        });
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not delete existing workouts"));
    });
    });
});

router.get("/:id/workout", verifyAccess, function(req, res, next) {
    const id = req.params.id;
    const query = `SELECT "r"."name" "routineName", "r"."id" "routineId", "w"."name", "w"."id", json_agg(jsonb_build_object('name', "e"."name", 'id', "e"."id", 'sets', "we"."sets", 'reps', "we"."reps")) "exercises"
                        FROM "workouts" "w"
                        INNER JOIN "routines" "r" ON "r"."id" = "w"."routineId"
                        LEFT JOIN (SELECT * FROM "workoutExercises" ORDER BY "order" ASC) "we" ON "we"."workoutId" = "w"."id"
                        LEFT JOIN "exercises" "e" ON "e"."id" = "we"."exerciseId"
                        WHERE "w"."routineId" = :id
                        GROUP BY "w"."id", "r"."name", "r"."id"
                        ORDER BY "w"."order" ASC;`
    sequelize.query(query, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.render("workout", {workouts: response, contest: false});
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not load workouts"));
    });
});

router.post("/:id/workout", function(req, res, next) {
    const uid = req.session.id;
    const routineId = req.params.id;
    const {workoutId, data} = req.body;
    if(workoutId === undefined || workoutId.toString().trim() === "" || data === undefined || data.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Missing workout ID or workout data"));
    }
    else {
        try {
            const obj = JSON.parse(data);
            console.log(obj);
            return sequelize.transaction(function(t) {
                const updateLastUsed = `UPDATE "routines"
                                            SET "lastUsed" = :date
                                            WHERE "id" = :id`;
                return sequelize.query(updateLastUsed, {replacements: {date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z'), id: routineId},
                                                        type: sequelize.QueryTypes.UPDATE}).then(function() {
                    const createLog = `INSERT INTO "logs" VALUES (DEFAULT, :uid, :contestId, :workoutId, :date) RETURNING "id"`;
                    return sequelize.query(createLog, {replacements: {uid, contestId: obj.contestId, workoutId, date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, 
                    type: sequelize.QueryTypes.INSERT, transaction: t}).then(function(response) {
                        let promises = [];
                        const createSet = `INSERT INTO "sets" VALUES (DEFAULT, :logId, :exerciseId, :reps, :weight, :order)`;
                        const exercises = Object.keys(obj);
                        for(let i = 0; i < exercises.length; ++i) {
                            if(exercises[i] === "contestId")
                                continue;
                            const sets_arr = obj[exercises[i]];
                            for(let j = 0; j < sets_arr.length; ++j) {
                                promises.push(sequelize.query(createSet, {replacements: {logId: response[0][0].id, exerciseId: exercises[i],
                                reps: sets_arr[j].reps, weight: sets_arr[j].weight, order: j}, type: sequelize.QueryTypes.INSERT, transaction: t}));
                            }
                        }
                        return Promise.all(promises).then(function() {
                            return response[0][0].id;
                        });
                    });
                });
            }).then(function(result) {
                res.json({id: result});
            }).catch(function(thrown) {
                console.log(thrown);
                next(createError(HTTPStatus.BAD_REQUEST, "Error inserting one or more parts of request"))
            });
        }
        catch(e) {
            next(createError(HTTPStatus.BAD_REQUEST, "Could not parse workout data"));
        }
    }
});

router.post("/", function(req, res, next) {
    const id = req.session.id;
    const {name, workouts} = req.body;
    if(name === undefined || name.toString().trim() === "") {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid name"));
        return;
    }
    try {
        const data = JSON.parse(workouts);
        return sequelize.transaction({autocommit: false}).then(function(t) {
            const createRoutine = `INSERT INTO "routines" VALUES (DEFAULT, :id, :name, :date) RETURNING "id"`;
            return sequelize.query(createRoutine, {replacements: {id, name: name.trim(), date: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, 
            type: sequelize.QueryTypes.INSERT, transaction: t}).then(function(routineResponse) {
                let createWorkouts = `INSERT INTO "workouts" VALUES `;
                Object.keys(data).forEach(function(workout, index) {
                    createWorkouts += `(DEFAULT, :routineId, '${workout}', ${index}), `;
                });
                createWorkouts = createWorkouts.slice(0, -2);
                createWorkouts += ` RETURNING "id"`;
                return sequelize.query(createWorkouts, {replacements: {routineId: routineResponse[0][0].id},
                    type: sequelize.QueryTypes.INSERT, transaction: t}).then(function(workoutResponse) {
                        return workoutResponse[0].map(function(o) {
                            return o.id;
                        });
                    }).catch(function(thrown) {
                        next(createError(HTTPStatus.BAD_REQUEST, "Invalid workout information"));
                        return t.rollback();
                }).then(function(workoutIds) {
                    const createExercise = `INSERT INTO "exercises" VALUES (DEFAULT, :exercise)
                                                ON CONFLICT ("name") DO UPDATE SET "name" = excluded."name"
                                                RETURNING "id"`;
                    let exercisePromises = [];
                    Object.keys(data).forEach(function(workout, ind1) {
                        const exercises = data[workout];
                        Object.keys(exercises).forEach(function(exercise, index) {
                            exercisePromises.push(sequelize.query(createExercise, {replacements: {exercise}, type: sequelize.QueryTypes.INSERT, transaction: t}).then(function(exerciseResponse) {
                                return {workId: workoutIds[ind1], id: exerciseResponse[0][0].id, index, reps: exercises[exercise].reps, sets: exercises[exercise].sets}
                            }).catch(function(thrown) {
                                next(createError(HTTPStatus.BAD_REQUEST, "Invalid exercise information"));
                                return t.rollback();
                            }));
                        });
                    });    
                    return Promise.all(exercisePromises).then(function(exerciseIds) {
                        let addExercises = `INSERT INTO "workoutExercises" VALUES `;
                        for(let i = 0; i < exerciseIds.length; ++i) {
                            addExercises += `(${exerciseIds[i].id}, ${exerciseIds[i].workId}, ${parseInt(exerciseIds[i].sets)}, ${parseInt(exerciseIds[i].reps)}, ${exerciseIds[i].index}), `;
                        }
                        addExercises = addExercises.slice(0, -2);
                        addExercises += ` RETURNING *`;
                        return sequelize.query(addExercises, {type: sequelize.QueryTypes.INSERT, transaction: t}).then(function(response) {
                            t.commit();
                            return response[0][0];
                        }).catch(function(thrown) {
                            next(createError(HTTPStatus.BAD_REQUEST, "Invalid sets or reps information"));
                            return t.rollback();
                        });
                    });
                });
            }).catch(function(thrown) {
                next(createError(HTTPStatus.BAD_REQUEST, "Invalid routine information"));
                return t.rollback();
            });
        }).then(function(result) {
            res.status(HTTPStatus.CREATED).json(result);
        }).catch(function(thrown) {
            next(createError(HTTPStatus.BAD_REQUEST, "Error inserting one or more parts of request"));
        });
    }
    catch(e) {
        next(createError(HTTPStatus.BAD_REQUEST, "Invalid workout data object"));
    }
});

router.get("/:id/progress", verifyAccess, function(req, res, next) {
    const id = req.session.id;
    const routineId = req.params.id;
    const getLogs = `SELECT "w"."id", "w"."name", json_agg("stats".*) "stats"
                        FROM "workouts" "w"
                        LEFT JOIN (
                        SELECT "l"."workoutId", "e"."name", "e"."id", json_agg(DISTINCT jsonb_build_object('date', "l"."datetime", 'reps', "s"."reps", 'weight', "s"."weight")) "sets"
                            FROM (SELECT * FROM "logs" ORDER BY "datetime" ASC) "l"
                            LEFT JOIN (SELECT * FROM "sets" ORDER BY "order" DESC) "s" ON "s"."logId" = "l"."id"
                            LEFT JOIN "exercises" "e" ON "e"."id" = "s"."exerciseId"
                            WHERE "l"."userId" = :id
                            GROUP BY "l"."workoutId", "e"."name", "e"."id") "stats"
                        ON "stats"."workoutId" = "w"."id"
                        WHERE "w"."routineId" = :routineId
                        GROUP BY "w"."id"
                        ORDER BY "w"."order"`;
    sequelize.query(getLogs, {replacements: {id, routineId}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        for(let i = 0; i < response.length; ++i) {
            if(response[i].stats[0] === null)
                continue;
            for(let j = 0; j < response[i].stats.length; ++j) {
                for(let k = 0; k < response[i].stats[j].sets.length; ++k) {
                    response[i].stats[j].sets[k].date = moment(response[i].stats[j].sets[k].date).format("MMM DD");
                }
            }
        }
        res.render("progress", {workouts: response})
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Error loading progress"));
    });
    
});

module.exports = router;