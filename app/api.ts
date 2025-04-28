import axios from 'axios';

// API base URL - default to localhost if not provided in environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface CodeRequest {
  code: string;
  instruction: string;
}

interface CodeResponse {
  modified_code: string;
  explanation: string;
}

export const iterateCode = async (data: CodeRequest): Promise<CodeResponse> => {
  try {
    const response = await api.post<CodeResponse>('/iterate-code', data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.detail || error.message;
      throw new Error(`API Error: ${errorMessage}`);
    }
    throw error;
  }
};

export default api; 