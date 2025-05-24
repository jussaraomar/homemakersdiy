document.addEventListener('DOMContentLoaded', function () {
    const thumbnailInput = document.getElementById('thumbnail');
    const thumbnailError = document.getElementById('thumbnail-error');
    if (thumbnailInput) {
        thumbnailInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file && file.size > 3 * 1024 * 1024) {
                thumbnailError.textContent = "File is too large. Maximum allowed size is 3MB.";
                this.value = "";
            } else {
                thumbnailError.textContent = "";
            }
        });
    }

    const pfpInput = document.getElementById('newPfp');
    const pfpError = document.getElementById('pfp-error');
    if (pfpInput) {
        pfpInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file && file.size > 3 * 1024 * 1024) {
                pfpError.textContent = "File is too large. Maximum allowed size is 3MB.";
                this.value = "";
            } else {
                pfpError.textContent = "";
            }
        });
    }

    const reviewInput = document.getElementById('review-image');
    const reviewError = document.getElementById('review-error');
    if (reviewInput) {
        reviewInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file && file.size > 3 * 1024 * 1024) {
                reviewError.textContent = "File is too large. Maximum allowed size is 3MB.";
                this.value = "";
            } else {
                reviewError.textContent = "";
            }
        });
    }
});


// document.getElementById('thumbnail').addEventListener('change', function () {
//     const file = this.files[0];
//     const errorMsg = document.getElementById('file-error');

//     if (file && file.size > 3 * 1024 * 1024) { // 3MB
//         errorMsg.textContent = "File is too large. Maximum allowed size is 3MB.";
//         this.value = ""; // Clear the file input
//     } else {
//         errorMsg.textContent = "";
//     }
// });


// document.addEventListener('DOMContentLoaded', function () {
//     const input = document.getElementById('newPfp');
//     const errorMsg = document.getElementById('file-error');

//     if (input) {
//         input.addEventListener('change', function () {
//             const file = this.files[0];
//             if (file && file.size > 3 * 1024 * 1024) {
//                 errorMsg.textContent = "File is too large. Maximum allowed size is 3MB.";
//                 this.value = "";
//             } else {
//                 errorMsg.textContent = "";
//             }
//         });
//     }
// });

// document.addEventListener('DOMContentLoaded', function () {
//     const input = document.getElementById('review-image');
//     const errorMsg = document.getElementById('file-error');

//     if (input) {
//         input.addEventListener('change', function () {
//             const file = this.files[0];
//             if (file && file.size > 3 * 1024 * 1024) {
//                 errorMsg.textContent = "File is too large. Maximum allowed size is 3MB.";
//                 this.value = "";
//             } else {
//                 errorMsg.textContent = "";
//             }
//         });
//     }
// });
