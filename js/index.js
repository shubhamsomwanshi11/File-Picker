let oauthToken;

function loadGooglePicker() {
    gapi.load('picker', { 'callback': onPickerApiLoad });
    if (!oauthToken) handleAuth();
}

function handleAuth() {
    google.accounts.oauth2.initTokenClient({
        client_id: '944264633626-iso2nbknigo5h6rmm3dr6pcmmgj1tdmt.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
            if (response && response.access_token) {
                oauthToken = response.access_token;
                createPicker();
                console.log(oauthToken);
            } else {
                console.error('Error during authorization', response);
            }
        },
    }).requestAccessToken();
}

function onPickerApiLoad() {
    if (oauthToken) {
        console.log(oauthToken);
        
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
                return response.arrayBuffer(); // Get the content as ArrayBuffer for PDFs
            } else {
                throw new Error('Unsupported file type');
            }
        })
        .then(content => {
            if (fileType === 'application/pdf') {
                extractTextFromPDF(content); // Extract text from the PDF ArrayBuffer
            } else {
                fileContentElem.value = content; // Display text, JSON, CSV content in the textarea
            }
        })
        .catch(error => {
            console.error('Error loading file content', error);
            fileContentElem.value = 'Error loading file content.';
        });
}

function extractTextFromPDF(pdfData) {
    const fileContentElem = document.getElementById('file-output');
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });

    loadingTask.promise.then(function (pdf) {
        let textContent = '';

        // Loop through all pages to extract text
        const maxPages = pdf.numPages;
        let countPromises = []; // Store all page text extraction promises

        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            let page = pdf.getPage(pageNum);

            countPromises.push(
                page.then(function (page) {
                    return page.getTextContent().then(function (textContentObj) {
                        let pageText = textContentObj.items.map(item => item.str).join(' ');
                        textContent += pageText + '\n'; // Add page text with newline
                    });
                })
            );
        }

        // Wait for all pages to be processed
        Promise.all(countPromises).then(function () {
            fileContentElem.value = textContent; // Show the extracted PDF text in the textarea
        });
    }).catch(function (error) {
        console.error('Error extracting PDF text:', error);
        fileContentElem.value = 'Error extracting text from PDF.';
    });
}

// Open google Picker
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('gdrive').addEventListener('click', loadGooglePicker);
});