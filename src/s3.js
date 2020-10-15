const AWS = require("aws-sdk");
const s3 = new AWS.S3();

exports.getFileFromBucket = (bucket, key) => s3.getObject({
    Bucket: bucket,
    Key: key
}).promise();

exports.getFileWithPatternFromBucket = (bucket, key) => s3.getObject({
    Bucket: bucket,
    Key: key
}).promise();
