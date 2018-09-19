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

$(function() {
    const loginForm = $("#login-form");
    const logEmailEntry = loginForm.find("#login-email-entry");
    const logPassEntry = loginForm.find("#login-password-entry");
    const registerForm = $("#register-form");
    const regFirstEntry = registerForm.find("#first-name-entry");
    const regLastEntry = registerForm.find("#last-name-entry");
    const regEmailEntry = registerForm.find("#register-email-entry");
    const regPassEntry = registerForm.find("#register-password-entry");

    loginForm.on("submit", function(e) {
        e.preventDefault();
        const email = logEmailEntry.val();
        const pass = logPassEntry.val();
        if(email.trim() === "" || pass.trim() === "") {
            
        }
        else {
            login(email.trim(), pass.trim()).then(function(response) {
                window.location.pathname = "home/";
            }).catch(function(thrown) {

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

        }
        else {
            register(first.trim(), last.trim(), email.trim(), pass.trim()).then(function(response) {
                window.location.pathname = "home/";
            }).catch(function(thrown) {
                
            });
        }
    });
});