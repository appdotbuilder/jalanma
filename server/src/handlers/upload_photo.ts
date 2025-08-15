import { randomUUID } from 'crypto';

export interface UploadPhotoInput {
    file: Buffer;
    fileName: string;
    mimeType: string;
}

// Configuration constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
];

export async function uploadPhoto(input: UploadPhotoInput): Promise<string> {
    try {
        // Validate input parameters
        if (!input.file || input.file.length === 0) {
            throw new Error('File buffer is required and cannot be empty');
        }

        if (!input.fileName || input.fileName.trim().length === 0) {
            throw new Error('File name is required');
        }

        if (!input.mimeType || input.mimeType.trim().length === 0) {
            throw new Error('MIME type is required');
        }

        // Validate file size
        if (input.file.length > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(input.mimeType.toLowerCase())) {
            throw new Error(`Unsupported file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
        }

        // Extract file extension from original filename or derive from MIME type
        const fileExtension = getFileExtension(input.fileName, input.mimeType);
        
        // Generate unique filename to prevent collisions
        const uniqueId = randomUUID();
        const timestamp = Date.now();
        const uniqueFileName = `road-damage-${timestamp}-${uniqueId}${fileExtension}`;

        // Simulate cloud storage upload
        // In a real implementation, this would upload to AWS S3, Cloudinary, etc.
        const uploadResult = await simulateCloudUpload(input.file, uniqueFileName, input.mimeType);

        // Return the public URL
        return uploadResult.url;
    } catch (error) {
        console.error('Photo upload failed:', error);
        throw error;
    }
}

/**
 * Extract file extension from filename or derive from MIME type
 */
function getFileExtension(fileName: string, mimeType: string): string {
    // Try to get extension from filename first
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex !== -1 && dotIndex < fileName.length - 1) {
        return fileName.substring(dotIndex).toLowerCase();
    }

    // Fallback to MIME type mapping
    const mimeToExtension: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif'
    };

    return mimeToExtension[mimeType.toLowerCase()] || '.jpg';
}

/**
 * Simulate cloud storage upload
 * In production, replace this with actual cloud storage service calls
 */
async function simulateCloudUpload(
    fileBuffer: Buffer, 
    fileName: string, 
    mimeType: string
): Promise<{ url: string; size: number }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    // Simulate potential upload failures (disabled for reliable testing)
    // In production, this would handle actual cloud storage errors

    // Return simulated successful upload result
    const baseUrl = process.env['UPLOAD_BASE_URL'] || 'https://road-damage-storage.example.com';
    
    return {
        url: `${baseUrl}/uploads/${fileName}`,
        size: fileBuffer.length
    };
}

// Export configuration for testing
export const uploadConfig = {
    MAX_FILE_SIZE,
    ALLOWED_MIME_TYPES
};