const s3 = require("./s3");
const {successResponse, errorResponse} = require("../src/response");
const im = require('imagemagick');
const fs = require('fs');
const os = require('os');

const getFile = (imageBucket, objectKey, reject) => s3.getFileFromBucket(imageBucket, objectKey).catch(err => {
    console.log(`ERROR: GetFile is erroring out for ${imageBucket} ${objectKey}`)
    return reject(errorResponse(err.code, 404, err))
});


exports.original = (imageBucket, objectKey) => new Promise((resolve, reject) =>

    getFile(imageBucket, objectKey, reject).then(data => resolve(successResponse(data.Body.toString('base64'), 'image/jpeg'))));

exports.resize = (imageBucket, objectKey, width, height, quality) => new Promise((resolve, reject) =>

    getFile(imageBucket, objectKey, reject).then(data => {

        const normalizeObjectKey = objectKey.split('/').join('.');
        const resizedFile = `${os.tmpDir}/resized.${imageBucket}.${normalizeObjectKey}.${width}.${height}`;

        const resizeCallback = (err, output, resolve, reject) => {
            if (err) {
                console.log(`Error: Resize callback ${objectKey}`);
                reject(errorResponse(null, 500, err));
            } else {
                console.log('INFO: Resize operation completed successfully');
                im.identify(resizedFile, (err, result) => {
                    console.log('INFO: MIME type of thumbnail is being identified ' + objectKey);
                    let mimeType;
                    switch (result.format) {
                        case 'GIF':
                            mimeType = 'image/gif';
                            break;
                        case 'PNG':
                            mimeType = 'image/png';
                            break;
                        default:
                            mimeType = 'image/jpeg';
                    }

                    const response = successResponse(Buffer.from(fs.readFileSync(resizedFile)).toString('base64'), mimeType);
                    console.log('INFO: success response ' + objectKey);
                    fs.unlink(resizedFile, () => console.log("INFO: Resized file cleaned up"));
                    console.log('INFO: Deleted the file ' + objectKey);
                    resolve(response);
                });
            }
        };

        if (height) {
            im.crop({
                width: width,
                srcData: data.Body,
                dstPath: resizedFile,
                height: height,
                quality: 1,
                gravity: "Center"
            }, (err, output) => resizeCallback(err, output, resolve, reject));
        } else {
            im.resize({
                width: width,
                srcData: data.Body,
                dstPath: resizedFile,
                quality: quality,
                filter: 'Triangle',
                colorspace: 'sRGB',
                progressive: true,
                strip: true,
                customArgs: [
                    '-define',
                    'filter:support=2',
                    '-thumbnail',
                    width,
                    '-unsharp',
                    '0.25x0.08+8.3+0.045',
                    '-dither',
                    'None',
                    '-posterize',
                    '136',
                    '-define',
                    'jpeg:fancy-upsampling=off',
                    '-define',
                    'png:compression-filter=5',
                    '-define',
                    'png:compression-level=9',
                    '-define',
                    'png:compression-strategy=1',
                    '-define',
                    'png:exclude-chunk=all'
                ]
            }, (err, output) => resizeCallback(err, output, resolve, reject));
        }
    }));
