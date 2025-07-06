# 🌟 Social Circle - Modern Social Media Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.11.1-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4.24.11-000000?style=for-the-badge&logo=nextauth)](https://next-auth.js.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-2.7.0-3448C5?style=for-the-badge&logo=cloudinary)](https://cloudinary.com/)
[![Resend](https://img.shields.io/badge/Resend-4.6.0-000000?style=for-the-badge)](https://resend.com/)

> A full-featured social media platform built with modern web technologies, featuring real-time messaging, image sharing, user discovery, and more.

## ✨ Features

### 🔐 Authentication & Security
- **NextAuth.js Integration** - Secure authentication with email/password
- **Email Verification** - Email verification system using Resend
- **Password Hashing** - Secure password storage with bcryptjs
- **Session Management** - Persistent user sessions
- **Input Sanitization** - XSS protection with DOMPurify

### 📱 User Experience
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Real-time Messaging** - Live chat with Server-Sent Events (SSE)
- **Image Upload** - Cloudinary integration for image storage
- **Infinite Scroll** - Smooth pagination for posts and feeds
- **Modern UI/UX** - Beautiful gradients and animations

### 🚀 Core Features
- **Social Feed** - Personalized post feed with infinite scroll
- **User Discovery** - Find and follow other users
- **Real-time Messaging** - Private messaging with live updates
- **Post Management** - Create, like, and comment on posts
- **Profile Management** - Edit profile, upload images, view stats
- **Follow System** - Follow/unfollow users with real-time updates
- **Image Sharing** - Upload and share images with posts
- **Search Functionality** - Search users by name or email

### 🛠 Technical Features
- **API Routes** - RESTful API with Next.js App Router
- **Database** - PostgreSQL with Prisma ORM
- **Real-time Updates** - Server-Sent Events for live messaging
- **Image Optimization** - Next.js Image component with Cloudinary
- **Error Handling** - Comprehensive error handling and user feedback
- **Security Headers** - Enhanced security with proper headers

### ScreenShots
!![My Image](public/screenshot/Screenshot1.png)
!![My Image](public/screenshot/Screenshot2.png)
!![My Image](public/screenshot/Screenshot3.png)
!![My Image](public/screenshot/Screenshot4.png)
!![My Image](public/screenshot/Screenshot5.png)
!![My Image](public/screenshot/Screenshot6.png)
!![My Image](public/screenshot/Screenshot7.png)
!![My Image](public/screenshot/Screenshot8.png)
!![My Image](public/screenshot/Screenshot9.png)

## 🏗 Architecture

```
social-circle/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Authentication pages
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # NextAuth configuration
│   │   │   ├── explore/      # User discovery APIs
│   │   │   ├── home/         # Feed APIs
│   │   │   ├── messages/     # Messaging APIs
│   │   │   ├── posts/        # Post management APIs
│   │   │   ├── profile/      # Profile management APIs
│   │   │   └── user/         # User-specific APIs
│   │   ├── components/       # Reusable components
│   │   ├── explore/          # User discovery page
│   │   ├── messages/         # Messaging interface
│   │   ├── profile/          # User profile page
│   │   └── user/             # Public user profiles
│   └── lib/                  # Utility functions
├── prisma/                   # Database schema and migrations
└── public/                   # Static assets
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Cloudinary account
- Resend account (for email verification)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/manishcad/social-circle.git
   cd social-circle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/social_circle"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   
   # Resend (for email verification)
   RESEND_API_KEY="your-resend-api-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework
- **NextAuth.js** - Authentication library

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **bcryptjs** - Password hashing

### External Services
- **Cloudinary** - Image storage and optimization
- **Resend** - Email delivery service
- **Vercel Postgres** - Production database (optional)

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Prisma Studio** - Database management




## 📊 Database Schema

The application uses a comprehensive database schema with the following main entities:

- **User** - User accounts and profiles
- **Post** - User posts with content and images
- **Message** - Private messages between users
- **Follower** - Follow relationships
- **Like** - Post likes
- **Comment** - Post comments
- **Session** - User sessions
- **Account** - OAuth accounts

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `GET /api/auth/[...nextauth]` - NextAuth endpoints

### Posts
- `GET /api/home/feed` - Get user feed
- `POST /api/posts/create` - Create new post
- `POST /api/posts/like` - Like/unlike post
- `POST /api/posts/comment` - Add comment
- `GET /api/posts/[id]/comments` - Get post comments

### Users
- `GET /api/explore/users` - Get all users
- `POST /api/explore/follow` - Follow/unfollow user
- `GET /api/user/[id]` - Get user profile
- `GET /api/user/[id]/posts` - Get user posts

### Messaging
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/[userId]` - Get messages with user
- `POST /api/messages/send` - Send message
- `GET /api/messages/stream` - Real-time message stream

### Profile
- `GET /api/profile/stats` - Get user statistics
- `PUT /api/profile/update` - Update profile
- `GET /api/profile/followers` - Get followers
- `GET /api/profile/following` - Get following

## 🎨 UI/UX Features

### Design System
- **Modern Gradients** - Beautiful color transitions
- **Glass Morphism** - Translucent UI elements
- **Smooth Animations** - CSS animations and transitions
- **Responsive Layout** - Mobile-first design approach

### User Interface
- **Infinite Scroll** - Seamless content loading
- **Real-time Updates** - Live message and notification updates
- **Image Modals** - Full-screen image viewing
- **Loading States** - Skeleton screens and spinners
- **Error Handling** - User-friendly error messages

## 🔒 Security Features

- **Input Validation** - Server-side validation for all inputs
- **XSS Protection** - DOMPurify for content sanitization
- **CSRF Protection** - Built-in NextAuth protection
- **Secure Headers** - Security headers implementation
- **Password Hashing** - bcryptjs for secure password storage
- **Session Management** - Secure session handling

## 🚀 Deployment

### Vercel Deployment

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy with automatic builds**

### Environment Variables for Production

```env
# Database (Vercel Postgres recommended)
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-production-secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Resend
RESEND_API_KEY="your-resend-api-key"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Prisma](https://prisma.io/) for the excellent database toolkit
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Cloudinary](https://cloudinary.com/) for image management
- [Resend](https://resend.com/) for email delivery

## 📞 Support

If you have any questions or need help with the project, please:

- Open an issue on GitHub
- Check the documentation
- Review the code examples

---

**Made with ❤️ using Next.js, React, and modern web technologies**
