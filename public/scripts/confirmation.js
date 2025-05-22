//Leaving Confirmation Logic
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#thread-form, #post-form, #edit-post-form');
    if (!form) return;

    window.isFormDirty = false;

    if (window.tinymce) {
        tinymce.init({
            selector: '#content',
            setup: function (editor) {
                editor.on('change input keyup', function () {
                    window.isFormDirty = true;
                });
            }
        });
    }

    let pendingHref = null;



    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            window.isFormDirty = true;
        });
    });

    form.addEventListener('submit', () => {
        window.isFormDirty = false;
    });

    const leaveModal = new bootstrap.Modal(document.getElementById('leaveModal'));
    const confirmLeaveBtn = document.getElementById('confirmLeave');

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function (e) {
            if (window.isFormDirty && !link.closest('form')) {
                e.preventDefault();
                pendingHref = this.href;
                leaveModal.show();
            }
        });
    });

    confirmLeaveBtn.addEventListener('click', () => {
        leaveModal.hide();
        if (pendingHref) {
            window.location.href = pendingHref;
        }
    });
});