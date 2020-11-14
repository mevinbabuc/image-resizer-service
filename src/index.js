const url = require('url');
const {errorResponse} = require("./response");
const {original, resize, thumStrip} = require("./image");

exports.handler = (event) => new Promise((resolve, reject) => {
    const imageBucket = process.env.IMAGE_BUCKET;
    if (!imageBucket) {
        return reject(`Error: Set environment variable IMAGE_BUCKET`);
    }

    const path = event.path;
    const objectKey = url.parse(path).pathname.replace(/^\/+/g, '');
    const queryParameters = event.queryStringParameters || {};

    if (!queryParameters.width && !queryParameters.height) {
        return original(imageBucket, objectKey)
            .then(resolve)
            .catch(reject);
    }

    let width = parseInt(queryParameters.width);
    const height = parseInt(queryParameters.height);
    let gravity = queryParameters.gravity || 'Center';

    let quality = parseInt(queryParameters.quality);

    let __dynArgs = queryParameters.custom || '';

    // 'Lanczos' used to be old value
    let filter = queryParameters.filter || 'Triangle';

    const validGravityValues = ['NorthWest', 'North', 'NorthEast', 'West', 'Center', 'East', 'SouthWest', 'South', 'SouthEast'];
    if (validGravityValues.indexOf(gravity) < 0){
        gravity = 'Center';
    }

    if (isNaN(width)) {
        return reject(errorResponse(`width parameters must be integer`, 400));
    }

    // Type based upper limit
    const limits = {
        'selection': 1200,
        'highlight': 4000,
        'thumbnail': 300,
        'dynthumbnail': 800,
        'videostrip': 9000
    };

    const type = queryParameters.type || 'highlight'; // thumbnail / selection / highlight / dynthumbnail ?
    const upperLimit = limits[type];

    if (type === 'videostrip') {
        return thumStrip(imageBucket, objectKey, width)
            .then(resolve)
            .catch(reject);
    }

    // Lets never ever upscale images; unless we use neural networks
    const standardSizes = ['selection', 'highlight', 'thumbnail'];
    const standardThumbnailSizes = ['thumbnail', 'dynthumbnail'];
    if (standardSizes.indexOf(type) > -1 && width >= upperLimit) {
        return original(imageBucket, objectKey)
            .then(resolve)
            .catch(reject);
    } else {
        width = width >= upperLimit ? upperLimit : width;

        if (isNaN(quality)) {
            quality = standardThumbnailSizes.indexOf(type) > -1 ? 75: 82;
        }

        if (type === 'dynthumbnail') {
            quality = 45;
            filter = 'Lanczos';
            width = width + 200;
        }

        quality = quality/100;
        return resize(imageBucket, objectKey, width, height, quality, gravity, filter, __dynArgs)
            .then(resolve)
            .catch(reject);
    }
});
