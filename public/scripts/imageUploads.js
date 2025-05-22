document.getElementById('thumbnail').addEventListener('change', function () {
    const file = this.files[0];
    const errorMsg = document.getElementById('file-error');

    if (file && file.size > 3 * 1024 * 1024) { // 3MB
        errorMsg.textContent = "File is too large. Maximum allowed size is 3MB.";
        this.value = ""; // Clear the file input
    } else {
        errorMsg.textContent = "";
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('newPfp');
    const errorMsg = document.getElementById('file-error');

    if (input) {
        input.addEventListener('change', function () {
            const file = this.files[0];
            if (file && file.size > 2 * 1024 * 1024) {
                errorMsg.textContent = "File is too large. Maximum allowed size is 3MB.";
                this.value = "";
            } else {
                errorMsg.textContent = "";
            }
        });
    }
});
