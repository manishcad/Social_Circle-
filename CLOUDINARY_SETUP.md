# Cloudinary Setup for Vercel Deployment

## Why Cloudinary?

When deploying to Vercel, the filesystem is read-only, which means you cannot save uploaded files locally. Cloudinary provides a cloud-based image storage solution that works perfectly with Vercel.

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Get your credentials from the dashboard

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### 3. Install Cloudinary Package

```bash
npm install cloudinary
```

### 4. Vercel Environment Variables

When deploying to Vercel, add the same environment variables in your Vercel dashboard:

1. Go to your project in Vercel
2. Navigate to Settings → Environment Variables
3. Add the three Cloudinary variables

## How It Works

### Image Storage
- Images are uploaded directly to Cloudinary
- URLs are stored in the database (e.g., `https://res.cloudinary.com/your-cloud/image/upload/...`)
- No local file storage needed

### Folder Structure
- Profile images: `social-circle/profiles/`
- Post images: `social-circle/posts/`

### Benefits
- ✅ Works with Vercel's read-only filesystem
- ✅ Automatic image optimization
- ✅ CDN delivery for fast loading
- ✅ Automatic backup and redundancy
- ✅ Image transformations (resize, crop, etc.)

## Migration from Local Storage

If you have existing images in `public/uploads/`, you'll need to:

1. Upload them to Cloudinary
2. Update the database URLs
3. Remove the local files

## API Changes

The following APIs have been updated to use Cloudinary:

- `/api/profile/update` - Profile image uploads
- `/api/posts/create` - Post image uploads

## Testing

1. Upload a profile image
2. Create a post with an image
3. Verify images load correctly from Cloudinary URLs

## Troubleshooting

### Images Not Loading
- Check Cloudinary credentials
- Verify environment variables are set
- Check browser console for errors

### Upload Failures
- Verify file size (max 5MB)
- Check file type (images only)
- Ensure Cloudinary account has sufficient credits

## Cost Considerations

- Cloudinary free tier: 25 GB storage, 25 GB bandwidth/month
- Additional usage: Pay per GB
- Suitable for most small to medium applications 