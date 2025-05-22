document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', () => {
            document.getElementById('loading-overlay').style.display = 'flex';
        });
    }
});