import express from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';
import { triggerProjectEvent, triggerUserEvent } from '../utils/realtime.js';
import Project from '../models/Project.js';
import Stage from '../models/Stage.js';
import Bill from '../models/Bill.js';

const router = express.Router();

// Chat history storage (in-memory for now, could be moved to MongoDB)
const chatHistories = new Map();

/**
 * POST /api/chat
 * Send a message to the AI assistant
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { message, projectId, context, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required.',
      });
    }

    // Build context from project data if projectId is provided
    let projectContext = '';
    if (projectId) {
      const project = await Project.findById(projectId)
        .populate('currentStage', 'name status progress')
        .populate('owner', 'name');

      if (project) {
        const stages = await Stage.find({ project: projectId }).sort({ order: 1 });
        const bills = await Bill.find({ project: projectId }).limit(5).sort({ billDate: -1 });

        projectContext = `
Current Project Context:
- Project Name: ${project.name}
- Status: ${project.status}
- Type: ${project.type}
- Current Stage: ${project.currentStage?.name || 'Not set'}
- Progress: ${project.progress?.percentage || 0}%
- Budget: ₹${project.budget?.estimated?.toLocaleString() || 0} (Spent: ₹${project.budget?.spent?.toLocaleString() || 0})
- Location: ${project.location?.city || 'Not specified'}

Stages:
${stages.map((s) => `- ${s.name}: ${s.status} (${s.progress}%)`).join('\n')}

Recent Bills:
${bills.map((b) => `- ${b.title}: ₹${b.amount.total.toLocaleString()} (${b.payment.status})`).join('\n')}
`;
      }
    }

    // Prepare the prompt for Gemini
    const systemPrompt = `You are Matters AI, an intelligent construction project assistant. You help users with:
- Construction project management and planning
- Budget tracking and cost optimization
- Stage progress monitoring
- Weather-based work scheduling
- Material inventory management
- Safety compliance
- Best practices for construction work

Be concise, practical, and helpful. When discussing construction topics, provide actionable advice.
${projectContext}
${context ? `Additional Context: ${context}` : ''}`;

    // Build conversation history
    const conversationHistory = history.map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    }));

    // Check if Gemini is enabled
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.MATTERS_GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-pro';

    if (!geminiApiKey || process.env.GEMINI_ENABLED !== 'true') {
      // Return a helpful response without AI
      return res.json({
        success: true,
        data: {
          response: getDefaultResponse(message, projectContext),
          mock: true,
        },
      });
    }

    // Call Gemini API
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
        {
          contents: [
            ...conversationHistory,
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        }
      );

      const aiResponse =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'I apologize, but I could not generate a response. Please try again.';

      // Store in history
      const chatId = `${req.userId}-${projectId || 'general'}`;
      if (!chatHistories.has(chatId)) {
        chatHistories.set(chatId, []);
      }
      const chatHistory = chatHistories.get(chatId);
      chatHistory.push(
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: aiResponse, timestamp: new Date() }
      );
      // Keep only last 50 messages
      if (chatHistory.length > 50) {
        chatHistories.set(chatId, chatHistory.slice(-50));
      }

      res.json({
        success: true,
        data: {
          response: aiResponse,
          conversationId: chatId,
        },
      });

      await Promise.all([
        triggerUserEvent(req.userId, 'chat.message', {
          projectId: projectId || null,
          message: { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
        }),
        projectId
          ? triggerProjectEvent(projectId, 'chat.message', {
              message: { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
            })
          : Promise.resolve(false),
      ]);
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError.response?.data || geminiError.message);

      // Fallback to default response
      res.json({
        success: true,
        data: {
          response: getDefaultResponse(message, projectContext),
          mock: true,
          error: 'AI service temporarily unavailable',
        },
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message.',
    });
  }
});

/**
 * POST /api/chat/vision
 * Analyze an image with AI
 */
router.post('/vision', authenticate, async (req, res) => {
  try {
    const { image, prompt = 'Analyze this construction site image and provide insights.' } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image is required.',
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.MATTERS_GEMINI_API_KEY;
    const visionModel = process.env.GEMINI_IMAGE_MODEL || process.env.MATTERS_VISION_MODEL || 'gemini-pro-vision';

    if (!geminiApiKey) {
      return res.json({
        success: true,
        data: {
          response: 'Image analysis is not available. Please configure the Gemini API key.',
          mock: true,
        },
      });
    }

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${visionModel}:generateContent?key=${geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                { text: `You are a construction site analyst. ${prompt}` },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: image.replace(/^data:image\/\w+;base64,/, ''),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
          },
        }
      );

      const analysisResponse =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Unable to analyze the image. Please try again.';

      res.json({
        success: true,
        data: {
          response: analysisResponse,
        },
      });
    } catch (visionError) {
      console.error('Vision API error:', visionError.response?.data || visionError.message);

      res.json({
        success: true,
        data: {
          response:
            'I can see this is a construction-related image. For detailed analysis, please ensure the image is clear and shows the work area properly.',
          mock: true,
        },
      });
    }
  } catch (error) {
    console.error('Vision chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image.',
    });
  }
});

