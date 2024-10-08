document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('clear').addEventListener('click', clearContent);
});

function clearContent() {
    document.getElementById('file-output').value = '';
    document.getElementById('fileName').value = '';
}