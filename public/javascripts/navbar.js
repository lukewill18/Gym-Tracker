$(function() {
    const body = $("body");
    const friendsBtn = $("#friends-btn");
    const friends = $("#friends");
    const notificationsBtn = $("#notifications-btn");
    const notifications = $("#notifications");

    function movePopup(btn, popup) {
        if(body.innerWidth() - btn.offset().left >= popup.innerWidth() + 5) {
            popup.offset({top: popup.offset().top, left: btn.offset().left});
        }
        else {
            popup.css({'top': 'auto', 'left': '0', 'right': '0'});
        }
    }

    $(friendsBtn).click(function() {
        friends.toggleClass("hidden");
        if(!friends.hasClass("hidden"))
            movePopup(friendsBtn, friends);
    });

    $(notificationsBtn).click(function() {
        notifications.toggleClass("hidden");
        if(!notifications.hasClass("hidden"))
            movePopup(notificationsBtn, notifications);
    });

    $(window).on("resize", function() {
        if(!friends.hasClass("hidden")) {
            movePopup(friendsBtn, friends);
        }
        else if(!notifications.hasClass("hidden")) {
            movePopup(notificationsBtn, notifications);
        }
    });

    body.click(function(e) {
        if(!$(e.target).is(friends) && !$(e.target).parent().is(friends) && !$(e.target).is(friendsBtn)) {
            friends.addClass("hidden");
        }
        if(!$(e.target).is(notifications) && !$(e.target).parent().is(notifications) && !$(e.target).is(notificationsBtn)) {
            notifications.addClass("hidden");
        }
    });

    $("#logout-btn").click(function() {
        window.location.pathname = "";
    });

    $(".navbar-brand").click(function() {
        window.location.pathname = "home";
    });
});