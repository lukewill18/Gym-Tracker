$(function() {
    $("#add-routine-btn").click(function() {
        window.location.pathname = "/routines/new";
    }); 

    $("body").on("click", ".edit-routine-btn", function() {
        window.location.pathname = "/routines/" + $(this).parent().attr("data-id").toString() + "/edit";
    });

    $("body").on("click", ".log-workout-btn", function() {
        window.location.pathname = "/routines/" + $(this).parent().attr("data-id").toString() + "/workout";
    });
});