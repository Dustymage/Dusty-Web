// Global variable for CSV data
let csvData = "marketplace_listing_title,listing link,photo link,listing price,previous price,location,more info,seller name,link to seller info\n";
    
// Extract Marketplace Entries from HAR
function extractMarketplaceEntries(harContent) {
    const filteredEntries = [];
    const entries = harContent.log?.entries || [];

    entries.forEach(entry => {
        try {
            const responseText = entry.response?.content?.text || "";
            if (responseText.includes("marketplace_search")) {
                filteredEntries.push(entry);
            }
        } catch (error) {
            console.warn("Skipped an entry due to missing structure", error);
        }
    });

    extractAndSaveClean(filteredEntries);
    return filteredEntries;
}

function extractAndSaveClean(data) {
    function recurse(element) {
        if (typeof element === 'object' && !Array.isArray(element) && element !== null) {
            for (const [key, value] of Object.entries(element)) {
                if (key === 'text') {
                    let cleanedValue;
                    try {
                        cleanedValue = typeof value === 'string' ? JSON.parse(value) : value;
                        filterAndSaveJson(cleanedValue);
                    } catch {}
                } else {
                    recurse(value);
                }
            }
        } else if (Array.isArray(element)) {
            element.forEach(item => recurse(item));
        }
    }

    recurse(data);
}

function filterAndSaveJson(data) {
    const edges = data?.data?.marketplace_search?.feed_units?.edges;

    if (Array.isArray(edges)) {
        edges.forEach(edge => {
            const node = edge.node || {};
            if (node.story_type === "POST") {
                const listing = node.listing;
                if (listing) {
                    addRowToCsv(extractDataAndAddToCsv(listing));
                }
            }
        });
    }
}

function extractDataAndAddToCsv(jsonData) {
    try {
        const marketplaceListingTitle = (jsonData?.marketplace_listing_title || "").replace(/\n/g, " ").replace(/,/g, /./);
        const id = jsonData?.id || "";
        const idUrl = `https://www.facebook.com/marketplace/item/${id}/`;
        const primaryListingPhoto = jsonData?.primary_listing_photo?.image?.uri || "";
        const listingPrice = jsonData?.listing_price?.amount || "";
        const strikethroughPrice = jsonData?.strikethrough_price?.amount || "";
        const displayName = jsonData?.location?.reverse_geocode?.city_page?.display_name.replace(/,/g, " ") || "";
        const subtitle = jsonData?.custom_sub_titles_with_rendering_flags?.[0]?.subtitle.replace(/\n/g, " ") || "";
        const sellerName = jsonData?.marketplace_listing_seller?.name || "";
        const sellerId = jsonData?.marketplace_listing_seller?.id || "";
        const sellerIdUrl = `https://www.facebook.com/marketplace/profile/${sellerId}/`;

        return [
            marketplaceListingTitle,
            idUrl,
            primaryListingPhoto,
            listingPrice,
            strikethroughPrice,
            displayName,
            subtitle,
            sellerName,
            sellerIdUrl,
        ];
    } catch (error) {
        console.error(`Error extracting data: ${error.message}`);
    }
}

function addRowToCsv(rowArray) {
    const csvRow = rowArray.join(",");
    csvData += csvRow + "\n";
}

// Generate CSV File
function generateCSVFile() {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'output.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Generate Excel File from CSV
function generateExcelFromCsv() {
    try {
        // Ensure csvData is defined and not empty
        if (!csvData || typeof csvData !== "string" || csvData.trim() === "") {
            alert("CSV data is empty or invalid. Cannot generate Excel file.");
            return;
        }

        // Split csvData string into rows and then into columns
        const rows = csvData
            .trim()
            .split("\n")
            .map(row => row.split(",").map(cell => cell.trim()));

        // Validate rows structure
        if (!Array.isArray(rows) || rows.length === 0 || !Array.isArray(rows[0])) {
            alert("Failed to process CSV data into a valid table structure.");
            return;
        }

        // Convert rows into a worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(rows);

        // Create a workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // Generate the Excel file
        const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const excelBlob = new Blob([excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Create a link to trigger the download
        const url = URL.createObjectURL(excelBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'output.xlsx'; // File name for download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Success pop-up
        alert('Excel file downloaded successfully!');

    } catch (error) {
        console.error("Error generating Excel file:", error);
        alert("An error occurred while generating the Excel file. Please check the console for details.");
    }
}

// Extract Listings from HTML
async function extractListingsFromHtml(htmlContent) {
    const dom = new DOMParser().parseFromString(htmlContent, "text/html");
    const scriptTags = Array.from(dom.querySelectorAll("script"))
        .filter(script => script.textContent && script.textContent.includes("require"));

    const allListings = [];
    for (const scriptTag of scriptTags) {
        try {
            const rawJson = scriptTag.textContent.trim();
            const startIndex = rawJson.indexOf("{");
            if (startIndex === -1) continue;

            const jsonData = JSON.parse(rawJson.slice(startIndex));
            const edges = jsonData?.require?.[0]?.[3]?.[0]?.__bbox?.require?.[0]?.[3]?.[1]?.__bbox?.result?.data?.marketplace_search?.feed_units?.edges;

            if (Array.isArray(edges)) {
                edges.forEach(edge => {
                    const node = edge.node || {};
                    if (node.story_type === "POST") {
                        const listing = node.listing || {};
                        if (!allListings.some(existing => JSON.stringify(existing) === JSON.stringify(listing))) {
                            allListings.push(listing);
                        }
                    }
                });
            }
        } catch (error) {
            console.warn(`Error parsing script tag: ${error.message}`);
        }
    }
    return allListings;
}

async function extractListingFromHtmlFun(htmlContent) {
    const listings = await extractListingsFromHtml(htmlContent);
    listings.forEach(listing => addRowToCsv(extractDataAndAddToCsv(listing)));
}

// Event Listeners
const processButton = document.getElementById('processButton');
const downloadCSVButton = document.getElementById('downloadCSV');
const downloadExcelButton = document.getElementById('downloadExcel');

processButton.addEventListener('click', async () => {
    const harFile = document.getElementById('harFile').files[0];
    const htmlFile = document.getElementById('htmlFile').files[0];

    if (!harFile || !htmlFile) {
        alert("Please upload both HAR and HTML files.");
        return;
    }

    try {
        const harContent = JSON.parse(await harFile.text());
        const htmlContent = await htmlFile.text();

        const harEntries = extractMarketplaceEntries(harContent);
        await extractListingFromHtmlFun(htmlContent);

        alert("Files processed successfully!");
        downloadCSVButton.disabled = false;
        downloadExcelButton.disabled = false;
    } catch (error) {
        console.error("Error during processing:", error);
        alert("An error occurred while processing the files.");
    }
});

downloadExcelButton.addEventListener('click', () => {
    generateExcelFromCsv();
    alert("Excel file downloaded successfully!");
});

downloadCSVButton.addEventListener('click', () => {
    generateCSVFile();
    alert("CSV file downloaded successfully!");
});
