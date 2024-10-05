let oauthToken;

// Load Google Picker API
function loadGooglePicker() {
    gapi.load('picker', { 'callback': onPickerApiLoad });
    handleAuth();
}

// Handle OAuth authentication
function handleAuth() {
    const tokenClient = google.accounts.oauth2.initTokenClient({
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
    });
    tokenClient.requestAccessToken();
}

// Load Picker API and create picker
function onPickerApiLoad() {
    if (oauthToken) {
        createPicker();
    }
}

// Create Google Picker
function createPicker() {
    if (oauthToken) {
        const picker = new google.picker.PickerBuilder()
            .addView(google.picker.ViewId.DOCS)  // Allow selection of files
            .setOAuthToken(oauthToken)
            .setDeveloperKey('AIzaSyBzeDKSf36y7LKi3x_KhgsjrNG_0ah3bow')
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    }
}

// Callback when file is picked
function pickerCallback(data) {
    if (data.action === google.picker.Action.PICKED) {
        const file = data.docs[0];
        const fileId = file.id;
        const mimeType = file.mimeType;
        handleFileSelection(fileId, mimeType);  // Handle the file content display based on type
    }
}

// Handle file content based on file type
function handleFileSelection(fileId, mimeType) {
    if (mimeType === 'text/plain') {
        getFileContent(fileId, displayTextFile); // For plain text files
    } else if (mimeType === 'application/pdf') {
        getPDFContent(fileId);  // For PDF files
    } else {
        alert("File type not supported for preview.");
    }
}

// Fetch file content from Google Drive
function getFileContent(fileId, callback) {
    gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
    }).then(function (response) {
        callback(response.body);  // Pass the file content to the callback
    });
}

// Fetch PDF content and display it in textarea using pdf.js
function getPDFContent(fileId) {
    // First, get the file metadata to obtain download URL
    try {
        gapi.client.drive.files.get({
            fileId: fileId,
            fields: 'id, name, mimeType, webContentLink'
        }).then(function (response) {
            const downloadUrl = response.result.webContentLink;
            if (downloadUrl) {
                fetch(downloadUrl, {
                    headers: { Authorization: 'Bearer ' + oauthToken }
                })
                    .then(res => res.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            const arrayBuffer = e.target.result;
                            const pdfjsLib = window['pdfjsLib'];
                            pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(function (pdf) {
                                let output = '';
                                for (let i = 1; i <= pdf.numPages; i++) {
                                    pdf.getPage(i).then(function (page) {
                                        page.getTextContent().then(function (textContent) {
                                            textContent.items.forEach(function (item) {
                                                output += item.str + ' ';
                                            });
                                            document.getElementById('file-output').value = output;
                                        });
                                    });
                                }
                            });
                        };
                        reader.readAsArrayBuffer(blob);
                    });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

// Display plain text file content in textarea
function displayTextFile(content) {
    document.getElementById('file-output').value = content;
}

// Trigger file selection from Google Drive
function chooseFromGoogleDrive() {
    loadGooglePicker();
}