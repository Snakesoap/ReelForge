import axios from 'axios';

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
const RUNWAY_API_URL = 'https://api.runwayml.com/v1';

export interface RunwayTask {
  id: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  output?: {
    video?: string;
  };
}

export async function generateVideoWithRunway(
  prompt: string,
  model: string
): Promise<{ taskId: string }> {
  try {
    const modelMap: { [key: string]: string } = {
      'gen-4-turbo': 'gen4',
      'gen-4': 'gen4',
      'veo-3-1': 'veo-3-1',
    };

    const runwayModel = modelMap[model] || 'gen4';

    const response = await axios.post(
      `${RUNWAY_API_URL}/image_to_video`,
      {
        model: runwayModel,
        prompt: prompt,
        duration: 6, // 6 seconds
        watermark: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${RUNWAY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      taskId: response.data.id,
    };
  } catch (error) {
    console.error('Runway API error:', error);
    throw error;
  }
}

export async function checkRunwayStatus(taskId: string): Promise<RunwayTask> {
  try {
    const response = await axios.get(
      `${RUNWAY_API_URL}/tasks/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Runway status check error:', error);
    throw error;
  }
}

export async function getRunwayVideoUrl(taskId: string): Promise<string | null> {
  try {
    const task = await checkRunwayStatus(taskId);

    if (task.status === 'SUCCEEDED' && task.output?.video) {
      return task.output.video;
    }

    return null;
  } catch (error) {
    console.error('Error getting Runway video URL:', error);
    return null;
  }
}
