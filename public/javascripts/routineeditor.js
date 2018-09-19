function createRoutine(name, workouts) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/routines/",
            method: "POST",
            data: {name, workouts},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

$(function() {
    const form = $("#routine-form");
    const alert = $(".alert");
    const page = $("#routine-edit-page");
    let currentEdit = null;
    let currentName = null;

    function showAlert() {
        alert.css("opacity", "1");
        alert.css("z-index", "2");
        setTimeout(function() {
            alert.css("opacity", "0");
            alert.css("z-index", "0");
        }, 3000);
    }

    function generateWorkoutForm() {
        const num_workouts = form.find(".workout-form-group").length;
        return `<div class="form-group workout-form-group">
                    <input type="text" class="name-edit hidden">
                    <h6><span class="name">Workout ${String.fromCharCode(num_workouts + 65)}</span> &ensp;<i class="fas fa-times remove-workout-btn"></i></h6> 
                    <div class="exercise">
                        <i class="fas fa-times remove-exercise-btn"></i>&ensp;<label for="exercise-entry">Exercise 1:</label>
                        <input type="text" class="form-control exercise-entry" placeholder="ex: Squat">
                        <input type="number" class="form-control exercise-sets-entry" placeholder="3" min="1" max="999">
                        x
                        <input type="number" class="form-control exercise-reps-entry" placeholder="5" min="1" max="999"> <br>
                    </div>
                    <div class="exercise">
                        <i class="fas fa-times remove-exercise-btn"></i>&ensp;<label for="exercise-entry">Exercise 2:</label>
                        <input type="text" class="form-control exercise-entry" placeholder="ex: Deadlift">
                        <input type="number" class="form-control exercise-sets-entry" placeholder="3" min="1" max="999">
                        x
                        <input type="number" class="form-control exercise-reps-entry" placeholder="5" min="1" max="999"> <br>
                    </div>
                   
                    <div class="exercise">
                        <i class="fas fa-times remove-exercise-btn"></i>&ensp;<label for="exercise-entry">Exercise 3:</label>
                        <input type="text" class="form-control exercise-entry" placeholder="ex: Leg Press">
                        <input type="number" class="form-control exercise-sets-entry" placeholder="8" min="1" max="999">
                        x
                        <input type="number" class="form-control exercise-reps-entry" placeholder="12" min="1" max="999"> <br>
                    </div>
                    <p class="add-exercise-btn">Add exercise<p>
                </div>`;
    }

    function generateExerciseForm(num_exercises) {
        return `<div class="exercise">
                    <i class="fas fa-times remove-exercise-btn"></i>&ensp;<label for="exercise-entry">Exercise ${num_exercises + 1}:</label>
                    <input type="text" class="form-control exercise-entry" placeholder="ex: More Squats">
                    <input type="number" class="form-control exercise-sets-entry" placeholder="3" min="1" max="999">
                    x
                    <input type="number" class="form-control exercise-reps-entry" placeholder="5" min="1" max="999"> <br>
                </div>`;
    }

    $("#add-workout-btn").click(function() {
        $(generateWorkoutForm()).insertBefore($(this));
        page.scrollTop(page[0].scrollHeight);
    });

    form.on("click", ".remove-workout-btn", function() {
        const num_workouts = form.find(".workout-form-group").length;
        if(num_workouts === 1) {
            alert.text("You must have at least one workout in a routine");
            showAlert();
            return;
        }
        $(this).parent().parent().remove();
        
        const remainingWorkouts = form.find(".workout-form-group");
        for(let i = 0; i < remainingWorkouts.length; ++i) {
            $(remainingWorkouts[i]).find(".name").text(`Workout ${String.fromCharCode(i + 65)}`);
        }
    });

    form.on("click", ".add-exercise-btn", function() {
        $(generateExerciseForm($(this).parent().find(".exercise").length)).insertBefore($(this));
        $(this).parent().scrollTop($(this).parent()[0].scrollHeight);
    });

    form.on("click", ".remove-exercise-btn", function() {
        const workout = $(this).parent().parent();
        const num_exercises = workout.find(".exercise").length;
        if(num_exercises === 1) {
            alert.text("You must have at least one exercise in a workout");
            showAlert();
            return;
        }
        $(this).parent().remove();
        const remainingExercises = workout.find(".exercise");
        for(let i = 0; i < remainingExercises.length; ++i) {
            $(remainingExercises[i]).find("label").text(`Exercise ${i + 1}:`);
        }
    });

    form.on("click", ".name", function() {
        if(currentEdit !== null) {
            hideNameEdit();
        }
        const input = $(this).parent().siblings(".name-edit");
        $(this).parent().addClass("hidden");
        input.removeClass("hidden");
        input.val($(this).text().trim());
        input.select();
        currentEdit = input;
        currentName = $(this);
    });

    function hideNameEdit() {
        currentEdit.addClass("hidden");
        currentName.parent().removeClass("hidden");
        currentEdit = null;
        currentName = null;
    }
    
    form.on("keydown", ".name-edit", function(e) {
        if(e.keyCode === 13) {
            if(currentEdit.val().trim() !== "") {
                currentName.text(currentEdit.val().trim());
                hideNameEdit();
            }
            else {
                hideNameEdit();
            }
        }
        else if(e.keyCode === 27) {
            hideNameEdit();
        }
    });

    $(window).keydown(function(e) {
        if(e.keyCode === 13)
            e.preventDefault();
    });
    
    $("body").click(function(e) {
        if(currentEdit !== null) {
            if(!$(e.target).is(currentEdit) && !$(e.target).is(currentName)) {
                hideNameEdit();
            }
        }
    });

    function collectFormData() {
        let data = {};
            const workouts = form.find(".workout-form-group");
            for(let i = 0; i < workouts.length; ++i) {
                const workoutName = $(workouts[i]).find(".name").text().trim();
                data[workoutName] = {};
                const exercises = $(workouts[i]).find(".exercise");
                for(let j = 0; j < exercises.length; ++j) {
                    const exerciseName = $(exercises[j]).find(".exercise-entry").val().trim();
                    const sets = $(exercises[j]).find(".exercise-sets-entry").val();
                    const reps = $(exercises[j]).find(".exercise-reps-entry").val();
                    if(exerciseName === "" || sets === "" || reps === "") {
                        alert.text("One or more fields left blank");
                        showAlert();
                        return;
                    }
                    data[workoutName][exerciseName] = {sets, reps};
                }
            }
        return data;
    }

    form.on("submit", function(e) {
        e.preventDefault();
        const name = $("#routine-name-entry").val();
        if(name.trim() === "") {
            alert.text("Please enter a valid routine name");
            showAlert();
        }
        else {
            const data = collectFormData();
            createRoutine(name.trim(), JSON.stringify(data)).then(function(response) {
                console.log(response);
            }).catch(function(thrown) {
                console.log(thrown);
            });
        }
    });
});