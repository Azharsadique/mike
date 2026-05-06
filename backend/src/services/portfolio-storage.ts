import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Ensure AWS credentials or generic S3-compatible configuration is loaded via env
const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    forcePathStyle: true,
});

export async function getPortfolioStream(uri: string) {
    if (!uri.startsWith("objstore://")) {
        throw new Error("Invalid portfolio URI schema");
    }

    const path = uri.replace("objstore://", "");
    const parts = path.split("/");
    const bucket = parts[0];
    const key = parts.slice(1).join("/");

    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    const response = await s3.send(command);
    return response.Body;
}
