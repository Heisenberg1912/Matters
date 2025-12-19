import express from 'express';
import Project from '../models/Project.js';
import { authenticate } from '../middleware/auth.js';
import { getPusherServer } from '../utils/realtime.js';

const router = express.Router();

router.post('/auth', authenticate, async (req, res) => {
  try {
    const pusher = getPusherServer();
    if (!pusher) {
      return res.status(503).json({
        success: false,
        error: 'Real-time service not configured.',
      });
    }

    const { socket_id: socketId, channel_name: channelName } = req.body;

    if (!socketId || !channelName) {
      return res.status(400).json({
        success: false,
        error: 'Socket ID and channel name are required.',
      });
    }

    const userId = req.userId?.toString();

    if (channelName === `private-user-${userId}`) {
      const auth = pusher.authenticate(socketId, channelName);
      return res.send(auth);
    }

    if (channelName.startsWith('private-project-')) {
      const projectId = channelName.replace('private-project-', '');
      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found.',
        });
      }

      const hasAccess =
        project.owner.toString() === userId ||
        project.contractor?.toString() === userId ||
        project.team.some((member) => member.user.toString() === userId) ||
        ['admin', 'superadmin'].includes(req.user.role);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized for this channel.',
        });
      }

      const auth = pusher.authenticate(socketId, channelName);
      return res.send(auth);
    }

    return res.status(403).json({
      success: false,
      error: 'Unsupported channel.',
    });
  } catch (error) {
    console.error('Realtime auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to authorize channel.',
    });
  }
});

export default router;
