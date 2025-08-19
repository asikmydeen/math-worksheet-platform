# Math Worksheet Platform

A comprehensive web application for generating, solving, and tracking math worksheets with AI-powered problem generation and analytics.

## Features

- 🤖 **AI-Powered Generation**: Uses OpenAI to create grade-appropriate math problems
- 💬 **Natural Language Support**: Describe what you want in plain English
- 📊 **Progress Tracking**: Monitor student performance over time
- 🎯 **Adaptive Difficulty**: Problems adjust based on student performance
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔐 **Secure Authentication**: JWT-based auth system
- 📈 **Analytics Dashboard**: Detailed insights into learning progress
- 👥 **Multiple Roles**: Support for students, teachers, and parents

## Tech Stack

### Backend
- Node.js + Express
- MongoDB (Mongoose ODM)
- OpenAI API
- JWT Authentication
- Bcrypt for password hashing

### Frontend
- React 18
- Tailwind CSS
- Axios for API calls
- Lucide React for icons
- React Router v6

## Prerequisites

- Node.js 16+ installed
- MongoDB installed locally or MongoDB Atlas account
- OpenAI API key

## Installation

### 1. Clone the repository
```bash
cd /Users/ammydeen/Documents/math-worksheet-platform
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
```

Edit `.env` file with your credentials:
```
PORT=5054
MONGODB_URI=mongodb://localhost:27017/math-worksheet-platform
JWT_SECRET=your-super-secret-jwt-key-change-this
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
FRONTEND_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup

Open a new terminal:
```bash
cd ../frontend
npm install
npm start
```

The app will open at http://localhost:3000

## Project Structure

```
math-worksheet-platform/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and OpenAI config
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   ├── services/       # AI service
│   │   └── app.js         # Express app setup
│   ├── server.js          # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service
│   │   ├── contexts/      # React contexts
│   │   └── App.js        # Main app component
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Worksheets
- `POST /api/worksheets/generate` - Generate new worksheet
- `GET /api/worksheets` - Get all worksheets
- `GET /api/worksheets/:id` - Get single worksheet
- `POST /api/worksheets/:id/submit` - Submit worksheet answers
- `DELETE /api/worksheets/:id` - Delete worksheet

### Analytics
- `GET /api/analytics/user` - Get user analytics
- `GET /api/analytics/progress` - Get progress over time
- `GET /api/analytics/leaderboard` - Get leaderboard

## Usage

1. **Register/Login**: Create an account as a student, teacher, or parent
2. **Generate Worksheets**:
   - Use standard mode to select grade, topics, and difficulty
   - Use AI mode to describe what you want in natural language
3. **Solve Problems**: Work through generated problems with hints available
4. **Track Progress**: View analytics and progress over time
5. **Review History**: Access all past worksheets and scores

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5054)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - AI model to use (gpt-3.5-turbo, gpt-4, etc.)
- `FRONTEND_URL` - Frontend URL for CORS

## Deployment

### Backend (Heroku/Railway/Render)
1. Set environment variables in hosting platform
2. Ensure MongoDB Atlas is configured
3. Deploy from GitHub

### Frontend (Vercel/Netlify)
1. Set `REACT_APP_API_URL` to your backend URL
2. Deploy from GitHub

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for educational purposes.

## Support

For issues or questions, please create an issue in the repository.

## Future Enhancements

- [ ] PDF export for worksheets
- [ ] Real-time collaboration
- [ ] Video explanations for solutions
- [ ] Parent dashboard
- [ ] Classroom management for teachers
- [ ] Mobile app (React Native)
- [ ] More subject support (Science, English, etc.)
- [ ] Gamification features
- [ ] Integration with Google Classroom
- [ ] Advanced reporting and insights
