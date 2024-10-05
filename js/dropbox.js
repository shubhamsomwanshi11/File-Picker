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
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                const pdfjsLib = window['pdfjsLib'];
                
                pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(function(pdf) {
                    let output = '';
                    const totalPages = pdf.numPages;
                    let pagesProcessed = 0;

                    // Process each page
                    for (let i = 1; i <= totalPages; i++) {
                        pdf.getPage(i).then(function(page) {
                            page.getTextContent().then(function(textContent) {
                                textContent.items.forEach(function(item) {
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
                }).catch(function(error) {
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