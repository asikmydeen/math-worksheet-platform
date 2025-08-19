import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { 
  Printer, 
  Save,
  Clock,
  Calendar,
  User
} from 'lucide-react';

function WorksheetView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worksheet, setWorksheet] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchWorksheet();
    } else {
      navigate('/worksheets');
    }
  }, [id]);

  const fetchWorksheet = async () => {
    try {
      const response = await api.get(`/worksheets/${id}`);
      setWorksheet(response.data.worksheet);
      
      // Initialize answers object
      const initialAnswers = {};
      response.data.worksheet.problems.forEach((_, index) => {
        initialAnswers[index] = '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching worksheet:', error);
      navigate('/worksheets');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (problemIndex, value) => {
    setAnswers({
      ...answers,
      [problemIndex]: value
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save answers to local storage or backend
      localStorage.setItem(`worksheet-${id}-answers`, JSON.stringify(answers));
      alert('Worksheet saved successfully!');
    } catch (error) {
      console.error('Error saving worksheet:', error);
      alert('Failed to save worksheet.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading worksheet...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!worksheet) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Worksheet not found</p>
          <button
            onClick={() => navigate('/worksheets')}
            className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Back to Worksheets
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons - Hidden on print */}
        <div className="no-print mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/worksheets')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Worksheets
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Worksheet
            </button>
          </div>
        </div>

        {/* Worksheet Content - Printable */}
        <div className="worksheet-container bg-white rounded-lg shadow-sm p-8 print:p-0 print:shadow-none">
          {/* Header */}
          <div className="worksheet-header mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{worksheet.title}</h1>
            <p className="text-gray-600">{worksheet.description}</p>
            
            {/* Worksheet Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-left">
                  <span className="font-medium">Name:</span>
                  <div className="border-b-2 border-gray-300 mt-1 h-6"></div>
                </div>
                <div className="text-center">
                  <span className="font-medium">Date:</span>
                  <div className="border-b-2 border-gray-300 mt-1 h-6"></div>
                </div>
                <div className="text-right">
                  <span className="font-medium">Score:</span>
                  <div className="border-b-2 border-gray-300 mt-1 h-6"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="worksheet-instructions mb-6 p-4 bg-gray-50 rounded-lg print:bg-transparent print:border print:border-gray-300">
            <h3 className="font-semibold text-gray-700 mb-2">Instructions:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Read each problem carefully</li>
              <li>• Show your work in the space provided</li>
              <li>• Write your final answer on the line</li>
              <li>• Check your work when finished</li>
            </ul>
          </div>

          {/* Problems */}
          <div className="worksheet-problems space-y-8">
            {worksheet.problems.map((problem, index) => (
              <div key={index} className="problem-item">
                <div className="flex items-start mb-3">
                  <span className="problem-number font-bold text-lg mr-3">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="problem-question text-lg text-gray-800 mb-3">
                      {problem.question}
                    </p>
                    
                    {/* Work Space */}
                    <div className="work-space mb-3">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="h-16 border-b border-gray-300"></div>
                        <div className="h-16 border-b border-gray-300"></div>
                      </div>
                    </div>
                    
                    {/* Answer Line */}
                    <div className="answer-line flex items-center">
                      <span className="font-medium text-gray-700 mr-3">Answer:</span>
                      <input
                        type="text"
                        value={answers[index] || ''}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        className="flex-1 border-b-2 border-gray-400 px-2 py-1 text-lg focus:outline-none focus:border-purple-500 print:border-gray-400"
                        placeholder=""
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="worksheet-footer mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Generated on {new Date().toLocaleDateString()}</p>
            <p className="mt-1">Grade {worksheet.grade} • {worksheet.topic} • {worksheet.problems.length} Problems</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .worksheet-container, .worksheet-container * {
            visibility: visible;
          }
          
          .worksheet-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 1in;
            margin: 0;
          }
          
          .no-print {
            display: none !important;
          }
          
          .problem-item {
            page-break-inside: avoid;
          }
          
          input {
            border: none;
            border-bottom: 2px solid #000 !important;
          }
          
          .work-space div {
            border-bottom: 1px solid #000 !important;
          }
        }
      `}</style>
    </Layout>
  );
}

export default WorksheetView;