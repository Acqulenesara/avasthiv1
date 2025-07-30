import React, { useState } from 'react';
import { MessageCircle, Brain, Target, CheckCircle, ArrowRight, RotateCcw, Book, Heart, Lightbulb } from 'lucide-react';

const CBTTherapistSimulation = () => {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [completedScenarios, setCompletedScenarios] = useState([]);
  const [showReflection, setShowReflection] = useState(false);

  const scenarios = {
    exam_anxiety: {
      title: "Exam Anxiety",
      description: "Feeling overwhelmed and anxious before important exams",
      icon: <Brain className="w-6 h-6" />,
      color: "bg-blue-500",
      steps: [
        {
          type: "identification",
          therapist: "I understand you're feeling anxious about your upcoming exams. Can you tell me what specific thoughts are going through your mind when you think about the exam?",
          prompt: "Describe your anxious thoughts about the exam...",
          guidance: "Common thoughts: 'I'm going to fail', 'I'm not prepared enough', 'Everyone else is smarter'"
        },
        {
          type: "cognitive_restructuring",
          therapist: "Now let's examine these thoughts. Are these thoughts based on facts or assumptions? What evidence do you have for and against these thoughts?",
          prompt: "What evidence supports or contradicts your anxious thoughts?",
          guidance: "Look for concrete evidence vs. emotional reasoning"
        },
        {
          type: "behavioral_planning",
          therapist: "Let's create a practical study plan. What specific actions can you take to feel more prepared and confident?",
          prompt: "What concrete steps will you take to prepare?",
          guidance: "Break down studying into manageable chunks, set realistic goals"
        },
        {
          type: "coping_strategies",
          therapist: "What healthy coping strategies can you use when anxiety peaks during studying or the exam?",
          prompt: "List your coping strategies for managing anxiety...",
          guidance: "Deep breathing, progressive muscle relaxation, positive self-talk"
        }
      ]
    },
    social_anxiety: {
      title: "Social Anxiety",
      description: "Fear of social situations and being judged by others",
      icon: <MessageCircle className="w-6 h-6" />,
      color: "bg-green-500",
      steps: [
        {
          type: "identification",
          therapist: "Social situations can feel overwhelming. What specific social situations make you most anxious, and what thoughts go through your mind?",
          prompt: "Describe the social situations that make you anxious...",
          guidance: "Common fears: being judged, saying something wrong, being rejected"
        },
        {
          type: "cognitive_restructuring",
          therapist: "Let's challenge these social fears. How likely is it that the worst-case scenario will actually happen? What would you tell a friend having these thoughts?",
          prompt: "Challenge your social anxiety thoughts with evidence...",
          guidance: "Most people are focused on themselves, not judging you as harshly as you think"
        },
        {
          type: "behavioral_planning",
          therapist: "Let's create a gradual exposure plan. What small social steps can you take to build confidence?",
          prompt: "What small social challenges will you try this week?",
          guidance: "Start small: smile at a cashier, ask a question in class, join one conversation"
        },
        {
          type: "coping_strategies",
          therapist: "What strategies can help you manage anxiety in social moments?",
          prompt: "Your social anxiety coping toolkit...",
          guidance: "Grounding techniques, preparation phrases, focusing on others rather than yourself"
        }
      ]
    },
    perfectionism: {
      title: "Perfectionism",
      description: "Struggling with unrealistic standards and fear of failure",
      icon: <Target className="w-6 h-6" />,
      color: "bg-purple-500",
      steps: [
        {
          type: "identification",
          therapist: "Perfectionism can be exhausting. Can you tell me about a recent situation where your perfectionist thoughts caused you stress?",
          prompt: "Describe a time when perfectionism affected you...",
          guidance: "Notice all-or-nothing thinking, fear of making mistakes"
        },
        {
          type: "cognitive_restructuring",
          therapist: "Let's examine these perfectionist standards. Are they realistic? What would 'good enough' look like in this situation?",
          prompt: "What would realistic, achievable standards look like?",
          guidance: "Progress over perfection, learning from mistakes is valuable"
        },
        {
          type: "behavioral_planning",
          therapist: "How can you practice accepting 'good enough' in low-stakes situations?",
          prompt: "What small experiments in imperfection will you try?",
          guidance: "Submit work without endless revision, set time limits for tasks"
        },
        {
          type: "coping_strategies",
          therapist: "What can you do when perfectionist thoughts arise?",
          prompt: "Your anti-perfectionism strategies...",
          guidance: "Self-compassion, reframing mistakes as learning opportunities"
        }
      ]
    },
    low_mood: {
      title: "Low Mood & Motivation",
      description: "Feeling down, unmotivated, or experiencing depressive thoughts",
      icon: <Heart className="w-6 h-6" />,
      color: "bg-rose-500",
      steps: [
        {
          type: "identification",
          therapist: "I hear that you've been feeling down. Can you tell me about the thoughts that go through your mind when you're feeling this way?",
          prompt: "What thoughts do you have when feeling low?",
          guidance: "Common patterns: 'Nothing matters', 'I'm worthless', 'Things won't get better'"
        },
        {
          type: "cognitive_restructuring",
          therapist: "Depression often creates a negative filter. What evidence contradicts these negative thoughts about yourself or your situation?",
          prompt: "What evidence goes against your negative thoughts?",
          guidance: "Look for past successes, people who care about you, small positive moments"
        },
        {
          type: "behavioral_planning",
          therapist: "When we're down, action can help shift mood. What small, manageable activities could you commit to?",
          prompt: "What small activities will you do this week?",
          guidance: "Start tiny: take a walk, call a friend, do one small task"
        },
        {
          type: "coping_strategies",
          therapist: "What strategies can help when the low mood hits?",
          prompt: "Your mood-lifting toolkit...",
          guidance: "Pleasant activities, connecting with others, mindfulness, self-care"
        }
      ]
    }
  };

  const stepTypes = {
    identification: { name: "Thought Identification", icon: <Brain />, color: "text-blue-600" },
    cognitive_restructuring: { name: "Challenging Thoughts", icon: <Lightbulb />, color: "text-yellow-600" },
    behavioral_planning: { name: "Action Planning", icon: <Target />, color: "text-green-600" },
    coping_strategies: { name: "Coping Strategies", icon: <Heart />, color: "text-rose-600" }
  };

  const startScenario = (scenarioKey) => {
    setCurrentScenario(scenarioKey);
    setCurrentStep(0);
    setResponses([]);
    setCurrentResponse('');
    setShowReflection(false);
  };

  const nextStep = () => {
    if (currentResponse.trim()) {
      const newResponses = [...responses, currentResponse];
      setResponses(newResponses);
      setCurrentResponse('');

      if (currentStep < scenarios[currentScenario].steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        completeScenario();
      }
    }
  };

  const completeScenario = () => {
    if (!completedScenarios.includes(currentScenario)) {
      setCompletedScenarios([...completedScenarios, currentScenario]);
    }
    setShowReflection(true);
  };

  const resetScenario = () => {
    setCurrentScenario(null);
    setCurrentStep(0);
    setResponses([]);
    setCurrentResponse('');
    setShowReflection(false);
  };

  const generateInsights = () => {
    return {
      thoughtPatterns: responses[0] || "No response provided",
      challengedThoughts: responses[1] || "No response provided",
      actionPlan: responses[2] || "No response provided",
      copingStrategies: responses[3] || "No response provided"
    };
  };

  if (!currentScenario) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">CBT Therapist Simulation</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Practice cognitive behavioral therapy techniques through guided scenarios.
            This simulation helps you identify thought patterns, challenge negative thinking,
            and develop healthy coping strategies.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Book className="w-5 h-5 mr-2" />
            Choose Your Scenario
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <div
                key={key}
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-l-4 border-gray-200 hover:border-blue-500"
                onClick={() => startScenario(key)}
              >
                <div className="flex items-start">
                  <div className={`${scenario.color} text-white p-3 rounded-lg mr-4`}>
                    {scenario.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {scenario.title}
                      {completedScenarios.includes(key) && (
                        <CheckCircle className="w-5 h-5 text-green-500 inline ml-2" />
                      )}
                    </h3>
                    <p className="text-gray-600 mb-3">{scenario.description}</p>
                    <div className="text-sm text-blue-600 font-medium">
                      {scenario.steps.length} CBT Steps → Start Session
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">How This Works</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {Object.entries(stepTypes).map(([key, step]) => (
              <div key={key} className="text-center">
                <div className={`${step.color} mx-auto mb-2`}>{step.icon}</div>
                <div className="text-sm font-medium text-gray-700">{step.name}</div>
              </div>
            ))}
          </div>
          <p className="text-blue-700 mt-4 text-sm">
            Each scenario guides you through the core CBT process: identifying thoughts,
            challenging them with evidence, planning helpful actions, and building coping strategies.
          </p>
        </div>
      </div>
    );
  }

  if (showReflection) {
    const insights = generateInsights();
    const scenario = scenarios[currentScenario];

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Session Complete!</h2>
            <p className="text-gray-600">Great work processing your {scenario.title.toLowerCase()} concerns</p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Your Thought Patterns</h3>
              <p className="text-blue-700">{insights.thoughtPatterns}</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Challenged Thoughts</h3>
              <p className="text-yellow-700">{insights.challengedThoughts}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Action Plan</h3>
              <p className="text-green-700">{insights.actionPlan}</p>
            </div>

            <div className="bg-rose-50 rounded-lg p-4">
              <h3 className="font-semibold text-rose-800 mb-2">Coping Strategies</h3>
              <p className="text-rose-700">{insights.copingStrategies}</p>
            </div>
          </div>

          <div className="mt-8 text-center space-x-4">
            <button
              onClick={resetScenario}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Another Scenario
            </button>
            <button
              onClick={() => startScenario(currentScenario)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Restart This Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scenario = scenarios[currentScenario];
  const currentStepData = scenario.steps[currentStep];
  const stepType = stepTypes[currentStepData.type];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{scenario.title} Session</h1>
              <div className="flex items-center mt-2">
                <span className={stepType.color}>{stepType.icon}</span>
                <span className="ml-2">{stepType.name}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Step {currentStep + 1} of {scenario.steps.length}</div>
              <div className="w-32 bg-white/20 rounded-full h-2 mt-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / scenario.steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Therapist Message */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-800">{currentStepData.therapist}</p>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <strong>Guidance:</strong> {currentStepData.guidance}
              </div>
            </div>
          </div>
        </div>

        {/* User Response */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Response
          </label>
          <textarea
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder={currentStepData.prompt}
            rows={6}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={resetScenario}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Scenarios
            </button>

            <button
              onClick={nextStep}
              disabled={!currentResponse.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {currentStep === scenario.steps.length - 1 ? 'Complete Session' : 'Next Step'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CBTTherapistSimulation;