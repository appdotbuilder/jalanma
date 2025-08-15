import { describe, expect, it, beforeEach } from 'bun:test';
import { uploadPhoto, uploadConfig, type UploadPhotoInput } from '../handlers/upload_photo';

// Helper function to create test image buffer
function createTestImageBuffer(sizeInKB: number = 100): Buffer {
    const sizeInBytes = sizeInKB * 1024;
    const buffer = Buffer.alloc(sizeInBytes);
    
    // Fill with some fake image data pattern
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = i % 256;
    }
    
    return buffer;
}

// Valid test input
const validInput: UploadPhotoInput = {
    file: createTestImageBuffer(100), // 100KB
    fileName: 'road-damage-photo.jpg',
    mimeType: 'image/jpeg'
};

describe('uploadPhoto', () => {
    beforeEach(() => {
        // Reset any environment variables
        delete process.env['UPLOAD_BASE_URL'];
    });

    it('should successfully upload a valid image', async () => {
        const result = await uploadPhoto(validInput);

        expect(typeof result).toBe('string');
        expect(result).toMatch(/^https?:\/\/.+/); // Should be a valid URL
        expect(result).toContain('uploads/');
        expect(result).toContain('road-damage-');
        expect(result).toEndWith('.jpg');
    });

    it('should generate unique filenames for multiple uploads', async () => {
        const input1 = { ...validInput, fileName: 'test1.jpg' };
        const input2 = { ...validInput, fileName: 'test2.jpg' };

        const [result1, result2] = await Promise.all([
            uploadPhoto(input1),
            uploadPhoto(input2)
        ]);

        expect(result1).not.toEqual(result2);
        expect(result1).toMatch(/road-damage-\d+-[a-f0-9-]+\.jpg$/);
        expect(result2).toMatch(/road-damage-\d+-[a-f0-9-]+\.jpg$/);
    });

    it('should handle different image formats correctly', async () => {
        const testCases = [
            { mimeType: 'image/png', fileName: 'test.png', expectedExt: '.png' },
            { mimeType: 'image/webp', fileName: 'test.webp', expectedExt: '.webp' },
            { mimeType: 'image/gif', fileName: 'test.gif', expectedExt: '.gif' },
            { mimeType: 'image/jpeg', fileName: 'test.jpeg', expectedExt: '.jpeg' }
        ];

        for (const testCase of testCases) {
            const input: UploadPhotoInput = {
                file: createTestImageBuffer(50),
                fileName: testCase.fileName,
                mimeType: testCase.mimeType
            };

            const result = await uploadPhoto(input);
            expect(result).toEndWith(testCase.expectedExt);
        }
    });

    it('should derive extension from MIME type when filename has no extension', async () => {
        const input: UploadPhotoInput = {
            file: createTestImageBuffer(50),
            fileName: 'photo_without_extension',
            mimeType: 'image/png'
        };

        const result = await uploadPhoto(input);
        expect(result).toEndWith('.png');
    });

    it('should use custom base URL from environment', async () => {
        process.env['UPLOAD_BASE_URL'] = 'https://custom-storage.com';

        const result = await uploadPhoto(validInput);
        expect(result).toStartWith('https://custom-storage.com/uploads/');
    });

    it('should reject empty file buffer', async () => {
        const input: UploadPhotoInput = {
            file: Buffer.alloc(0),
            fileName: 'test.jpg',
            mimeType: 'image/jpeg'
        };

        await expect(uploadPhoto(input)).rejects.toThrow(/file buffer is required and cannot be empty/i);
    });

    it('should reject missing file buffer', async () => {
        const input = {
            file: null as any,
            fileName: 'test.jpg',
            mimeType: 'image/jpeg'
        };

        await expect(uploadPhoto(input)).rejects.toThrow(/file buffer is required and cannot be empty/i);
    });

    it('should reject empty filename', async () => {
        const input: UploadPhotoInput = {
            file: createTestImageBuffer(50),
            fileName: '',
            mimeType: 'image/jpeg'
        };

        await expect(uploadPhoto(input)).rejects.toThrow(/file name is required/i);
    });

    it('should reject whitespace-only filename', async () => {
        const input: UploadPhotoInput = {
            file: createTestImageBuffer(50),
            fileName: '   ',
            mimeType: 'image/jpeg'
        };

        await expect(uploadPhoto(input)).rejects.toThrow(/file name is required/i);
    });

    it('should reject empty MIME type', async () => {
        const input: UploadPhotoInput = {
            file: createTestImageBuffer(50),
            fileName: 'test.jpg',
            mimeType: ''
        };

        await expect(uploadPhoto(input)).rejects.toThrow(/mime type is required/i);
    });

    it('should reject files exceeding maximum size', async () => {
        const oversizedBuffer = createTestImageBuffer(11 * 1024); // 11MB > 10MB limit

        const input: UploadPhotoInput = {
            file: oversizedBuffer,
            fileName: 'large-file.jpg',
            mimeType: 'image/jpeg'
        };

        await expect(uploadPhoto(input)).rejects.toThrow(/file size exceeds maximum allowed size/i);
    });

    it('should reject unsupported file types', async () => {
        const unsupportedTypes = [
            'text/plain',
            'application/pdf',
            'image/bmp',
            'image/tiff',
            'video/mp4',
            'audio/mpeg'
        ];

        for (const mimeType of unsupportedTypes) {
            const input: UploadPhotoInput = {
                file: createTestImageBuffer(50),
                fileName: 'test-file',
                mimeType
            };

            await expect(uploadPhoto(input)).rejects.toThrow(/unsupported file type/i);
        }
    });

    it('should handle case-insensitive MIME type validation', async () => {
        const input: UploadPhotoInput = {
            file: createTestImageBuffer(50),
            fileName: 'test.jpg',
            mimeType: 'IMAGE/JPEG' // Uppercase
        };

        const result = await uploadPhoto(input);
        expect(result).toMatch(/^https?:\/\/.+\.jpg$/);
    });

    it('should validate configuration constants', () => {
        expect(uploadConfig.MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
        expect(uploadConfig.ALLOWED_MIME_TYPES).toContain('image/jpeg');
        expect(uploadConfig.ALLOWED_MIME_TYPES).toContain('image/png');
        expect(uploadConfig.ALLOWED_MIME_TYPES).toContain('image/webp');
        expect(uploadConfig.ALLOWED_MIME_TYPES).toContain('image/gif');
        expect(uploadConfig.ALLOWED_MIME_TYPES.length).toBe(5);
    });

    it('should handle filename with multiple dots correctly', async () => {
        const input: UploadPhotoInput = {
            file: createTestImageBuffer(50),
            fileName: 'road.damage.photo.v2.final.png',
            mimeType: 'image/png'
        };

        const result = await uploadPhoto(input);
        expect(result).toEndWith('.png');
    });

    it('should handle filename without extension but with MIME type fallback', async () => {
        const input: UploadPhotoInput = {
            file: createTestImageBuffer(50),
            fileName: 'photo-12345',
            mimeType: 'image/webp'
        };

        const result = await uploadPhoto(input);
        expect(result).toEndWith('.webp');
    });

    it('should generate timestamps in filename that are recent', async () => {
        const beforeUpload = Date.now();
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure different timestamp
        const result = await uploadPhoto(validInput);
        const afterUpload = Date.now();

        // Extract timestamp from the filename pattern: road-damage-{timestamp}-{uuid}.{ext}
        const timestampMatch = result.match(/road-damage-(\d+)-[a-f0-9-]+\.\w+$/);
        expect(timestampMatch).toBeTruthy();

        if (timestampMatch) {
            const timestamp = parseInt(timestampMatch[1]);
            expect(timestamp).toBeGreaterThan(beforeUpload);
            expect(timestamp).toBeLessThanOrEqual(afterUpload);
        }
    });

    it('should handle edge case of exact maximum file size', async () => {
        const maxSizeBuffer = Buffer.alloc(uploadConfig.MAX_FILE_SIZE);
        
        const input: UploadPhotoInput = {
            file: maxSizeBuffer,
            fileName: 'max-size-file.jpg',
            mimeType: 'image/jpeg'
        };

        // Should not throw - exactly at the limit
        const result = await uploadPhoto(input);
        expect(result).toMatch(/^https?:\/\/.+\.jpg$/);
    });

    it('should handle very small files', async () => {
        const tinyBuffer = Buffer.alloc(1);
        tinyBuffer[0] = 0xFF; // Single byte
        
        const input: UploadPhotoInput = {
            file: tinyBuffer,
            fileName: 'tiny.png',
            mimeType: 'image/png'
        };

        const result = await uploadPhoto(input);
        expect(result).toMatch(/^https?:\/\/.+\.png$/);
    });
});