/**
 * GET /api/chat/history/:projectId
 * Get chat history for a project
 */
router.get('/history/:projectId', authenticate, async (req, res) => {
  try {
    const chatId = `${req.userId}-${req.params.projectId}`;
    const history = chatHistories.get(chatId) || [];

    res.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history.',
    });
  }
});

/**
 * DELETE /api/chat/history/:projectId
 * Clear chat history for a project
 */
router.delete('/history/:projectId', authenticate, async (req, res) => {
  try {
    const chatId = `${req.userId}-${req.params.projectId}`;
    chatHistories.delete(chatId);

    res.json({
      success: true,
      message: 'Chat history cleared.',
    });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat history.',
    });
  }
});

/**
 * POST /api/chat/suggestions
 * Get AI suggestions for the project
 */
router.post('/suggestions', authenticate, async (req, res) => {
  try {
    const { projectId, type = 'general' } = req.body;

    let suggestions = [];

    if (projectId) {
      const project = await Project.findById(projectId);
      const stages = await Stage.find({ project: projectId });
      const currentStage = stages.find((s) => s.status === 'in_progress');

      // Generate contextual suggestions
      if (project) {
        suggestions = [
          {
            type: 'progress',
            title: 'Update Progress',
            message: `Your ${currentStage?.name || 'current stage'} is at ${currentStage?.progress || 0}%. Would you like to update the progress?`,
          },
          {
            type: 'budget',
            title: 'Budget Check',
            message: `You've spent ${project.budgetUtilization}% of your budget. Would you like to see a detailed breakdown?`,
          },
          {
            type: 'weather',
            title: 'Weather Forecast',
            message: 'Check the weather forecast to plan outdoor construction work.',
          },
          {
            type: 'task',
            title: 'Pending Tasks',
            message: 'Review and update pending tasks for your current stage.',
          },
        ];
      }
    } else {
      suggestions = [
        {
          type: 'create',
          title: 'Create Project',
          message: 'Start a new construction project and track its progress.',
        },
        {
          type: 'tips',
          title: 'Construction Tips',
          message: 'Get best practices and tips for your construction project.',
        },
        {
          type: 'costs',
          title: 'Cost Estimation',
          message: 'Learn about typical construction costs in your area.',
        },
      ];
    }

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions.',
    });
  }
});

// Helper function for default responses
function getDefaultResponse(message, context) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm Matters AI, your construction project assistant. How can I help you today?";
  }

  if (lowerMessage.includes('help')) {
    return `I can help you with:
• Project management and planning
• Budget tracking and cost analysis
• Stage progress monitoring
• Weather-based scheduling
• Material inventory
• Safety compliance

What would you like to know more about?`;
  }

  if (lowerMessage.includes('budget') || lowerMessage.includes('cost')) {
    if (context) {
      return 'Based on your project data, I can see your budget utilization. For detailed cost optimization tips, consider tracking expenses by category and comparing with industry benchmarks.';
    }
    return 'To help with budgeting, please select a project first. I can then provide insights based on your spending patterns and suggest ways to optimize costs.';
  }

  if (lowerMessage.includes('stage') || lowerMessage.includes('progress')) {
    if (context) {
      return 'I can see your project stages. To update progress, go to the Stages section and mark completed tasks. Would you like tips on accelerating your current stage?';
    }
    return 'Project stages typically include: Ideation, Planning, Foundation, Structure, Electrical, Plumbing, Finishing, Inspection, and Handover. Each stage has specific tasks and milestones.';
  }

  if (lowerMessage.includes('weather')) {
    return 'Weather plays a crucial role in construction. Clear weather is ideal for concrete work and exterior painting. Avoid heavy outdoor work during rain. I recommend checking the 7-day forecast before scheduling major outdoor activities.';
  }

  if (lowerMessage.includes('safety')) {
    return `Key safety practices for construction sites:
• Always wear PPE (helmets, vests, boots)
• Keep work areas clean and organized
• Follow electrical safety protocols
• Ensure proper scaffolding
• Regular safety briefings
• Emergency procedures in place`;
  }

  return "I'm here to help with your construction project. You can ask me about project management, budgeting, stages, weather planning, materials, or safety. What would you like to know?";
}

export default router;
