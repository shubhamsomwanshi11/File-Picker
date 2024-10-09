function chooseFromDropbox() {
    Dropbox.choose({
        success: function (files) {
            const file = files[0];
            const fileLink = file.link;
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();

            let output = document.getElementById('file-output');
            output.value = `Selected file: ${fileName}`;

            if (fileExtension === 'txt') {
                fetch(fileLink)
                    .then(response => response.text())
                    .then(content => {
                        output.value = content;
                    });
            } else if (fileExtension === 'pdf') {
                displayPDF(fileLink);
            } else if (fileExtension === 'doc' || fileExtension === 'docx') {
                output.value = "Preview of DOC/DOCX not supported. You can download and view it.";
            } else {
                output.value = "File preview not supported for this type.";
            }
        },
        cancel: function () {
            console.log('File selection cancelled');
        },
        linkType: "direct", // or "preview" to get a non-direct link
        multiselect: false, // allow multiple file selections
        extensions: ['.pdf', '.doc', '.docx', '.txt', '.json', '.csv', '.xls', '.xlsx', '.jpg', '.png']
    });
}

// Function to display PDF using pdf.js
function displayPDF(url) {
    const loader = document.getElementById('loading');
    const textarea = document.getElementById('file-output');
    textarea.value = ''; // Clear the textarea before loading
    loader.style.display = 'block'; // Show the loader before processing starts

    fetch(url)
        .then(res => res.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const arrayBuffer = e.target.result;
                const pdfjsLib = window['pdfjsLib'];

                pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(function (pdf) {
                    let output = '';
                    const totalPages = pdf.numPages;
                    let pagesProcessed = 0;

                    // Process each page
                    for (let i = 1; i <= totalPages; i++) {
                        pdf.getPage(i).then(function (page) {
                            page.getTextContent().then(function (textContent) {
                                textContent.items.forEach(function (item) {
                                    output += item.str + ' ';
                                });

                                textarea.value = output; // Update textarea as pages are processed
                                pagesProcessed++;

                                // Hide loader only after all pages are processed
                                if (pagesProcessed === totalPages) {
                                    loader.style.display = 'none'; // Hide the loader when done
                                }
                            });
                        });
                    }
                }).catch(function (error) {
                    console.error("Error loading PDF:", error);
                    loader.style.display = 'none'; // Hide the loader on error
                });
            };

            reader.readAsArrayBuffer(blob);
        })
        .catch(error => {
            console.error("An error occurred:", error);
            loader.style.display = 'none'; // Hide the loader on error
        });
}


// Fetch and display text files
function fetchTextFile(url) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            document.getElementById('file-output').value = data;
        })
        .finally(() => document.getElementById('loading').style.display = 'none');
}

// Fetch and display JSON files
function fetchJSONFile(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            document.getElementById('file-output').value = JSON.stringify(data, null, 2);
        })
        .finally(() => document.getElementById('loading').style.display = 'none');
}

// Fetch and display CSV files
function fetchCSVFile(url) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            // Simple CSV parsing: split by lines and commas, then display
            let rows = data.split("\n").map(row => row.split(",").join("\t"));
            document.getElementById('file-output').value = rows.join("\n");
        })
        .finally(() => document.getElementById('loading').style.display = 'none');
}

// Handling DOC, DOCX, XLS, XLSX files
function fetchOfficeFile(url, fileExtension) {
    document.getElementById('file-output').value = `Downloading and preview of ${fileExtension} not supported. You can download it directly: ${url}`;
    document.getElementById('loading').style.display = 'none';
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('dropbox').addEventListener('click', chooseFromDropbox);
    document.getElementById('dropboxsave').addEventListener('click', saveToDropbox);
});

let accessToken = null;

// Function to redirect user to Dropbox OAuth in a new window
function authenticateDropbox() {
    return new Promise((resolve, reject) => {
        const dropboxAppKey = 'qxk9pb63k2d7ugc'; // Replace with your actual Dropbox App key
        const redirectUri = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/auth.html';
        const dropboxOAuthUrl = `https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=${dropboxAppKey}&redirect_uri=${encodeURIComponent(redirectUri)}`;

        // Open the Dropbox OAuth in a new popup window
        window.open(dropboxOAuthUrl, 'DropboxAuth', 'width=600,height=500');

        // Listen for message from the authentication popup
        window.addEventListener('message', function (event) {
            // Only accept messages from the auth window
            if (event.origin === window.location.origin && event.data.token) {
                accessToken = event.data.token; // Receive access token from the popup
                resolve(accessToken); // Resolve the promise after authentication
            } else {
                reject(new Error('Authentication failed or was canceled.'));
            }
        }, false);
    });
}

// Function to save text to Dropbox
async function saveToDropbox() {
    const textArea = document.getElementById('file-output');
    const textContent = textArea.value.trim();
    const filenameElement = document.getElementById('fileName');
    let filename = filenameElement.value.trim();

    // Check for file content
    if (textContent === '') {
        alert("Please enter some text to save.");
        return;
    }

    // Check for filename
    if (filename === '') {
        alert("Please enter a valid file name.");
        return;
    }

    // Append '.txt' extension to the filename
    filename += '.txt';

    // Check for access token, trigger authentication if not present
    if (!accessToken) {
        try {
            await authenticateDropbox(); // Wait until the authentication completes
        } catch (error) {
            alert("Authentication failed or was canceled.");
            return;
        }
    }
    document.getElementById('loading').style.display = 'block';

    const dbx = new Dropbox.Dropbox({ accessToken: accessToken });

    // Convert text content to Blob before uploading
    const blob = new Blob([textContent], { type: 'text/plain' });

    dbx.filesUpload({
        path: '/' + filename,
        contents: blob, // Upload as a Blob
        mode: { '.tag': 'add' }  // Ensure it overwrites if the file already exists
    })
        .then(function (response) {
            alert('File successfully saved to Dropbox: ' + filename);
            if (confirm("Do you want to clear the text from TextBox ?")) {
                clearContent();
            }
        })
        .catch(function (error) {
            console.error(error);
            alert('Error uploading file to Dropbox.');
        })
        .finally(() => {
            // Hide loader after file content is processed
            document.getElementById('loading').style.display = 'none';
        });
}