import { ChatMessage } from '../types';

const API_KEY = import.meta.env.VITE_QWEN_API_KEY;
const BASE_URL = import.meta.env.VITE_QWEN_BASE_URL;

export async function getQwenResponse(messages: ChatMessage[]): Promise<string> {
  if (!API_KEY) {
    throw new Error('Qwen API Key is missing. Please configure it in .env');
  }

  const formattedMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // System prompt to set the persona
  const systemMessage = {
    role: 'system',
    content: `你是一位专业的AI医师，专门负责解答关于肠道息肉、肠镜检查、术后康复及预防的相关问题。
你的回答应当专业、严谨且富有同情心。
请使用 Markdown 格式来组织你的回答，使内容具有良好的可读性：
1. 使用适当的分段（两个换行符）。
2. 使用列表（无序或有序列表）来阐述多个要点或建议。
3. 对关键术语或重要提醒使用加粗。
如果用户询问非医学问题，请礼貌地引导回健康话题。请记住，你的建议不能替代专业医生的面诊。`
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    console.log('Sending request to Qwen API...', { url: `${BASE_URL}/chat/completions`, model: 'qwen-plus' });

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [systemMessage, ...formattedMessages],
        temperature: 0.7,
        max_tokens: 1500
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Qwen API Error Response:', errorData);
      throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络或稍后再试。');
    }
    console.error('Qwen API Fetch Error:', error);
    throw error;
  }
}
