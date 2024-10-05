let oauthToken;

function loadGooglePicker() {
    gapi.load('picker', { 'callback': onPickerApiLoad });
    if(!oauthToken) handleAuth();
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
        const fileId = file.id;
        const fileType = file.mimeType;
        getFileContent(fileId, fileType);
    }
}

function getFileContent(fileId, fileType) {
    const fileContentElem = document.getElementById('file-output');

    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
            'Authorization': `Bearer ${oauthToken}`
        }
    })
    .then(response => {
        if (fileType.includes('text') || fileType.includes('json') || fileType.includes('csv')) {
            return response.text();
        } else if (fileType === 'application/pdf') {
            return response.blob();
        } else {
            throw new Error('Unsupported file type');
        }
    })
    .then(content => {
        if (fileType === 'application/pdf') {
            console.log(content);
            const url = URL.createObjectURL(content);
            renderPDF(url);
        } else {
            fileContentElem.value = content; 
        }
    })
    .catch(error => {
        console.error('Error loading file content', error);
        fileContentElem.value = 'Error loading file content.';
    });
}

function renderPDF(pdfUrl) {
    console.log(pdfUrl);
    
    const canvas = document.getElementById('pdfCanvas');
    const ctx = canvas.getContext('2d');

    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise.then(function(pdf) {
        // Fetch the first page
        return pdf.getPage(1).then(function(page) {
            const viewport = page.getViewport({ scale: 1.5 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into the canvas context
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            page.render(renderContext);
        });
    }).catch(function(error) {
        console.error('Error rendering PDF:', error);
    });
}

function chooseFromGoogleDrive() {
    loadGooglePicker();
}
