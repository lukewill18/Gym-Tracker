$(function() {
    $("#add-routine-btn").click(function() {
        window.location.pathname = "/routines/ID/edit";
    }); 

    $("body").on("click", ".edit-routine-btn", function() {
        window.location.pathname = "/routines/ID/edit";
    });

    $("body").on("click", ".log-workout-btn", function() {
        window.location.pathname = "/routines/ID/workout";
    });
});