require('dotenv').config();
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const mimeTypes = require('mime-types');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID_Test,
        secretAccessKey: process.env.SECRET_ACCESS_KEY_Test,
    },
});

const uploadFile = async (fileName, folderName, filePath) => {
    try {
        const fileStream = fs.createReadStream(filePath);
        const contentType = mimeTypes.lookup(filePath) || 'application/octet-stream';

        const key = `${folderName}/${fileName}`;
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: key,
            Body: fileStream,
            ContentType: contentType,
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        // Use custom domain or S3 URL based on environment
        const baseUrl = process.env.FILE_BASE_URL;
        const url = `${baseUrl}/${key}`;
        return url;
    } catch (err) {
        console.error('Error uploading to S3:', err);
        throw err;
    }
};


module.exports = {
    uploadToS3: async (files, folderName) => {
        try {
            if (!Array.isArray(files)) {
                // Single file
                const { filename, path: filePath } = files;
                const url = await uploadFile(filename, folderName, filePath);
                return url;
            } else {
                // Multiple files
                const uploadPromises = files.map(file => {
                    const { filename, path: filePath } = file;
                    return uploadFile(filename, folderName, filePath);
                });
                const urls = await Promise.all(uploadPromises);
                return urls;
            }
        } catch (err) {
            console.error('Error uploading to S3:', err);
            throw err;
        }
    },

    deleteFileFromS3: async (fileKey) => {
        try {
            const command = new DeleteObjectCommand({
                Bucket: process.env.BUCKET_NAME,
                Key: fileKey,
            });

            const result = await s3Client.send(command);
            return result;
        } catch (err) {
            console.error('Error deleting from S3:', err);
            throw err;
        }
    }
};
