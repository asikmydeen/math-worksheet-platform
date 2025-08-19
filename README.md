# Math Worksheet Platform

A comprehensive web application for generating, solving, and tracking math worksheets with AI-powered problem generation and analytics. Perfect for educators, students, and parents looking for personalized math practice materials.

## 🌟 Features

### Core Functionality
- **AI-Powered Generation**: Uses OpenAI GPT to create grade-appropriate math problems
- **Dual Mode Interface**: 
  - Interactive quiz mode for online solving
  - Traditional printable worksheet format
- **Comprehensive Analytics**: Beautiful charts and insights powered by Recharts
- **Smart Problem Generation**: Natural language support - describe what you need in plain English

### Educational Features
- **Grade-Specific Content**: Tailored for K-12 students
- **Multiple Topics**: Addition, subtraction, multiplication, division, fractions, geometry, and more
- **Adaptive Difficulty**: Easy, medium, and hard problem levels
- **Hints System**: Built-in hints for struggling students
- **Performance Tracking**: Monitor progress over time

### Technical Features
- **Secure Authentication**: JWT with Two-Factor Authentication (2FA)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: See results and analytics instantly
- **Data Persistence**: All worksheets and progress saved securely

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide React** - Beautiful icons
- **React Router v6** - Client-side routing

### Backend
- **Node.js & Express** - Server framework
- **MongoDB & Mongoose** - Database and ODM
- **OpenAI API** - AI problem generation
- **JWT & Speakeasy** - Authentication with 2FA
- **Bcrypt** - Password hashing

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy for production
- **Git** - Version control

## 📋 Prerequisites

- Docker and Docker Compose installed ([Install Docker](https://docs.docker.com/get-docker/))
- OpenAI API key ([Get API Key](https://platform.openai.com/api-keys))
- Git for version control
- (Optional) Node.js 18+ for local development

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/math-worksheet-platform.git
cd math-worksheet-platform
```

### 2. Set up environment variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password-change-this

# Backend Configuration
JWT_SECRET=your-secret-key-change-this-to-something-secure
OPENAI_API_KEY=sk-your-openai-api-key-here

# Frontend Configuration (usually doesn't need changes)
REACT_APP_API_URL=http://localhost:5000

# Optional Configuration
NODE_ENV=production
CLIENT_URL=http://localhost
PORT=5000
```

**Important**: 
- Use a strong password for MongoDB
- Generate a secure JWT secret (use `openssl rand -base64 32`)
- Keep your OpenAI API key secure

### 3. Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 4. Access the application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017 (if you need direct DB access)

### 5. Default login (for demo)

The first user you register will need to set up 2FA. Follow these steps:
1. Register a new account
2. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)
3. Enter the 6-digit code to complete registration
4. Use your username and 2FA code to login

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

## 🐳 Docker Commands

### Essential Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Service-specific Commands

```bash
# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Restart a specific service
docker-compose restart backend

# Execute commands in a container
docker-compose exec backend npm run test
docker-compose exec mongodb mongosh
```

### Maintenance Commands

```bash
# Remove all containers and networks (keeps data)
docker-compose down

# Remove everything including volumes (DELETES ALL DATA!)
docker-compose down -v

# Update images
docker-compose pull
docker-compose up -d
```

## 📁 Project Structure

```
math-worksheet-platform/
├── frontend/              # React frontend application
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   │   ├── Layout.js
│   │   │   └── WorksheetGenerator.js
│   │   ├── pages/        # Page components
│   │   │   ├── Analytics.js      # Analytics dashboard
│   │   │   ├── Dashboard.js      # Main dashboard
│   │   │   ├── Login.js          # Authentication
│   │   │   ├── WorksheetSolver.js # Quiz mode
│   │   │   ├── WorksheetView.js   # Print mode
│   │   │   └── Worksheets.js      # Worksheet list
│   │   ├── contexts/     # React contexts for state
│   │   ├── services/     # API communication
│   │   └── App.js        # Main app component
│   ├── Dockerfile        # Frontend container config
│   └── nginx.conf        # Production server config
│
├── backend/              # Node.js backend API
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database schemas
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth & validation
│   │   └── services/     # Business logic & AI
│   ├── server.js         # Server entry point
│   └── Dockerfile        # Backend container config
│
├── docker-compose.yml    # Multi-container setup
├── .env.example         # Environment template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user with 2FA setup | No |
| POST | `/api/auth/login` | Login with username and 2FA code | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

### Worksheet Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/worksheets` | List all user worksheets | Yes |
| POST | `/api/worksheets/generate` | Generate new AI worksheet | Yes |
| GET | `/api/worksheets/:id` | Get specific worksheet | Yes |
| POST | `/api/worksheets/:id/submit` | Submit worksheet answers | Yes |
| DELETE | `/api/worksheets/:id` | Delete a worksheet | Yes |

### Analytics Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/analytics/dashboard` | Get comprehensive analytics | Yes |
| GET | `/api/analytics/progress` | Get progress over time | Yes |

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Two-Factor Authentication (2FA)**: Extra security layer with TOTP
- **Password Security**: Bcrypt hashing with salt rounds
- **CORS Protection**: Configured for production use
- **Environment Variables**: Sensitive data kept secure
- **MongoDB Authentication**: Database access control
- **Input Validation**: Sanitized user inputs
- **HTTPS Ready**: Nginx configured for SSL/TLS

## 💡 Usage Guide

### For Students
1. **Register** with your details and set up 2FA
2. **Generate Worksheets** using AI or manual selection
3. **Solve Problems** in interactive mode or print them
4. **Track Progress** in the analytics dashboard

### For Teachers
1. **Create Custom Worksheets** for your class needs
2. **Print Worksheets** for classroom distribution
3. **Monitor Performance** through analytics
4. **Adjust Difficulty** based on student progress

### For Parents
1. **Generate Practice Materials** for home study
2. **Track Child's Progress** over time
3. **Identify Weak Areas** through analytics
4. **Print Worksheets** for offline practice

## 🚀 Deployment

### Using Docker (Recommended)

The application is production-ready with the provided Docker setup. For deployment:

1. Use a VPS or cloud provider (AWS, DigitalOcean, etc.)
2. Install Docker and Docker Compose
3. Clone the repository
4. Set production environment variables
5. Run `docker-compose up -d`
6. Set up a reverse proxy with SSL (nginx, Caddy, or Traefik)

### Environment-Specific Settings

For production, update these in your `.env`:

```env
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
REACT_APP_API_URL=https://api.yourdomain.com
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Keep commits atomic and descriptive

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Ensure MongoDB container is running: `docker-compose ps`
- Check credentials in `.env` file
- Verify MongoDB port 27017 is not in use

**OpenAI API Errors**
- Verify your API key is correct
- Check API usage limits
- Ensure internet connectivity

**Frontend Not Loading**
- Clear browser cache
- Check console for errors
- Verify backend is running on port 5000

**2FA Issues**
- Ensure device time is synchronized
- Try regenerating QR code
- Use a compatible authenticator app

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/math-worksheet-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/math-worksheet-platform/discussions)
- **Email**: support@yourproject.com

## 🙏 Acknowledgments

- OpenAI for providing the GPT API
- The React and Node.js communities
- All contributors and testers

## 🚧 Roadmap

- [ ] Multi-language support
- [ ] Advanced formula editor
- [ ] Video solution explanations
- [ ] Collaborative worksheets
- [ ] Mobile applications
- [ ] LMS integrations
- [ ] Offline mode support

---

<p align="center">Made with ❤️ for educators and students worldwide</p>
