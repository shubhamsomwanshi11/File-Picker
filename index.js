// Google Drive
let oauthToken;

function loadGooglePicker() {
    gapi.load('picker', { 'callback': onPickerApiLoad });
    handleAuth();
}

function handleAuth() {
    google.accounts.oauth2.initTokenClient({
        client_id: '944264633626-iso2nbknigo5h6rmm3dr6pcmmgj1tdmt.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
            if (response && response.access_token) {
                oauthToken = response.access_token;
                createPicker();
            } else {
                console.error('Error during authorization', response);
            }
        },
    }).requestAccessToken();
}

function onPickerApiLoad() {
    if (oauthToken) {
        createPicker();
    }
}

function createPicker() {
    if (oauthToken) {
        const picker = new google.picker.PickerBuilder()
            .addView(google.picker.ViewId.DOCS)
            .setOAuthToken(oauthToken)
            .setDeveloperKey('AIzaSyBzeDKSf36y7LKi3x_KhgsjrNG_0ah3bow')
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    }
}

function pickerCallback(data) {
    if (data.action === google.picker.Action.PICKED) {
        const file = data.docs[0];
        console.log(file);
        let output = document.getElementById('file');
        output.innerHTML = `Selected file: <a href="https://drive.google.com/file/d/${file.id}/view" target="_blank">${file.name}</a>`;
    }
}

function chooseFromGoogleDrive() {
    // loadGooglePicker();
    alert("Work is going on...")
}