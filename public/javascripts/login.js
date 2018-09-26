function login(email, password) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/users/login",
            method: "POST",
            data: {email, password},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function register(firstName, lastName, email, password) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/users/register",
            method: "POST",
            data: {firstName, lastName, email, password},
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
    const loginForm = $("#login-form");
    const logEmailEntry = loginForm.find("#login-email-entry");
    const logPassEntry = loginForm.find("#login-password-entry");
    const registerForm = $("#register-form");
    const regFirstEntry = registerForm.find("#first-name-entry");
    const regLastEntry = registerForm.find("#last-name-entry");
    const regEmailEntry = registerForm.find("#register-email-entry");
    const regPassEntry = registerForm.find("#register-password-entry");
    const alert = $(".alert");

    loginForm.on("submit", function(e) {
        e.preventDefault();
        const email = logEmailEntry.val();
        const pass = logPassEntry.val();
        if(email.trim() === "" || pass.trim() === "") {
            alert.text("One or more fields left blank");
            showAlert(alert);
        }
        else {
            login(email.trim(), pass.trim()).then(function(response) {
                window.location.pathname = "home/";
            }).catch(function(thrown) {
                console.log(thrown);
                alert.text(thrown.responseJSON.error);
                showAlert(alert);
            });
        }
    });

    registerForm.on("submit", function(e) {
        e.preventDefault();
        const first = regFirstEntry.val();
        const last = regLastEntry.val();
        const email = regEmailEntry.val();
        const pass = regPassEntry.val();
        if(first.trim() === "" || last.trim() === "" || email.trim() === "" || pass.trim() === "") {
            alert.text("One or more fields left blank");
            showAlert(alert);
        }
        else {
            register(first.trim(), last.trim(), email.trim(), pass.trim()).then(function(response) {
                window.location.pathname = "home/";
            }).catch(function(thrown) {
                alert.text(thrown.responseJSON.error);
                showAlert(alert);
            });
        }
    });
});