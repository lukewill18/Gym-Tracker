$(function() {
    const contestsBtn = $("#contests-btn");
    const routinesBtn = $("#routines-btn");

    contestsBtn.click(function() {
        window.location.pathname = "contests/";
    });

    routinesBtn.click(function() {
        window.location.pathname = "routines/";
    });
});