import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const AWS_S3_BUCKET = 'joylo-storage';
const AWS_REGION = 'eu-west-1';

const CDN_BASE = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;

// S3Client is created lazily on first use so that missing credentials are caught
// at request time (with a clear error) rather than silently at module load.
let _s3Client: S3Client | null = null;
function getS3Client(): S3Client {
    if (_s3Client) return _s3Client;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (!accessKeyId || !secretAccessKey) {
        throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set');
    }
    _s3Client = new S3Client({
        region: AWS_REGION,
        credentials: { accessKeyId, secretAccessKey },
    });
    return _s3Client;
}

function getProjectId(): string {
    // JOYLO_PROJECT_ID is the server-side project UUID injected at runtime.
    // Falls back to parsing VITE_API_URL for backward compatibility.
    const projectId = process.env.JOYLO_PROJECT_ID;
    if (projectId) return projectId;
    const apiUrl = process.env.VITE_API_URL || '';
    const match = apiUrl.match(/https?:\/\/([a-f0-9-]+)-app\.joylo\.(io|dev)/);
    return match ? match[1] : 'unknown';
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface UploadedFile {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export interface SavedFile {
    url: string;
    key: string;
    type: 'image' | 'video';
    filename: string;
}

export function validateFile(file: UploadedFile): FileValidationResult {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: images (jpeg, png, gif, webp) and videos (mp4, webm)`
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File too large. Maximum size: 50MB`
        };
    }

    return { valid: true };
}

export async function saveFile(
    file: UploadedFile,
    folder: string = 'media'
): Promise<SavedFile> {
    const projectId = getProjectId();
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const key = `generated_projects/${projectId}/uploads/${folder}/${safeName}`;
    const type = file.mimetype.startsWith('video/') ? 'video' : 'image';

    const client = getS3Client();

    try {
        const command = new PutObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });

        await client.send(command);
        console.log(`Uploaded to AWS S3: ${key}`);

        return {
            url: `${CDN_BASE}/${key}`,
            key,
            type,
            filename: safeName,
        };
    } catch (error) {
        console.error('Failed to upload to S3:', error);
        throw new Error('Failed to upload file to storage');
    }
}

export async function deleteFile(key: string): Promise<boolean> {
    try {
        const client = getS3Client();
        const command = new DeleteObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key,
        });

        await client.send(command);
        console.log(`Deleted from AWS S3: ${key}`);
        return true;
    } catch (error) {
        console.error('Failed to delete from S3:', error);
        return false;
    }
}

/**
 * Replace a stored file. Delete and upload are not atomic: old-file deletion is
 * best-effort. If deletion fails the old file remains, and if the upload then
 * fails both files may exist simultaneously. Callers must handle partial-failure states.
 */
export async function replaceFile(
    oldKey: string | null | undefined,
    newFile: UploadedFile,
    folder: string = 'media'
): Promise<SavedFile> {
    if (oldKey) {
        await deleteFile(oldKey);
    }
    return saveFile(newFile, folder);
}
