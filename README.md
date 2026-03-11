# GearGuard

A backend system for managing equipment maintenance, tracking, and user roles with authentication.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Email**: Nodemailer

## Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL database (or create one at Neon)
- Cloudinary account (for image uploads)
- Gmail account (for email service)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd GearGuard
```

### 2. Install Backend Dependencies
```bash
cd Backend
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and update with your credentials:
```bash
cp .env.example .env
```

Update these variables in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `ACCESS_TOKEN_SECRET` - Random string for JWT
- `REFRESH_TOKEN_SECRET` - Random string for refresh JWT
- `CORS_ORIGIN` - Frontend URL (e.g., http://localhost:3000)
- `EMAIL_USER` & `EMAIL_PASS` - Gmail credentials
- `CLOUDINARY_*` - Cloudinary API credentials

### 4. Setup Database
```bash
# Run migrations
npx prisma migrate dev

# Seed initial data (creates default manager)
npx prisma db seed
```

Manager credentials from seed:
- **Email**: manager@company.com
- **Username**: manager
- **Password**: manager123

### 5. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:8000`

## Project Structure

```
Backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── routes/          # API routes
│   ├── middlewares/     # Auth, multer, error handling
│   ├── utils/           # Helpers, errors, validators
│   ├── db/              # Database connection
│   ├── app.js           # Express app setup
│   └── index.js         # Server entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.js          # Database seeding
└── package.json

public/                   # Static files & uploads
```

## API Endpoints

### Authentication (Public)
- `POST /api/v1/users/login` - Login with email/username
- `POST /api/v1/users/refresh-token` - Refresh access token

### User (Authenticated)
- `GET /api/v1/users/me` - Get current user
- `POST /api/v1/users/logout` - Logout
- `POST /api/v1/users/change-password` - Change password

### Manager Only
- `POST /api/v1/users/manager/create-user` - Create employee/technician
- `DELETE /api/v1/users/manager/delete-user/:id` - Delete user

## User Roles

- **Manager**: Can create/delete employees and technicians
- **Employee**: Standard user with limited permissions
- **Technician**: Can perform maintenance operations

## Error Handling

All errors follow a consistent format:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": []
}
```

## Development Notes

- Environment variables are loaded from `.env` using dotenv
- JWT tokens are sent both as httpOnly cookies and Bearer tokens
- File uploads are stored temporarily in `public/temp/` before being sent to Cloudinary
- Database queries are logged in development mode

## Future: Frontend Setup

Frontend will be built separately in the `Frontend/` directory using React or similar framework.

## License

ISC