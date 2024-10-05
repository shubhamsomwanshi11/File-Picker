
// Onedrive
function chooseFromOneDrive() {
    var odOptions = {
        clientId: "ONEDRIVE_CLIENT_ID",
        action: "share", // or "download"
        multiSelect: false,
        advanced: {
            redirectUri: "https://your-redirect-uri.com"
        },
        success: function (files) {
            let output = document.getElementById('file-output');
            output.innerHTML = `Selected file: <a href="${files.value[0].shareUrl}" target="_blank">${files.value[0].name}</a>`;
        },
        cancel: function () {
            console.log('File selection cancelled');
        },
        error: function (e) {
            console.log(e);
        }
    };
    // OneDrive.open(odOptions);
    alert("Coming soon..");
}