function logWorkout(routineId, workoutId, data) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/routines/" + routineId.toString() + "/workout",
            method: "POST",
            data: {workoutId, data},
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
    const accordions = $(".workout-accordion");
    let currentAccordion = $(accordions[0]);
    $(accordions[0]).removeClass("hidden");
    $(currentAccordion.find(".collapse")[0]).addClass("show");

    $(".workout-btn").click(function() {
        currentAccordion.addClass("hidden");
        currentAccordion = $(`.workout-accordion[data-id=${$(this).attr("data-id")}]`);
        currentAccordion.removeClass("hidden");
        $(currentAccordion.find(".collapse")[0]).addClass("show");
    });

    $(".rep-entry").on("keyup", function(e) {
        if(parseInt($(this).val()) === 0) {
            $(this).siblings(".weight-entry").val("0");
        }
    });

    $("#finish-workout-btn").click(function() {
        const exercises = currentAccordion.find(".exercise");
        let data = {};
        for(let i = 0; i < exercises.length; ++i) {
            const jq = $(exercises[i]);
            data[jq.attr("data-id")] = [];

            const sets = jq.find(".set");
            for(let j = 0; j < sets.length; ++j) {
                const reps = $($(sets[j]).find(".rep-entry")).val();
                const weight = $($(sets[j]).find(".weight-entry")).val();
                if(reps.trim() === "" || weight.trim() === "") {
                    data[jq.attr("data-id")].push({reps: 0, weight: 0});
                }
                else {
                    data[jq.attr("data-id")].push({reps: parseInt(reps.trim()), weight: parseInt(weight.trim())});
                }
            }
        }
        logWorkout($("#workout-page").attr("data-id"), currentAccordion.attr("data-id"), JSON.stringify(data)).then(function(response) {
            window.location.pathname = "/routines/" + $("#workout-page").attr("data-id").toString() + "/progress";
        });
    });

});