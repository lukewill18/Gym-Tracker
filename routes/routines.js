var express = require('express');
var HTTPStatus = require("http-status");
var createError = require("http-errors");
var moment = require("moment");
var db = require("../models/index.js");
var sequelize = db.sequelize;

var router = express.Router();
router.get('/', function(req, res, next) {
    const id = req.session.id;
    const query = `SELECT "id", "name" FROM "routines"
                        WHERE "ownerId" = :id
                        ORDER BY "createdAt" DESC`;
    sequelize.query(query, {replacements: {id}, type: sequelize.QueryTypes.SELECT}).then(function(response) {
        res.render("routines", {routines: response});
    }).catch(function(thrown) {
        next(createError(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not load routines"));
    });
    
});

router.get("/:id/edit", function(req, res, next) {
    res.render("routineeditor");
});

router.get("/:id/workout", function(req, res, next) {
    res.render("workout");
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
            const createRoutine = `INSERT INTO "routines" VALUES (DEFAULT, :id, :name, :createdAt) RETURNING "id"`;
            return sequelize.query(createRoutine, {replacements: {id, name: name.trim(), createdAt: moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS Z')}, 
            type: sequelize.QueryTypes.INSERT, transaction: t}).then(function(routineResponse) {
                const createWorkout = `INSERT INTO "workouts" VALUES (DEFAULT, :routineId, :workout, :index) RETURNING "id"`;
                let workoutPromises = [];
                Object.keys(data).forEach(function(workout, index) {
                    workoutPromises.push(sequelize.query(createWorkout, {replacements: {routineId: routineResponse[0][0].id, workout, index},
                    type: sequelize.QueryTypes.INSERT, transaction: t}).then(function(workoutResponse) {
                        return workoutResponse[0][0].id;
                    }).catch(function(thrown) {
                        next(createError(HTTPStatus.BAD_REQUEST, "Invalid workout information"));
                        return t.rollback();
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
                            }).catch(function(thrown) {
                                next(createError(HTTPStatus.BAD_REQUEST, "Invalid exercise information"));
                                return t.rollback();
                            }));
                        });
                    });    
                    return Promise.all(exercisePromises).then(function(exerciseIds) {
                        console.log(exerciseIds);
                        let addPromises = [];
                        const addExercise = `INSERT INTO "workoutExercises" VALUES (:exId, :workId, :sets, :reps, :index) RETURNING *`;
                        for(let i = 0; i < exerciseIds.length; ++i) {
                            addPromises.push(sequelize.query(addExercise, {replacements: {exId:exerciseIds[i].id, workId: exerciseIds[i].workId, sets: parseInt(exerciseIds[i].sets),
                            reps: parseInt(exerciseIds[i].reps), index: exerciseIds[i].index}, type: sequelize.QueryTypes.INSERT, transaction: t}).then(function(response) {
                                return response[0][0];
                            }).catch(function(thrown) {
                                next(createError(HTTPStatus.BAD_REQUEST, "Invalid sets or reps information"));
                                return t.rollback();
                            }));
                        }
                        return Promise.all(addPromises).then(function(data) {
                            t.commit();
                            return data;
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


module.exports = router;
