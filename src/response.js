const sendResponse = (body, contentType, statusCode, errorMessage) => {
    return {
        statusCode: statusCode,
        headers: {
            "Content-Type": contentType,
            "X-Error": errorMessage || null,
            "Cache-Control": `private, max-age=${60*60*24*90}`,
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS"
        },
        body: body,
        isBase64Encoded: true
    };
};

exports.successResponse = (body, contentType) => sendResponse(body, contentType, 200);

const onePixelGif = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
    0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x04, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
]).toString('base64');

exports.errorResponse = (errorMessage, statusCode, err) => {
    console.log(`ERROR ${statusCode} ${errorMessage}`, err);
    return sendResponse(onePixelGif, 'image/gif', statusCode, errorMessage);
};
