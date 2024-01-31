const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function searchImages(keywords, perPage = 1) {
    const url = "https://api.pexels.com/v1/search";
    const headers = {
        "Authorization": process.env.PEXELSAPI,
    };

    const imageUrls = [];

    for (const keyword of keywords) {
        const params = {
            "query": keyword,
            "per_page": perPage,
        };

        try {
            const response = await axios.get(url, { headers, params });

            if (response.status === 200) {
                const data = response.data;
                const photos = data.photos || [];

                if (!photos.length) {
                    console.log(`No photos found for keyword: ${keyword}`);
                } else {
                    // Get the first photo's original image URL for each keyword
                    imageUrls.push(photos[0].src.original);
                }
            } else {
                console.log(`Error for keyword ${keyword}: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error for keyword ${keyword}: ${error.message}`);
        }
    }

    return imageUrls;
}

async function downloadImages(urlList, outDir) {
    // Create the output directory if it doesn't exist
    fs.mkdirSync(outDir, { recursive: true });

    for (const url of urlList) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });

            if (response.status === 200) {
                // Get the file name from the URL
                const filename = path.join(outDir, path.basename(url));

                // Save the image to the specified output directory
                fs.writeFileSync(filename, response.data, 'binary');
                console.log(`Image downloaded: ${filename}`);
            } else {
                console.log(`Failed to download image from ${url}. Status code: ${response.status}`);
            }
        } catch (error) {
            console.error(`Failed to download image from ${url}: ${error.message}`);
        }
    }
}

// // Example usage
// const keywords = ['nature', 'travel', 'architecture'];
// const perPage = 1;
// const outputDir = '.';

// searchImages(keywords, perPage)
//     .then(imageUrls => downloadImages(imageUrls, outputDir))
//     .catch(error => console.error(`Error: ${error.message}`));

// export { searchImages, downloadImages };