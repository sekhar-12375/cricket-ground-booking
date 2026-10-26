import {
  ApiResponse,
  Ground,
  Booking,
  Payment,
  AvailabilityResult,
  AdminDashboardStats,
  User,
  Admin
} from '../types';

let authToken: string | null = localStorage.getItem('cricket_auth_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('cricket_auth_token', token);
  } else {
    localStorage.removeItem('cricket_auth_token');
  }
}

export function getToken(): string | null {
  return authToken;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'Invalid server response'
  }));

  if (!response.ok && data.success !== false) {
    return {
      success: false,
      message: data.message || `Request failed with status ${response.status}`,
      errorCode: data.errorCode || 'HTTP_ERROR'
    };
  }

  return data;
}

// Auth API
export const authApi = {
  async register(data: { name: string; phone: string; email: string; password: string; confirmPassword?: string }) {
    return request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async login(data: { email: string; password: string; role?: 'USER' | 'ADMIN' }) {
    const res = await request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.success && res.data?.token) {
      setToken(res.data.token);
    }
    return res;
  },

  async logout() {
    const res = await request('/api/auth/logout', { method: 'POST' });
    setToken(null);
    return res;
  },

  async getMe() {
    return request<User | Admin>('/api/auth/me');
  }
};

// Grounds API
export const groundsApi = {
  async getGrounds(params?: {
    search?: string;
    location?: string;
    availability?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, String(val));
        }
      });
    }
    const qStr = query.toString();
    return request<Ground[]>(`/api/grounds${qStr ? `?${qStr}` : ''}`);
  },

  async getGround(id: string) {
    return request<Ground>(`/api/grounds/${id}`);
  },

  async checkAvailability(id: string, date: string, startTime: string, endTime: string) {
    const query = new URLSearchParams({ date, startTime, endTime }).toString();
    return request<AvailabilityResult>(`/api/grounds/${id}/availability?${query}`);
  }
};

// Bookings API
export const bookingsApi = {
  async createBooking(data: {
    groundId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    numberOfPlayers?: number;
    specialRequest?: string;
  }) {
    return request<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getMyBookings() {
    return request<Booking[]>('/api/bookings/my');
  },

  async getBooking(id: string) {
    return request<Booking & { payment?: Payment }>(`/api/bookings/${id}`);
  },

  async cancelBooking(id: string) {
    return request<{ bookingId: string; bookingStatus: string; paymentStatus: string }>(`/api/bookings/${id}/cancel`, {
      method: 'PUT'
    });
  }
};

// Payment API
export const paymentsApi = {
  async getInvoice(bookingId: string) {
    return request('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify({ bookingId })
    });
  },

  async verifyPayment(data: {
    bookingId: string;
    simulateOutcome: 'SUCCESS' | 'FAILURE';
    paymentMethod?: string;
  }) {
    return request<{
      bookingId: string;
      transactionId: string;
      paymentStatus: string;
      bookingStatus: string;
      notificationStatus: string;
    }>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getPayment(bookingId: string) {
    return request<Payment>(`/api/payments/${bookingId}`);
  }
};

// Admin API
export const adminApi = {
  async getDashboard() {
    return request<AdminDashboardStats>('/api/admin/dashboard');
  },

  async getGrounds() {
    return request<Ground[]>('/api/admin/grounds');
  },

  async addGround(data: Partial<Ground>) {
    return request<Ground>('/api/admin/grounds', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateGround(id: string, data: Partial<Ground>) {
    return request<Ground>(`/api/admin/grounds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async getBookings(params?: {
    search?: string;
    bookingStatus?: string;
    paymentStatus?: string;
    groundId?: string;
    date?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, String(val));
        }
      });
    }
    const qStr = query.toString();
    return request<Booking[]>(`/api/admin/bookings${qStr ? `?${qStr}` : ''}`);
  },

  async updateBookingStatus(id: string, bookingStatus: string) {
    return request(`/api/admin/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ bookingStatus })
    });
  }
};
