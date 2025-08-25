import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from '../components/DarkModeWrapper';
import { useAuth } from '../contexts/AuthContext';
import paymentService from '../services/payment';
import {
  Calculator,
  Sparkles,
  BarChart,
  Clock,
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
  X
} from 'lucide-react';

function LandingPage() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Generation",
      description: "Create truly customizable worksheets with our advanced AI. Simply describe what you need in natural language.",
      color: "purple"
    },
    {
      icon: BarChart,
      title: "Detailed Analytics",
      description: "Track progress with comprehensive analytics. Monitor performance, identify learning gaps, and celebrate achievements.",
      color: "blue"
    },
    {
      icon: Clock,
      title: "Complete History",
      description: "Access all past worksheets and attempts. Never lose track of learning progress with our complete history system.",
      color: "green"
    },
    {
      icon: Target,
      title: "Automatic Grading",
      description: "Instant feedback with intelligent grading. Students get immediate results to accelerate their learning.",
      color: "red"
    },
    {
      icon: BookOpen,
      title: "Multi-Subject Support",
      description: "From Math to Science, English to History - generate worksheets for any subject and grade level.",
      color: "yellow"
    },
    {
      icon: Users,
      title: "User-Friendly Interface",
      description: "Intuitive design that works for educators, parents, and students. No learning curve required.",
      color: "indigo"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Elementary Teacher",
      content: "This platform has revolutionized how I create worksheets. The AI understands exactly what I need!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Homeschool Parent",
      content: "My kids love the variety of problems. The analytics help me understand their progress perfectly.",
      rating: 5
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Education Specialist",
      content: "The most comprehensive worksheet platform I've used. The grading feature saves me hours every week.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Monthly",
      price: "$9.99",
      period: "/month",
      description: "Perfect for trying out our platform",
      features: [
        "50 AI worksheet generations",
        "Basic analytics",
        "All subjects supported",
        "Automatic grading",
        "Email support"
      ],
      buttonText: "Start Monthly",
      popular: false
    },
    {
      name: "Annual",
      price: "$99.99",
      period: "/year",
      description: "Save 17% with yearly billing",
      originalPrice: "$119.88",
      features: [
        "600 AI worksheet generations",
        "Advanced analytics & insights",
        "All subjects supported",
        "Automatic grading",
        "Priority support",
        "Export to PDF/Word",
        "Custom branding"
      ],
      buttonText: "Choose Annual",
      popular: false
    },
    {
      name: "Lifetime",
      price: "$299.99",
      period: "one-time",
      description: "Best value - pay once, use forever!",
      originalPrice: "$1,199.88",
      features: [
        "Unlimited AI generations",
        "Premium analytics & reporting",
        "All current & future subjects",
        "Advanced grading algorithms",
        "VIP support",
        "All export formats",
        "White-label solution",
        "API access",
        "Early access to new features"
      ],
      buttonText: "Get Lifetime Access",
      popular: true,
      savings: "Save $900+"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Worksheets Generated" },
    { number: "500+", label: "Happy Educators" },
    { number: "50,000+", label: "Problems Solved" },
    { number: "98%", label: "Satisfaction Rate" }
  ];

  const handlePlanClick = async (plan) => {
    // If user is not logged in, redirect to login
    if (!user) {
      navigate('/login', { state: { redirectTo: '/pricing', selectedPlan: plan } });
      return;
    }

    setLoadingPlan(plan);
    try {
      await paymentService.createCheckoutSession(plan);
      // Stripe will redirect to checkout page
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`fixed w-full z-50 ${isDarkMode ? 'bg-gray-900/95 backdrop-blur-sm border-gray-800' : 'bg-white/95 backdrop-blur-sm border-gray-200'} border-b transition-all`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <span className={`ml-3 text-xl font-bold ${darkMode.text}`}>BrainyBees</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`${darkMode.textSecondary} hover:${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>Features</a>
              <a href="#pricing" className={`${darkMode.textSecondary} hover:${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>Pricing</a>
              <a href="#testimonials" className={`${darkMode.textSecondary} hover:${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>Reviews</a>
              
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <Link
                to="/login"
                className={`px-4 py-2 rounded-lg transition-colors ${darkMode.buttonSecondary} border`}
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className={`px-4 py-2 rounded-lg transition-colors ${darkMode.buttonPrimary}`}
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className={`md:hidden border-t ${darkMode.border} py-4 space-y-4`}>
              <a href="#features" className={`block ${darkMode.textSecondary} hover:${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>Features</a>
              <a href="#pricing" className={`block ${darkMode.textSecondary} hover:${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>Pricing</a>
              <a href="#testimonials" className={`block ${darkMode.textSecondary} hover:${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>Reviews</a>
              <div className="flex flex-col space-y-2 pt-4">
                <Link to="/login" className={`text-center px-4 py-2 rounded-lg transition-colors ${darkMode.buttonSecondary} border`}>Sign In</Link>
                <Link to="/login" className={`text-center px-4 py-2 rounded-lg transition-colors ${darkMode.buttonPrimary}`}>Get Started</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-purple-500 mr-2" />
              <span className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} font-medium`}>AI-Powered Educational Worksheets</span>
            </div>

            <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-bold ${darkMode.text} mb-6`}>
              Create <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Amazing</span> Worksheets in <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">Seconds</span>
            </h1>

            <p className={`text-lg sm:text-xl ${darkMode.textSecondary} max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed`}>
              Transform education with AI-powered worksheet generation. Create customizable, engaging worksheets for any subject and grade level. Track progress, analyze performance, and accelerate learning.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16">
              <Link
                to="/login"
                className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center"
              >
                Start Creating Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all border ${darkMode.buttonSecondary} hover:shadow-lg transform hover:scale-105`}
              >
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-3xl lg:text-4xl font-bold ${darkMode.text} mb-2`}>{stat.number}</div>
                  <div className={`text-sm ${darkMode.textSecondary}`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${darkMode.text} mb-4`}>Why Choose BrainyBees?</h2>
            <p className={`text-xl ${darkMode.textSecondary} max-w-3xl mx-auto`}>
              Experience the future of educational content creation with our comprehensive platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                purple: 'from-purple-500 to-purple-600',
                blue: 'from-blue-500 to-blue-600',
                green: 'from-green-500 to-green-600',
                red: 'from-red-500 to-red-600',
                yellow: 'from-yellow-500 to-yellow-600',
                indigo: 'from-indigo-500 to-indigo-600'
              };

              return (
                <div key={index} className={`${darkMode.card} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}>
                  <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[feature.color]} rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`text-xl font-bold ${darkMode.text} mb-4`}>{feature.title}</h3>
                  <p className={`${darkMode.textSecondary} leading-relaxed`}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${darkMode.text} mb-4`}>Simple, Transparent Pricing</h2>
            <p className={`text-xl ${darkMode.textSecondary} max-w-3xl mx-auto`}>
              Choose the plan that works best for you. Upgrade or cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative ${darkMode.card} p-8 rounded-2xl shadow-lg ${
                  plan.popular ? 'ring-2 ring-purple-500 transform scale-105' : ''
                } hover:shadow-xl transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      🔥 Best Value
                    </div>
                  </div>
                )}

                {plan.savings && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {plan.savings}
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold ${darkMode.text} mb-2`}>{plan.name}</h3>
                  <p className={`${darkMode.textSecondary} mb-4`}>{plan.description}</p>
                  
                  <div className="flex items-baseline justify-center">
                    <span className={`text-5xl font-bold ${darkMode.text}`}>{plan.price}</span>
                    <span className={`text-lg ${darkMode.textSecondary} ml-1`}>{plan.period}</span>
                  </div>
                  
                  {plan.originalPrice && (
                    <div className={`text-sm ${darkMode.textSecondary} mt-1`}>
                      <span className="line-through">{plan.originalPrice}</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className={`${darkMode.text}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanClick(plan.name.toLowerCase())}
                  disabled={loadingPlan === plan.name.toLowerCase()}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                      : `border ${darkMode.buttonSecondary}`
                  } ${loadingPlan === plan.name.toLowerCase() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingPlan === plan.name.toLowerCase() ? 'Processing...' : plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={`py-20 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${darkMode.text} mb-4`}>Loved by Educators Worldwide</h2>
            <p className={`text-xl ${darkMode.textSecondary} max-w-3xl mx-auto`}>
              See what teachers, parents, and students are saying about BrainyBees
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`${darkMode.card} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all`}>
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className={`${darkMode.text} mb-6 italic`}>"{testimonial.content}"</p>
                <div>
                  <div className={`font-semibold ${darkMode.text}`}>{testimonial.name}</div>
                  <div className={`text-sm ${darkMode.textSecondary}`}>{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className={`text-4xl font-bold ${darkMode.text} mb-6`}>
            Ready to Transform Education?
          </h2>
          <p className={`text-xl ${darkMode.textSecondary} mb-8`}>
            Join thousands of educators who are already creating amazing worksheets with AI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center"
            >
              Get Lifetime Access Now
              <Zap className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
            </Link>
            <a
              href="#pricing"
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all border ${darkMode.buttonSecondary} hover:shadow-lg transform hover:scale-105`}
            >
              View All Plans
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-t py-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <span className={`ml-2 text-lg font-bold ${darkMode.text}`}>BrainyBees</span>
              </div>
              <p className={`${darkMode.textSecondary} mb-4 max-w-md`}>
                Empowering educators with AI-powered worksheet generation. Create, track, and analyze educational content like never before.
              </p>
              <div className="flex space-x-4">
                <Shield className={`w-5 h-5 ${darkMode.textMuted}`} />
                <span className={`text-sm ${darkMode.textMuted}`}>Secure & Private</span>
              </div>
            </div>

            <div>
              <h3 className={`font-semibold ${darkMode.text} mb-4`}>Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className={`${darkMode.textSecondary} hover:${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>Features</a></li>
                <li><a href="#pricing" className={`${darkMode.textSecondary} hover:${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>Pricing</a></li>
                <li><Link to="/login" className={`${darkMode.textSecondary} hover:${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h3 className={`font-semibold ${darkMode.text} mb-4`}>Support</h3>
              <ul className="space-y-2">
                <li><span className={`${darkMode.textSecondary}`}>Help Center</span></li>
                <li><span className={`${darkMode.textSecondary}`}>Contact Us</span></li>
                <li><span className={`${darkMode.textSecondary}`}>Privacy Policy</span></li>
                <li><span className={`${darkMode.textSecondary}`}>Terms of Service</span></li>
              </ul>
            </div>
          </div>

          <div className={`border-t ${darkMode.border} mt-8 pt-8 text-center`}>
            <p className={`${darkMode.textSecondary}`}>
              © 2024 BrainyBees. All rights reserved. Made with ❤️ for educators worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;