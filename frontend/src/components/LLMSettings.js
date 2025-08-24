import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from '../components/DarkModeWrapper';
import api from '../services/api';
import {
  Brain,
  Settings,
  RefreshCw,
  TestTube,
  Save,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Loader
} from 'lucide-react';

function LLMSettings() {
  const { isDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  
  const [settings, setSettings] = useState({
    apiKey: '',
    selectedModel: 'openai/gpt-4o-mini',
    modelConfig: {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1
    }
  });
  
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchModels();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/llm/settings');
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await api.get('/llm/models');
      if (response.data.success) {
        setModels(response.data.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await api.put('/llm/settings', settings);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        // Hide API key after saving
        setShowApiKey(false);
        if (settings.apiKey && settings.apiKey !== '***hidden***') {
          setSettings({ ...settings, apiKey: '***hidden***' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await api.post('/llm/test');
      if (response.data.success) {
        setMessage({ type: 'success', text: 'LLM configuration test passed!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'LLM test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleRefreshModels = async () => {
    setRefreshing(true);
    
    try {
      const response = await api.post('/llm/models/refresh');
      if (response.data.success) {
        setMessage({ type: 'success', text: `Refreshed ${response.data.count} models` });
        fetchModels(); // Reload the models list
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to refresh models' });
    } finally {
      setRefreshing(false);
    }
  };

  const selectedModelInfo = models.find(m => m.id === settings.selectedModel);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className={`p-6 ${darkMode.card} rounded-lg shadow-sm`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h2 className={`text-2xl font-bold ${darkMode.text}`}>LLM Configuration</h2>
        </div>
        <button
          onClick={handleRefreshModels}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Models</span>
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* API Key */}
        <div>
          <label className={`block text-sm font-medium ${darkMode.textSecondary} mb-2`}>
            OpenRouter API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="sk-or-v1-..."
              className={`w-full px-4 py-2 rounded-lg ${darkMode.input} pr-24`}
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className={`absolute right-2 top-2 px-3 py-1 text-sm rounded ${darkMode.hover}`}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className={`mt-1 text-sm ${darkMode.textSecondary}`}>
            Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-600">OpenRouter</a>
          </p>
        </div>

        {/* Model Selection */}
        <div>
          <label className={`block text-sm font-medium ${darkMode.textSecondary} mb-2`}>
            AI Model
          </label>
          <select
            value={settings.selectedModel}
            onChange={(e) => setSettings({ ...settings, selectedModel: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg ${darkMode.input}`}
          >
            <optgroup label="OpenAI Models">
              {models.filter(m => m.id.includes('openai')).map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - ${(model.pricing?.prompt * 1000) || 0}/1k tokens
                </option>
              ))}
            </optgroup>
            <optgroup label="Anthropic Claude">
              {models.filter(m => m.id.includes('anthropic') || m.id.includes('claude')).map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - ${(model.pricing?.prompt * 1000) || 0}/1k tokens
                </option>
              ))}
            </optgroup>
            <optgroup label="Google Models">
              {models.filter(m => m.id.includes('google') || m.id.includes('gemini')).map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - ${(model.pricing?.prompt * 1000) || 0}/1k tokens
                </option>
              ))}
            </optgroup>
            <optgroup label="Meta Llama">
              {models.filter(m => m.id.includes('meta-llama') || (m.id.includes('llama') && !m.id.includes('ollama'))).map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - ${(model.pricing?.prompt * 1000) || 0}/1k tokens
                </option>
              ))}
            </optgroup>
            <optgroup label="Mistral AI">
              {models.filter(m => m.id.includes('mistral') || m.id.includes('mixtral')).map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - ${(model.pricing?.prompt * 1000) || 0}/1k tokens
                </option>
              ))}
            </optgroup>
            <optgroup label="DeepSeek">
              {models.filter(m => m.id.includes('deepseek')).map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - ${(model.pricing?.prompt * 1000) || 0}/1k tokens
                </option>
              ))}
            </optgroup>
            <optgroup label="Other Models">
              {models.filter(m => 
                !m.id.includes('openai') && 
                !m.id.includes('anthropic') && 
                !m.id.includes('claude') && 
                !m.id.includes('google') && 
                !m.id.includes('gemini') && 
                !m.id.includes('meta-llama') && 
                !m.id.includes('llama') && 
                !m.id.includes('mistral') && 
                !m.id.includes('mixtral') && 
                !m.id.includes('deepseek')
              ).map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - ${(model.pricing?.prompt * 1000) || 0}/1k tokens
                </option>
              ))}
            </optgroup>
          </select>
          
          {selectedModelInfo && (
            <div className={`mt-2 p-3 rounded-lg ${darkMode.hover}`}>
              <div className="flex items-center justify-between text-sm">
                <span className={darkMode.textSecondary}>Context Length:</span>
                <span>{selectedModelInfo.contextLength?.toLocaleString() || 'N/A'} tokens</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className={darkMode.textSecondary}>Cost:</span>
                <span className="flex items-center">
                  <DollarSign className="h-3 w-3" />
                  {((selectedModelInfo.pricing?.prompt || 0) * 1000).toFixed(4)}/1k prompt tokens
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Model Configuration */}
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${darkMode.text}`}>Model Parameters</h3>
          
          <div>
            <label className={`block text-sm font-medium ${darkMode.textSecondary} mb-2`}>
              Temperature ({settings.modelConfig.temperature})
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.modelConfig.temperature}
              onChange={(e) => setSettings({
                ...settings,
                modelConfig: { ...settings.modelConfig, temperature: parseFloat(e.target.value) }
              })}
              className="w-full"
            />
            <p className={`text-xs ${darkMode.textSecondary} mt-1`}>
              Controls randomness: 0 = focused, 2 = creative
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode.textSecondary} mb-2`}>
              Max Tokens
            </label>
            <input
              type="number"
              min="100"
              max="8000"
              value={settings.modelConfig.maxTokens}
              onChange={(e) => setSettings({
                ...settings,
                modelConfig: { ...settings.modelConfig, maxTokens: parseInt(e.target.value) }
              })}
              className={`w-full px-4 py-2 rounded-lg ${darkMode.input}`}
            />
            <p className={`text-xs ${darkMode.textSecondary} mt-1`}>
              Maximum response length (affects cost)
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode.textSecondary} mb-2`}>
              Top P ({settings.modelConfig.topP})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.modelConfig.topP}
              onChange={(e) => setSettings({
                ...settings,
                modelConfig: { ...settings.modelConfig, topP: parseFloat(e.target.value) }
              })}
              className="w-full"
            />
            <p className={`text-xs ${darkMode.textSecondary} mt-1`}>
              Nucleus sampling: 1 = consider all tokens
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>

          <button
            onClick={handleTest}
            disabled={testing}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg ${darkMode.card} border ${darkMode.border} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50`}
          >
            {testing ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <TestTube className="h-5 w-5" />
            )}
            <span>{testing ? 'Testing...' : 'Test Configuration'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LLMSettings;