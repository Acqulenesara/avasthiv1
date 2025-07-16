import { useState, useCallback, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, TrendingUp, Calendar, BarChart3, LogOut, Plus, Eye, Lock, User, Mail, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

// Color palette
const COLORS = ['#4CAF50', '#FFC107', '#F44336'];

const JournalApp = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [entries, setEntries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [newEntry, setNewEntry] = useState({ mood: '', entry: '' });
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // API Functions
  const apiCall = async (endpoint, options = {}) => {
    // For demo purposes, we'll simulate API calls
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (endpoint === '/auth/login') {
          const body = JSON.parse(options.body);
          if (body.username && body.password) {
            resolve({
              access_token: 'mock-token',
              user_id: 1,
              username: body.username
            });
          } else {
            reject(new Error('Invalid credentials'));
          }
        } else if (endpoint === '/auth/register') {
          const body = JSON.parse(options.body);
          if (body.username && body.email && body.password) {
            resolve({ message: 'Registration successful' });
          } else {
            reject(new Error('Missing required fields'));
          }
        } else {
          resolve({
            entries: [],
            total_entries: 0,
            avg_sentiment: 0.5,
            sentiment_trend: [],
            mood_frequency: [],
            sentiment_distribution: []
          });
        }
      }, 1000);
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!authForm.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (authForm.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (authMode === 'register') {
      if (!authForm.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(authForm.email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }

    if (!authForm.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (authForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const login = async (credentials) => {
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      setUser({ id: response.user_id, username: response.username });
      return true;
    } catch (error) {
      setErrors({ submit: error.message });
      return false;
    }
  };

  const register = async (userData) => {
    try {
      await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      // Auto-login after registration
      return await login({ username: userData.username, password: userData.password });
    } catch (error) {
      setErrors({ submit: error.message });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setActiveTab('dashboard');
    setAuthForm({ username: '', email: '', password: '' });
    setErrors({});
  };

  const submitEntry = async () => {
    if (!newEntry.mood || !newEntry.entry) {
      alert('Please fill in both mood and entry fields');
      return;
    }

    setLoading(true);
    try {
      await apiCall('/journal/entry', {
        method: 'POST',
        body: JSON.stringify(newEntry)
      });

      setNewEntry({ mood: '', entry: '' });
      alert('Entry saved successfully!');
      fetchEntries();
      fetchAnalytics();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    const success = authMode === 'login'
      ? await login({ username: authForm.username, password: authForm.password })
      : await register(authForm);

    if (success) {
      setAuthForm({ username: '', email: '', password: '' });
      setErrors({});
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setAuthForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setErrors({});
    setAuthForm({ username: '', email: '', password: '' });
  };

  const fetchEntries = useCallback(async () => {
    try {
      const response = await apiCall('/journal/entries?limit=10');
      setEntries(response.entries || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await apiCall('/journal/analytics');
      setAnalytics(response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchEntries();
      fetchAnalytics();
    }
  }, [user, fetchEntries, fetchAnalytics]);

  // Enhanced Auth Component
  const AuthComponent = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-md transform transition-all duration-300 hover:shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Personal Journal
          </h1>
          <p className="text-gray-600 mt-2">Track your thoughts and emotions</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex mb-6 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => switchAuthMode('login')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
              authMode === 'login'
                ? 'bg-white text-indigo-600 shadow-sm transform scale-105'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => switchAuthMode('register')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
              authMode === 'register'
                ? 'bg-white text-indigo-600 shadow-sm transform scale-105'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={authForm.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your username"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          {/* Email Field (Register only) */}
          {authMode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleAuthSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Please wait...</span>
              </>
            ) : (
              <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => switchAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="ml-1 text-indigo-600 hover:text-indigo-800 font-medium"
              disabled={loading}
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  // Dashboard Component
  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.total_entries || 0}</p>
            </div>
            <BookOpen className="h-8 w-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Sentiment</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.avg_sentiment?.toFixed(2) || '0.00'}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Streak</p>
              <p className="text-2xl font-bold text-gray-900">3 days</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Sentiment Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.sentiment_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sentiment" stroke="#4F46E5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Mood Frequency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.mood_frequency || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mood" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#06B6D4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analytics?.sentiment_distribution || []}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, count }) => `${category}: ${count}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {analytics?.sentiment_distribution?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // New Entry Component
  const NewEntry = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Write New Entry</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling?</label>
          <input
            type="text"
            value={newEntry.mood}
            onChange={(e) => setNewEntry({...newEntry, mood: e.target.value})}
            placeholder="e.g., Happy, Anxious, Excited..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Journal Entry</label>
          <textarea
            value={newEntry.entry}
            onChange={(e) => setNewEntry({...newEntry, entry: e.target.value})}
            placeholder="Write about your day, thoughts, or feelings..."
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          onClick={submitEntry}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </div>
  );

  // Recent Entries Component
  const RecentEntries = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Recent Entries</h2>
      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No entries yet. Start writing!</p>
        ) : (
          entries.map((entry, index) => (
            <div key={index} className="border-l-4 border-indigo-500 pl-4 py-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-gray-500">{entry.entry_date}</p>
                  <p className="text-sm font-medium text-gray-700">Mood: {entry.mood}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  entry.sentiment_score > 0.1 ? 'bg-green-100 text-green-800' :
                  entry.sentiment_score < -0.1 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {entry.sentiment_score?.toFixed(2) || '0.00'}
                </span>
              </div>
              <p className="text-gray-800">{entry.entry?.length > 150 ? `${entry.entry.substring(0, 150)}...` : entry.entry}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (!user) {
    return <AuthComponent />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Personal Journal</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.username}!</span>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'new-entry', label: 'New Entry', icon: Plus },
              { id: 'entries', label: 'Recent Entries', icon: Eye }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'new-entry' && <NewEntry />}
        {activeTab === 'entries' && <RecentEntries />}
      </main>
    </div>
  );
};

export default JournalApp;