import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from '../components/DarkModeWrapper';
import { useAuth } from '../contexts/AuthContext';
import {
  Brain,
  Sparkles,
  BarChart,
  Target,
  BookOpen,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Moon,
  Sun,
  Menu,
  X,
  GraduationCap,
  Trophy,
  Activity,
  Lightbulb,
  Puzzle,
  LineChart,
  Heart,
  Globe
} from 'lucide-react';

function BrainyBeesLanding() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Personalized education powered by advanced AI that adapts to each student's unique learning style and pace.",
      color: "purple"
    },
    {
      icon: Activity,
      title: "Real-Time Assessment",
      description: "Continuous assessment and feedback to track progress, identify strengths, and address learning gaps instantly.",
      color: "blue"
    },
    {
      icon: LineChart,
      title: "Progress Tracking",
      description: "Comprehensive analytics dashboard for students, parents, and educators to monitor academic growth.",
      color: "green"
    },
    {
      icon: Puzzle,
      title: "Interactive Learning",
      description: "Engaging worksheets, quizzes, and activities that make learning fun and effective.",
      color: "orange"
    },
    {
      icon: Trophy,
      title: "Gamified Experience",
      description: "Earn badges, maintain streaks, and unlock achievements to stay motivated throughout the learning journey.",
      color: "yellow"
    },
    {
      icon: Globe,
      title: "Multi-Subject Platform",
      description: "From mathematics to language arts, science to social studies - all subjects in one comprehensive platform.",
      color: "indigo"
    }
  ];

  const platforms = [
    {
      title: "Worksheet Generator",
      description: "Create customized worksheets with AI",
      icon: BookOpen,
      link: "https://worksheets.brainybees.org",
      color: "blue"
    },
    {
      title: "Live Tutoring",
      description: "Connect with expert tutors online",
      icon: Users,
      link: "#",
      color: "green",
      comingSoon: true
    },
    {
      title: "Practice Tests",
      description: "Prepare for exams with mock tests",
      icon: GraduationCap,
      link: "#",
      color: "purple",
      comingSoon: true
    },
    {
      title: "Learning Games",
      description: "Make learning fun with educational games",
      icon: Lightbulb,
      link: "#",
      color: "orange",
      comingSoon: true
    }
  ];

  const stats = [
    { value: "50K+", label: "Active Students" },
    { value: "1M+", label: "Worksheets Generated" },
    { value: "95%", label: "Student Satisfaction" },
    { value: "200+", label: "Topics Covered" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Parent",
      content: "BrainyBees has transformed how my children learn. The AI-powered worksheets are perfectly tailored to their needs.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "5th Grade Teacher",
      content: "The progress tracking features help me identify which students need extra support. It's an invaluable teaching tool.",
      rating: 5
    },
    {
      name: "Emma Davis",
      role: "Student",
      content: "I love earning badges and maintaining my streak! BrainyBees makes studying fun and rewarding.",
      rating: 5
    }
  ];

  return (
    <div className={`min-h-screen ${darkMode.bg} ${darkMode.text}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${darkMode.card} border-b ${darkMode.border} backdrop-blur-lg bg-opacity-90`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-yellow-500" />
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  BrainyBees
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`${darkMode.textSecondary} hover:${darkMode.text} transition-colors`}>
                Features
              </a>
              <a href="#platforms" className={`${darkMode.textSecondary} hover:${darkMode.text} transition-colors`}>
                Platforms
              </a>
              <a href="#testimonials" className={`${darkMode.textSecondary} hover:${darkMode.text} transition-colors`}>
                Testimonials
              </a>
              <a href="#pricing" className={`${darkMode.textSecondary} hover:${darkMode.text} transition-colors`}>
                Pricing
              </a>
              
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${darkMode.hover} transition-colors`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className={`px-4 py-2 rounded-lg ${darkMode.hover} transition-colors`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg ${darkMode.hover} transition-colors`}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden ${darkMode.card} border-t ${darkMode.border}`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className={`block px-3 py-2 rounded-md ${darkMode.hover}`}>
                Features
              </a>
              <a href="#platforms" className={`block px-3 py-2 rounded-md ${darkMode.hover}`}>
                Platforms
              </a>
              <a href="#testimonials" className={`block px-3 py-2 rounded-md ${darkMode.hover}`}>
                Testimonials
              </a>
              <a href="#pricing" className={`block px-3 py-2 rounded-md ${darkMode.hover}`}>
                Pricing
              </a>
              {user ? (
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className={`block px-3 py-2 rounded-md ${darkMode.hover}`}>
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Empowering Young Minds
              </span>
              <br />
              <span className={darkMode.text}>Through AI-Powered Education</span>
            </h1>
            <p className={`text-xl md:text-2xl ${darkMode.textSecondary} mb-8 max-w-3xl mx-auto`}>
              BrainyBees is a comprehensive educational platform that helps students learn, assess, and track their progress with personalized AI-driven content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105 flex items-center justify-center"
              >
                Start Learning Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="https://worksheets.brainybees.org"
                className={`px-8 py-4 rounded-xl ${darkMode.card} border-2 border-yellow-500 font-semibold hover:bg-yellow-500 hover:text-white transition-all flex items-center justify-center`}
              >
                Try Worksheet Generator
                <Sparkles className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-16 ${darkMode.card}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className={`mt-2 ${darkMode.textSecondary}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose BrainyBees?
            </h2>
            <p className={`text-xl ${darkMode.textSecondary} max-w-2xl mx-auto`}>
              Our platform combines cutting-edge AI technology with proven educational methodologies to create the perfect learning environment.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl ${darkMode.card} border ${darkMode.border} hover:shadow-xl transition-shadow`}
              >
                <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 dark:bg-${feature.color}-900/20 flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className={darkMode.textSecondary}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className={`py-20 ${darkMode.card}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Learning Ecosystem
            </h2>
            <p className={`text-xl ${darkMode.textSecondary} max-w-2xl mx-auto`}>
              Multiple platforms working together to provide a complete educational experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platforms.map((platform, index) => (
              <a
                key={index}
                href={platform.link}
                className={`block p-6 rounded-xl ${darkMode.bg} border ${darkMode.border} hover:shadow-xl transition-all transform hover:scale-105 ${platform.comingSoon ? 'opacity-75' : ''}`}
              >
                <div className={`w-12 h-12 rounded-lg bg-${platform.color}-100 dark:bg-${platform.color}-900/20 flex items-center justify-center mb-4`}>
                  <platform.icon className={`h-6 w-6 text-${platform.color}-600 dark:text-${platform.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{platform.title}</h3>
                <p className={`${darkMode.textSecondary} text-sm`}>{platform.description}</p>
                {platform.comingSoon && (
                  <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    Coming Soon
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Students, Parents & Educators
            </h2>
            <p className={`text-xl ${darkMode.textSecondary} max-w-2xl mx-auto`}>
              See what our community has to say about BrainyBees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl ${darkMode.card} border ${darkMode.border}`}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className={`${darkMode.textSecondary} mb-4 italic`}>"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className={`text-sm ${darkMode.textSecondary}`}>{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`p-12 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500`}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Learning Journey?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of students already learning smarter with BrainyBees.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${darkMode.card} border-t ${darkMode.border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-8 w-8 text-yellow-500" />
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  BrainyBees
                </span>
              </div>
              <p className={darkMode.textSecondary}>
                Empowering students through AI-powered personalized education.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platforms</h4>
              <ul className={`space-y-2 ${darkMode.textSecondary}`}>
                <li><a href="https://worksheets.brainybees.org" className="hover:text-yellow-500">Worksheet Generator</a></li>
                <li><a href="#" className="hover:text-yellow-500">Live Tutoring (Coming Soon)</a></li>
                <li><a href="#" className="hover:text-yellow-500">Practice Tests (Coming Soon)</a></li>
                <li><a href="#" className="hover:text-yellow-500">Learning Games (Coming Soon)</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className={`space-y-2 ${darkMode.textSecondary}`}>
                <li><a href="#" className="hover:text-yellow-500">About Us</a></li>
                <li><a href="#" className="hover:text-yellow-500">Contact</a></li>
                <li><a href="#" className="hover:text-yellow-500">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-yellow-500">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className={`space-y-2 ${darkMode.textSecondary}`}>
                <li><a href="#" className="hover:text-yellow-500">Twitter</a></li>
                <li><a href="#" className="hover:text-yellow-500">Facebook</a></li>
                <li><a href="#" className="hover:text-yellow-500">LinkedIn</a></li>
                <li><a href="#" className="hover:text-yellow-500">support@brainybees.org</a></li>
              </ul>
            </div>
          </div>
          <div className={`mt-8 pt-8 border-t ${darkMode.border} text-center ${darkMode.textSecondary}`}>
            <p>&copy; 2024 BrainyBees. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default BrainyBeesLanding;