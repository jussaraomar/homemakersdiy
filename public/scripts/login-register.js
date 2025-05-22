// Login and Register Contraints 
document.querySelector('#register-form').addEventListener('submit', function (e) {
    const username = document.getElementById('username');
    const password = document.getElementById('password');

    let valid = true;
    if (username.value.length < 4) {
        username.setCustomValidity('Username must be at least 4 characters.');
        valid = false;
    } else {
        username.setCustomValidity('');
    }

    const passRegex = /(?=.*\d).{6,}/;
    if (!passRegex.test(password.value)) {
        password.setCustomValidity('Password must be at least 6 characters and include a number.');
        valid = false;
    } else {
        password.setCustomValidity('');
    }

    if (!valid) {
        e.preventDefault();
        this.reportValidity();
    }
});