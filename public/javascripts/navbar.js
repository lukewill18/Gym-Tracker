function getAllFriends() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/users/friends",
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function findUsersWithName(search, exclude) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/users/search?name=" + search.toString() + "&exclude=" + exclude.join(","),
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function sendFriendRequest(id) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/invitations/friend/",
            method: "POST",
            data: {id},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function getInvitations() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/invitations/",
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function ignoreInvitation(id) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/invitations/",
            method: "DELETE",
            data: {id},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function acceptFriendRequest(inviterID) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/users/friend",
            method: "POST",
            data: {inviterID},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function joinContest(id) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/contests/users",
            method: "PATCH",
            data: {id},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function showAlert(alert) {
    alert.css("opacity", "1");
    alert.css("z-index", "999999");
    setTimeout(function() {
        alert.css("opacity", "0");
        alert.css("z-index", "0");
    }, 3000);
}

$(function() {
    const body = $("body");
    const friendsBtn = $("#friends-btn");
    const friends = $("#friends");
    const friendsList = friends.find("#friends-list");
    const friendSearch = friends.find("#friend-search");
    const userResults = friends.find("#user-results");
    const notificationsBtn = $("#notifications-btn");
    const notifications = $("#notifications");
    let all_friends = [];
    
    function movePopup(btn, popup) {
        if(body.innerWidth() - btn.offset().left >= popup.innerWidth() + 5) {
            popup.offset({top: popup.offset().top, left: btn.offset().left});
        }
        else {
            popup.css({'top': 'auto', 'left': '0', 'right': '0'});
        }
    }

    $(friendsBtn).click(function() {
        friendsList.children(".friend").remove();
        getAllFriends().then(function(response) {
            all_friends = response.map(function(f) {
                return f.id.toString();
            });
            let temp = ``;
            for(let i = 0; i < response.length; ++i) {
                temp += `<li class="friend" data-id=${response[i].id}>${response[i].name}`;
                if(response[i].pending)
                    temp += ` (pending)`;
                temp += `</li>`;
            }
            friendsList.append(temp);
            friends.toggleClass("hidden");
            friendSearch.val("");
            userResults.children(".user-result").remove();
            if(!friends.hasClass("hidden"))
                movePopup(friendsBtn, friends);
        });
        
    });

    function displayInvitations(response) {
        notifications.children(".notification").remove();   
        let temp = ``;
        for(let i = 0; i < response.length; ++i) {
            if(response[i].type === "friend") {
                temp += `<div class="friend-request notification" data-id=${response[i].id} data-inviter-id=${response[i].inviterID}>${response[i].name} wants to be your friend!<br>
                            <button class="ignore-btn btn btn-secondary">Ignore</button><button class="accept-btn btn btn-info">Accept</button>
                        </div>`;
            }
            else if(response[i].type === "contest") {
                temp += `<div class="contest-invite notification" data-id=${response[i].id} data-contest-id=${response[i].contestID}>${response[i].name} has invited you to a contest: ${response[i].contestName}<br>
                            <button class="ignore-btn btn btn-secondary">Ignore</button><button class="accept-btn btn btn-info">Accept</button>
                        </div>`;
            }
        }
        notifications.append(temp);
    }

    $(notificationsBtn).click(function() {
        notifications.toggleClass("hidden");
        if(!notifications.hasClass("hidden")) {
            movePopup(notificationsBtn, notifications);
            getInvitations().then(function(response) {
                displayInvitations(response);
            });
        }
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
        if(!$(e.target).is(friends) && !$(e.target).parent().is(friends) && !$(e.target).parent().parent().is(friends) && !$(e.target).is(friendsBtn)) {
            friends.addClass("hidden");
        }
        if(!$(e.target).is(notifications) && !$(e.target).parent().is(notifications) && !$(e.target).parent().parent().is(notifications) && !$(e.target).is(notificationsBtn)) {
            notifications.addClass("hidden");
        }
    });

    $("#logout-btn").click(function() {
        window.location.pathname = "";
    });

    $(".navbar-brand").click(function() {
        window.location.pathname = "home";
    });
    
    function displayMatchingUsers(users) {
        userResults.find(".user-result").remove();
        if(users.length === 0) {
            userResults.addClass("hidden");
        }
        else {
            userResults.removeClass("hidden");
            let temp = ``;
            for(let i = 0; i < users.length; ++i) {
                temp += `<li class="user-result" data-id=${users[i].id}>${users[i].name}</li>`;
            }
            userResults.append(temp);   
        }
    }

    friendSearch.keyup(function() {
        const search = $(this).val();
        if(search.trim() === "")
            userResults.find(".user-result").remove();
        else {
            findUsersWithName(search, all_friends).then(function(users) {
                displayMatchingUsers(users);
            });
        }
    });

    friends.on("click", ".user-result", function() {
        const result = $(this);
        const id = result.attr("data-id");
        const name = result.text();
        sendFriendRequest(id).then(function() {
            result.remove();
            all_friends.push(id.toString());
            friendsList.append(`<li class="friend" data-id=${id}>${name} (pending)</li>`);
            
        });
    });

    notifications.on("click", ".accept-btn", function() {
        const invite = $(this).parent();
        if(invite.hasClass("friend-request")) {
            acceptFriendRequest(invite.attr("data-inviter-id")).then(function() {
                invite.remove();
            });
        }
        else if(invite.hasClass("contest-invite")) {
            joinContest(invite.attr("data-contest-id")).then(function() {
                invite.remove();
            });
        }
    });

    notifications.on("click", ".ignore-btn", function() {
        const invite = $(this).parent();
        ignoreInvitation(invite.attr("data-id")).then(function() {
            invite.remove();
        });
    });

});