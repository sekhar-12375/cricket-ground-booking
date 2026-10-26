export type UserRole = 'USER' | 'ADMIN';

export type GroundAvailability = 'AVAILABLE' | 'UNAVAILABLE';

export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface User {
  userId: string;
  name: string;
  phone: string;
  email: string;
  role: 'USER';
  createdAt?: string;
  updatedAt?: string;
}

export interface Admin {
  adminId: string;
  name: string;
  email: string;
  role: 'ADMIN';
  createdAt?: string;
  updatedAt?: string;
}

export interface Ground {
  groundId: string;
  groundName: string;
  location: string;
  description: string;
  hourlyPrice: number;
  openingTime: string; // e.g. "06:00"
  closingTime: string; // e.g. "22:00"
  availability: GroundAvailability;
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  bookingId: string;
  userId: string;
  groundId: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM
  numberOfPlayers: number;
  specialRequest?: string;
  amount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
  // joined info for display
  groundName?: string;
  groundLocation?: string;
  groundImageUrl?: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
}

export interface Payment {
  paymentId: string;
  bookingId: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

export interface AvailabilityResult {
  isAvailable: boolean;
  message: string;
  requestedDate: string;
  requestedStart: string;
  requestedEnd: string;
  durationHours: number;
  hourlyPrice: number;
  totalAmount: number;
  conflictingBookings?: Array<{
    startTime: string;
    endTime: string;
  }>;
}

export interface AdminDashboardStats {
  totalGrounds: number;
  availableGrounds: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingPayments: number;
  totalRevenue: number;
  recentBookings: Booking[];
}
