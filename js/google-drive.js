let oauthToken;
var isPicker = false;
function loadGooglePicker() {
    isPicker = true;
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
                if (isPicker) createPicker();
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
        document.getElementById('loading').style.display = 'block';
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
            if (fileType.includes('text') || fileType.includes('json') ||
                fileType.includes('csv') ||
                fileType.includes('javascript') ||
                fileType.includes('css') ||
                fileType.includes('python') ||
                fileType.includes('java') ||
                fileType.includes('cpp') ||
                fileType.includes('text/x-csharp') ||
                fileType.includes('text/x-go') ||
                fileType.includes('text/x-kotlin') ||
                fileType.includes('text/x-ruby') ||
                fileType.includes('text/x-perl') ||
                fileType.includes('text/x-php') ||
                fileType.includes('text/x-sql') ||
                fileType.includes('text/x-swift') ||
                fileType.includes('application/xml') ||
                fileType.includes('application/x-sh') ||
                fileType.includes('text/x-rustsrc') ||
                fileType.includes('text/x-scala') ||
                fileType.includes('text/x-typescript') ||
                fileType.includes('text/x-haskell') ||
                fileType.includes('application/x-httpd-php') ||
                fileType.includes('text/x-markdown') ||
                fileType.includes('application/x-lua') ||
                fileType.includes('application/x-tcl') ||
                fileType.includes('application/x-r') ||
                fileType.includes('application/x-ruby') ||
                fileType.includes('text/x-matlab')
            ) {
                return response.text(); // Get content as text
            } else if (fileType === 'application/pdf') {
                return response.arrayBuffer(); // PDF as ArrayBuffer
            } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                return response.blob(); // MS Word .docx as Blob
            } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                return response.arrayBuffer(); // Excel .xlsx as ArrayBuffer
            } else if (fileType === 'application/vnd.google-apps.document') {
                return response.text(); // Google Docs as plain text
            } else {
                throw new Error('Unsupported file type');
            }
        })
        .then(content => {
            if (fileType === 'application/pdf') {
                extractTextFromPDF(content); // Extract text from the PDF ArrayBuffer
            } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                extractTextFromDocx(content); // Word .docx text extraction
            } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                extractTextFromExcel(content); // Excel .xlsx text extraction
            } else {
                fileContentElem.value = content; // Display text, JSON, CSV, Google Docs in textarea
            }
        })
        .catch(error => {
            console.error('Error loading file content', error);
            fileContentElem.value = 'Error loading file content.';
        })
        .finally(() => {
            // Hide loader after file content is processed
            document.getElementById('loading').style.display = 'none';
        });

}

// Open google Picker
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('gdrive').addEventListener('click', loadGooglePicker);
    document.getElementById('gdrivesave').addEventListener('click', savetoGoogleDrive);
});


// Function to extract text from PDF
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

// Function to extract text from MS Word (.docx) files using mammoth.js
function extractTextFromDocx(blob) {
    const fileContentElem = document.getElementById('file-output');
    mammoth.extractRawText({ blob: blob })
        .then(function (result) {
            fileContentElem.value = result.value;
        })
        .catch(function (error) {
            console.error('Error extracting Word document text:', error);
            fileContentElem.value = 'Error extracting text from Word document.';
        });
}

// Function to extract text from Excel (.xlsx) files using xlsx.js
function extractTextFromExcel(arrayBuffer) {
    const fileContentElem = document.getElementById('file-output');
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let textContent = '';

    workbook.SheetNames.forEach(function (sheetName) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        textContent += `Sheet: ${sheetName}\n${csv}\n\n`;
    });

    fileContentElem.value = textContent;
}


function savetoGoogleDrive() {
    if (!oauthToken) {
        handleAuth();
    }
    const textArea = document.getElementById('file-output');
    const fileName = document.getElementById('fileName');
    if (textArea.value) {
        if (fileName.value) {
            document.getElementById('loading').style.display = 'block';
            // Convert the textarea content to a Blob
            const fileContent = textArea.value;
            const fileBlob = new Blob([fileContent], { type: 'text/plain' });

            // Define metadata for the file
            const metadata = {
                name: fileName.value, // File name on Google Drive
                mimeType: 'text/plain' // Mime type of the file
            };

            // Create the multipart/related body
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', fileBlob);

            // Use the Google Drive API to upload the file
            fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({
                    'Authorization': `Bearer ${oauthToken}`
                }),
                body: form
            })
                .then(response => response.json())
                .then(result => {
                    if (result.id) {
                        alert(`File saved to Drive successfully!`);
                        if (confirm("Do you want to clear the text from TextBox ?")) {
                            clearContent();
                        }
                    } else {
                        alert('Error during file upload.');
                    }
                })
                .catch(error => {
                    console.error('Error uploading file:', error);
                    alert('Error during file upload.');
                })
                .finally(() => {
                    document.getElementById('loading').style.display = 'none';
                });
        }
        else {
            alert("Please enter FileName.");
        }
    } else {
        alert("Please enter text in the textarea to save.");
    }
}