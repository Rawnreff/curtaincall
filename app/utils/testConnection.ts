/**
 * Utility untuk test koneksi ke backend
 */

import axios from 'axios';
import NETWORK_CONFIG from '../config/network.config';

export const testConnection = async (): Promise<{
  success: boolean;
  message: string;
  url: string;
}> => {
  const testUrl = `${NETWORK_CONFIG.API_BASE_URL}/users/login`;
  
  try {
    // Coba ping endpoint (dengan data dummy, expected to fail dengan 400 bukan network error)
    const response = await axios.post(
      testUrl,
      {},
      { timeout: 5000 }
    );
    
    return {
      success: true,
      message: 'Connection successful!',
      url: testUrl,
    };
  } catch (error: any) {
    // Jika dapat 400, berarti server accessible (bad request is ok)
    if (error.response?.status === 400) {
      return {
        success: true,
        message: 'Server is reachable (got validation error, which is expected)',
        url: testUrl,
      };
    }
    
    // Network error berarti tidak bisa connect
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        success: false,
        message: `Cannot connect to server at ${testUrl}\n\nMake sure:\n1. Backend is running\n2. IP address is correct: ${NETWORK_CONFIG.BACKEND_IP}\n3. Device and computer are on the same network`,
        url: testUrl,
      };
    }
    
    // Timeout
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: `Connection timeout to ${testUrl}`,
        url: testUrl,
      };
    }
    
    // Other errors
    return {
      success: false,
      message: `Connection test failed: ${error.message}`,
      url: testUrl,
    };
  }
};

