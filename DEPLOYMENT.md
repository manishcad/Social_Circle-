# Deployment Guide for Social Circle

## Environment Variables for Vercel

Make sure to add these environment variables in your Vercel project settings:

### Database
```
DATABASE_URL=your_postgresql_connection_string
```

### Authentication
```
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-domain.vercel.app
```

### Email Service (Resend)
```
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_verified_email@domain.com
```

### Image Storage (Cloudinary)
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Build Configuration

The project is configured with:
- API routes are protected from build-time execution
- External services are initialized only at runtime
- Prisma Client is generated automatically by Vercel

**Note:** For local development, you may need to run `npx prisma generate` manually if you encounter permission issues on Windows.

## Deployment Steps

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

## Troubleshooting

If you encounter build errors:
1. Check that all environment variables are set
2. Ensure your database is accessible from Vercel
3. Verify that your Resend and Cloudinary API keys are valid 