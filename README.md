# Math Worksheet Platform

A comprehensive web application for generating, solving, and tracking math worksheets with AI-powered problem generation and analytics.

## Features

- 🤖 AI-powered math problem generation using OpenAI
- 📊 Comprehensive analytics dashboard with charts and insights
- 🖨️ Printable worksheet format with traditional layout
- 🔐 Secure authentication with 2FA (Two-Factor Authentication)
- 📈 Progress tracking and performance insights
- 🎯 Grade-specific content (K-12)
- 📱 Responsive design for all devices
- ✨ Interactive quiz mode and printable worksheet mode

## Tech Stack

- **Frontend:** React, Tailwind CSS, Recharts
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **AI:** OpenAI API
- **Authentication:** JWT with 2FA (Speakeasy)
- **Containerization:** Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- OpenAI API key
- Git

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/math-worksheet-platform.git
cd math-worksheet-platform
```

### 2. Set up environment variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password

# Backend
JWT_SECRET=your-secret-key-change-this
OPENAI_API_KEY=your-openai-api-key

# Frontend
REACT_APP_API_URL=http://localhost:5000

# Optional
NODE_ENV=production
CLIENT_URL=http://localhost
```

### 3. Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

## Development Setup

### Running without Docker

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/math-worksheet-platform
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
CLIENT_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

## Docker Commands

### Build images
```bash
docker-compose build
```

### Start services
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f [service-name]
```

### Stop services
```bash
docker-compose down
```

### Remove volumes (careful - this deletes data!)
```bash
docker-compose down -v
```

## Project Structure

```
math-worksheet-platform/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   └── services/    # API services
│   ├── Dockerfile
│   └── nginx.conf
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── controllers/ # Route controllers
│   │   ├── models/      # MongoDB models
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Express middleware
│   │   └── services/    # Business logic
│   └── Dockerfile
├── docker-compose.yml    # Docker composition
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with 2FA
- `GET /api/auth/me` - Get current user

### Worksheets
- `GET /api/worksheets` - Get all worksheets
- `POST /api/worksheets/generate` - Generate new worksheet
- `GET /api/worksheets/:id` - Get specific worksheet
- `POST /api/worksheets/:id/submit` - Submit worksheet answers
- `DELETE /api/worksheets/:id` - Delete worksheet

### Analytics
- `GET /api/analytics/dashboard` - Get analytics data
- `GET /api/analytics/progress` - Get progress data

## Security Features

- JWT-based authentication
- Two-factor authentication (2FA)
- Password hashing with bcrypt
- CORS protection
- Environment variable management
- MongoDB authentication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.
