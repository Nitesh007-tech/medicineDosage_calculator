import { Router, Request, Response } from 'express';
import multer from 'multer';
import { saveFile, deleteFile, validateFile, type UploadedFile } from './file.service';

const router = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});

/**
 * POST /api/upload
 * Upload a file to the platform
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file provided' });
            return;
        }

        const uploadedFile: UploadedFile = {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            buffer: req.file.buffer,
        };

        // Validate file
        const validation = validateFile(uploadedFile);
        if (!validation.valid) {
            res.status(400).json({ error: validation.error });
            return;
        }

        // Get folder from query or default to 'media'
        const folder = (req.query.folder as string) || 'media';

        // Save file
        const result = await saveFile(uploadedFile, folder);

        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('Upload failed:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

/**
 * DELETE /api/upload
 * Delete a file from the platform
 */
router.delete('/', async (req: Request, res: Response) => {
    try {
        const { key } = req.body;

        if (!key) {
            res.status(400).json({ error: 'No file key provided' });
            return;
        }

        const success = await deleteFile(key);

        if (success) {
            res.json({ success: true, message: 'File marked for deletion' });
        } else {
            res.status(500).json({ error: 'Failed to mark file for deletion' });
        }
    } catch (error) {
        console.error('Delete failed:', error);
        res.status(500).json({ error: 'Delete failed' });
    }
});

export default router;
