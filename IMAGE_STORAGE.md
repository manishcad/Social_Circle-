# Image Storage System

## Overview

This project now uses a proper file-based image storage system instead of storing base64 strings in the database. This improves performance, reduces database size, and provides better image handling.

## How It Works

### File Storage
- Images are stored in the `public/uploads/` directory
- Each image gets a unique filename: `{timestamp}-{randomString}.{extension}`
- Only the file path is stored in the database (e.g., `/uploads/1234567890-abc123.jpg`)

### Database Storage
- The `User.image` field stores the file path, not the actual image data
- This significantly reduces database size and improves query performance

### Image Processing
- Images are validated for type (must be image/*)
- File size is limited to 5MB
- Old images are automatically deleted when a new one is uploaded

## API Endpoints

### Profile Update (`/api/profile/update`)
- Handles image upload and profile updates
- Converts uploaded files to proper storage
- Updates database with file paths
- Cleans up old images

### Image Cleanup (`/api/profile/cleanup-images`)
- Converts existing base64 images to file storage
- Useful for migrating from the old system
- Accessible via `/admin/cleanup-images`

## File Structure

```
public/
├── uploads/          # User uploaded images
│   └── .gitkeep     # Ensures directory is tracked
└── ...              # Other public assets
```

## Security

- Images are stored in the public directory for easy access
- File types are validated on upload
- File sizes are limited to prevent abuse
- Unique filenames prevent conflicts

## Migration

If you have existing base64 images in your database:

1. Visit `/admin/cleanup-images` in your application
2. Click "Start Cleanup" to convert existing images
3. The system will automatically convert base64 images to files

## Benefits

- **Performance**: Faster database queries and reduced memory usage
- **Scalability**: Better handling of large numbers of images
- **Maintenance**: Easier to manage and backup images
- **CDN Ready**: File paths can easily be served through CDNs

## Configuration

The system is configured to:
- Accept images up to 5MB
- Support common image formats (jpg, png, gif, etc.)
- Store files in `public/uploads/`
- Automatically clean up old images

## Troubleshooting

### Images Not Showing
1. Check if the file exists in `public/uploads/`
2. Verify the database has the correct file path
3. Ensure the file permissions are correct

### Upload Errors
1. Check file size (must be < 5MB)
2. Verify file type (must be an image)
3. Ensure the uploads directory has write permissions

### Session Not Updating
1. The session should update automatically after profile changes
2. If not, try logging out and back in
3. Check the browser console for errors 