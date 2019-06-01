const url = require('url');
const {errorResponse} = require("./response");
const {original, resize} = require("./image");

exports.handler = (event) => new Promise((resolve, reject) => {
    const imageBucket = process.env.IMAGE_BUCKET;

    if (!imageBucket) {
        return reject(`Error: Set environment variable IMAGE_BUCKET`);
    }

    const path = event.path;
    const objectKey = url.parse(path).pathname.replace(/^\/+/g, '');
    console.log('INFO: key: ' + objectKey);

    const queryParameters = event.queryStringParameters || {};

    if (!queryParameters.width && !queryParameters.height) {
        return original(imageBucket, objectKey)
            .then(resolve)
            .catch(reject);
    }

    let width = parseInt(queryParameters.width);
    const height = parseInt(queryParameters.height);

    if ((queryParameters.width && isNaN(width)) || (queryParameters.height && isNaN(height))) {
        return reject(errorResponse(`width and height parameters must be integer`, 400));
    }

    /*
    Premagic use case
    Show the original image, if the size is greater than 1600px res.
    */
    if (width > 1600) {
         return original(imageBucket, objectKey)
            .then(resolve)
            .catch(reject);
    }

    return resize(imageBucket, objectKey, width, height)
        .then(resolve)
        .catch(reject);
});
