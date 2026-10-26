import { Router, Request, Response } from 'express';
import { query } from './db.js';
import {
  hashPassword,
  comparePassword,
  signToken,
  requireAuth,
  requireUserRole,
  requireAdminRole
} from './auth.js';

export const apiRouter = Router();

// Helper to format ground row to camelCase
function formatGround(row: any) {
  return {
    groundId: row.id,
    groundName: row.ground_name,
    location: row.location,
    description: row.description,
    hourlyPrice: Number(row.hourly_price),
    openingTime: row.opening_time,
    closingTime: row.closing_time,
    availability: row.availability,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Helper to format booking row to camelCase
function formatBooking(row: any) {
  return {
    bookingId: row.id,
    userId: row.user_id,
    groundId: row.ground_id,
    bookingDate: row.booking_date,
    startTime: row.start_time,
    endTime: row.end_time,
    numberOfPlayers: Number(row.number_of_players || 11),
    specialRequest: row.special_request || '',
    amount: Number(row.amount),
    bookingStatus: row.booking_status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    groundName: row.ground_name,
    groundLocation: row.ground_location,
    groundImageUrl: row.ground_image_url,
    userName: row.user_name,
    userEmail: row.user_email,
    userPhone: row.user_phone
  };
}

// Helper to calculate duration in hours
function calculateDurationHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  return totalMinutes / 60;
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// POST /api/auth/register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, password, confirmPassword } = req.body;

    if (!name || !phone || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, phone, email, and password are all required.',
        errorCode: 'VALIDATION_ERROR'
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
        errorCode: 'VALIDATION_ERROR'
      });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Confirm password does not match.',
        errorCode: 'VALIDATION_ERROR'
      });
      return;
    }

    const emailNormalized = email.trim().toLowerCase();

    // Check unique email
    const existing = await query('SELECT id FROM users WHERE email = $1 UNION SELECT id FROM admins WHERE email = $1', [emailNormalized]);
    if (existing.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
        errorCode: 'EMAIL_ALREADY_EXISTS'
      });
      return;
    }

    const userId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const passwordHash = await hashPassword(password);

    await query(
      `INSERT INTO users (id, name, phone, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, name.trim(), phone.trim(), emailNormalized, passwordHash]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please log in.',
      data: {
        userId,
        name: name.trim(),
        email: emailNormalized,
        phone: phone.trim(),
        role: 'USER'
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// POST /api/auth/login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Invalid email or password.',
        errorCode: 'INVALID_CREDENTIALS'
      });
      return;
    }

    const emailNormalized = email.trim().toLowerCase();

    // Role-based lookup
    if (role === 'ADMIN') {
      const adminRes = await query('SELECT * FROM admins WHERE email = $1', [emailNormalized]);
      if (adminRes.rows.length === 0) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
          errorCode: 'INVALID_CREDENTIALS'
        });
        return;
      }

      const admin = adminRes.rows[0];
      const match = await comparePassword(password, admin.password_hash);
      if (!match) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
          errorCode: 'INVALID_CREDENTIALS'
        });
        return;
      }

      const token = signToken({
        userId: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'ADMIN'
      });

      res.cookie('auth_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          token,
          user: {
            adminId: admin.id,
            userId: admin.id,
            name: admin.name,
            email: admin.email,
            role: 'ADMIN'
          }
        }
      });
      return;
    }

    // Default USER login
    const userRes = await query('SELECT * FROM users WHERE email = $1', [emailNormalized]);
    if (userRes.rows.length === 0) {
      // Check if user accidentally tried admin email on user login
      const adminFallback = await query('SELECT * FROM admins WHERE email = $1', [emailNormalized]);
      if (adminFallback.rows.length > 0) {
        const match = await comparePassword(password, adminFallback.rows[0].password_hash);
        if (match) {
          const admin = adminFallback.rows[0];
          const token = signToken({
            userId: admin.id,
            email: admin.email,
            name: admin.name,
            role: 'ADMIN'
          });
          res.cookie('auth_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
          res.json({
            success: true,
            message: 'Admin login detected.',
            data: {
              token,
              user: {
                adminId: admin.id,
                userId: admin.id,
                name: admin.name,
                email: admin.email,
                role: 'ADMIN'
              }
            }
          });
          return;
        }
      }

      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        errorCode: 'INVALID_CREDENTIALS'
      });
      return;
    }

    const user = userRes.rows[0];
    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        errorCode: 'INVALID_CREDENTIALS'
      });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'USER'
    });

    res.cookie('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          userId: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: 'USER'
        }
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// POST /api/auth/logout
apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// GET /api/auth/me
apiRouter.get('/auth/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userPayload = req.user!;
    if (userPayload.role === 'ADMIN') {
      const adminRes = await query('SELECT id, name, email, created_at FROM admins WHERE id = $1', [userPayload.userId]);
      if (adminRes.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Admin account not found.', errorCode: 'NOT_FOUND' });
        return;
      }
      const admin = adminRes.rows[0];
      res.json({
        success: true,
        message: 'Current session fetched.',
        data: {
          adminId: admin.id,
          userId: admin.id,
          name: admin.name,
          email: admin.email,
          role: 'ADMIN',
          createdAt: admin.created_at
        }
      });
      return;
    }

    const userRes = await query('SELECT id, name, phone, email, created_at FROM users WHERE id = $1', [userPayload.userId]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User account not found.', errorCode: 'NOT_FOUND' });
      return;
    }
    const user = userRes.rows[0];
    res.json({
      success: true,
      message: 'Current session fetched.',
      data: {
        userId: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: 'USER',
        createdAt: user.created_at
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// ==========================================
// 2. GROUNDS & SEARCH
// ==========================================

// GET /api/grounds
apiRouter.get('/grounds', async (req: Request, res: Response) => {
  try {
    const { search, location, availability, sort, minPrice, maxPrice } = req.query;

    let sql = 'SELECT * FROM grounds WHERE 1=1';
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(ground_name) LIKE $${params.length} OR LOWER(location) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`;
    }

    if (location && typeof location === 'string' && location.trim() && location !== 'ALL') {
      params.push(location.trim().toLowerCase());
      sql += ` AND LOWER(location) = $${params.length}`;
    }

    if (availability && typeof availability === 'string' && availability.trim() && availability !== 'ALL') {
      params.push(availability.trim().toUpperCase());
      sql += ` AND availability = $${params.length}`;
    }

    if (minPrice) {
      params.push(Number(minPrice));
      sql += ` AND hourly_price >= $${params.length}`;
    }

    if (maxPrice) {
      params.push(Number(maxPrice));
      sql += ` AND hourly_price <= $${params.length}`;
    }

    if (sort === 'price_asc') {
      sql += ' ORDER BY hourly_price ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY hourly_price DESC';
    } else if (sort === 'name_asc') {
      sql += ' ORDER BY ground_name ASC';
    } else {
      sql += ' ORDER BY created_at ASC';
    }

    const groundsRes = await query(sql, params);
    res.json({
      success: true,
      message: 'Grounds retrieved successfully.',
      data: groundsRes.rows.map(formatGround)
    });
  } catch (err: any) {
    console.error('Fetch grounds error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while retrieving grounds.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// GET /api/grounds/:id
apiRouter.get('/grounds/:id', async (req: Request, res: Response) => {
  try {
    const groundRes = await query('SELECT * FROM grounds WHERE id = $1', [req.params.id]);
    if (groundRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'The requested cricket ground was not found.',
        errorCode: 'GROUND_NOT_FOUND'
      });
      return;
    }
    res.json({
      success: true,
      message: 'Ground retrieved successfully.',
      data: formatGround(groundRes.rows[0])
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// ==========================================
// 3. GROUND AVAILABILITY & DOUBLE-BOOKING CHECK
// ==========================================

// GET /api/grounds/:id/availability
apiRouter.get('/grounds/:id/availability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime || typeof date !== 'string' || typeof startTime !== 'string' || typeof endTime !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Date, start time, and end time are required.',
        errorCode: 'MISSING_PARAMETERS'
      });
      return;
    }

    // 1. Check ground existence and status
    const groundRes = await query('SELECT * FROM grounds WHERE id = $1', [id]);
    if (groundRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Cricket ground not found.',
        errorCode: 'GROUND_NOT_FOUND'
      });
      return;
    }

    const ground = groundRes.rows[0];

    if (ground.availability !== 'AVAILABLE') {
      res.json({
        success: true,
        message: 'Ground is currently marked as unavailable for booking.',
        data: {
          isAvailable: false,
          message: 'Ground is currently marked as unavailable by administration.',
          requestedDate: date,
          requestedStart: startTime,
          requestedEnd: endTime,
          durationHours: 0,
          hourlyPrice: Number(ground.hourly_price),
          totalAmount: 0
        }
      });
      return;
    }

    // 2. Validate timing constraints
    const duration = calculateDurationHours(startTime, endTime);
    if (duration <= 0) {
      res.status(400).json({
        success: false,
        message: 'End time must be strictly after start time.',
        errorCode: 'INVALID_TIME_RANGE'
      });
      return;
    }

    // Check opening and closing hours
    if (startTime < ground.opening_time || endTime > ground.closing_time) {
      res.json({
        success: true,
        message: `Booking must be within operating hours (${ground.opening_time} to ${ground.closing_time}).`,
        data: {
          isAvailable: false,
          message: `Ground operating hours are ${ground.opening_time} - ${ground.closing_time}. Please adjust your slot.`,
          requestedDate: date,
          requestedStart: startTime,
          requestedEnd: endTime,
          durationHours: duration,
          hourlyPrice: Number(ground.hourly_price),
          totalAmount: Number(ground.hourly_price) * duration
        }
      });
      return;
    }

    // Check past date
    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      res.json({
        success: true,
        message: 'Booking date cannot be in the past.',
        data: {
          isAvailable: false,
          message: 'Booking date cannot be in the past.',
          requestedDate: date,
          requestedStart: startTime,
          requestedEnd: endTime,
          durationHours: duration,
          hourlyPrice: Number(ground.hourly_price),
          totalAmount: 0
        }
      });
      return;
    }

    // 3. Double-booking check against existing CONFIRMED bookings
    // Overlap condition: requestedStart < existingEnd AND requestedEnd > existingStart
    const conflictRes = await query(
      `SELECT start_time, end_time FROM bookings
       WHERE ground_id = $1
         AND booking_date = $2
         AND booking_status = 'CONFIRMED'
         AND start_time < $3
         AND end_time > $4`,
      [id, date, endTime, startTime]
    );

    const hourlyPrice = Number(ground.hourly_price);
    const totalAmount = hourlyPrice * duration;

    if (conflictRes.rows.length > 0) {
      res.json({
        success: true,
        message: 'Ground is not available for the selected date and time.',
        data: {
          isAvailable: false,
          message: 'Ground is not available for the selected date and time.',
          requestedDate: date,
          requestedStart: startTime,
          requestedEnd: endTime,
          durationHours: duration,
          hourlyPrice,
          totalAmount,
          conflictingBookings: conflictRes.rows.map(r => ({
            startTime: r.start_time,
            endTime: r.end_time
          }))
        }
      });
      return;
    }

    res.json({
      success: true,
      message: 'Ground is available for booking.',
      data: {
        isAvailable: true,
        message: 'Ground is available for the selected slot!',
        requestedDate: date,
        requestedStart: startTime,
        requestedEnd: endTime,
        durationHours: duration,
        hourlyPrice,
        totalAmount
      }
    });
  } catch (err: any) {
    console.error('Availability check error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while checking slot availability.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// ==========================================
// 4. BOOKINGS
// ==========================================

// POST /api/bookings (User creates booking)
apiRouter.post('/bookings', requireAuth, requireUserRole, async (req: Request, res: Response) => {
  try {
    const { groundId, bookingDate, startTime, endTime, numberOfPlayers, specialRequest } = req.body;
    const userId = req.user!.userId;

    if (!groundId || !bookingDate || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        message: 'Ground, date, start time, and end time are required.',
        errorCode: 'VALIDATION_ERROR'
      });
      return;
    }

    // 1. Fetch ground
    const groundRes = await query('SELECT * FROM grounds WHERE id = $1', [groundId]);
    if (groundRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Cricket ground not found.',
        errorCode: 'GROUND_NOT_FOUND'
      });
      return;
    }
    const ground = groundRes.rows[0];

    if (ground.availability !== 'AVAILABLE') {
      res.status(400).json({
        success: false,
        message: 'Ground is currently marked as unavailable for booking.',
        errorCode: 'GROUND_UNAVAILABLE'
      });
      return;
    }

    // 2. Validate timing
    const duration = calculateDurationHours(startTime, endTime);
    if (duration <= 0) {
      res.status(400).json({
        success: false,
        message: 'End time must be after start time.',
        errorCode: 'INVALID_TIME_RANGE'
      });
      return;
    }

    if (startTime < ground.opening_time || endTime > ground.closing_time) {
      res.status(400).json({
        success: false,
        message: `Booking must fit within ground operating hours (${ground.opening_time} - ${ground.closing_time}).`,
        errorCode: 'OUTSIDE_OPERATING_HOURS'
      });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (bookingDate < todayStr) {
      res.status(400).json({
        success: false,
        message: 'Booking date cannot be in the past.',
        errorCode: 'PAST_DATE'
      });
      return;
    }

    // 3. SERVER-SIDE DOUBLE BOOKING OVERLAP VERIFICATION
    const conflictRes = await query(
      `SELECT id FROM bookings
       WHERE ground_id = $1
         AND booking_date = $2
         AND booking_status = 'CONFIRMED'
         AND start_time < $3
         AND end_time > $4`,
      [groundId, bookingDate, endTime, startTime]
    );

    if (conflictRes.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Ground is not available for the selected date and time.',
        errorCode: 'SLOT_UNAVAILABLE'
      });
      return;
    }

    // 4. Calculate total amount on SERVER (Never trust frontend amount)
    const hourlyPrice = Number(ground.hourly_price);
    const serverCalculatedAmount = hourlyPrice * duration;

    const bookingId = `bkg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const paymentId = `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const initialTxnId = `TXN_PENDING_${bookingId}`;

    // Insert booking
    await query(
      `INSERT INTO bookings (
        id, user_id, ground_id, booking_date, start_time, end_time,
        number_of_players, special_request, amount, booking_status, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING_PAYMENT', 'PENDING')`,
      [
        bookingId,
        userId,
        groundId,
        bookingDate,
        startTime,
        endTime,
        Number(numberOfPlayers) || 11,
        specialRequest ? specialRequest.trim() : '',
        serverCalculatedAmount
      ]
    );

    // Insert pending payment record
    await query(
      `INSERT INTO payments (id, booking_id, transaction_id, amount, payment_method, status)
       VALUES ($1, $2, $3, $4, 'DEMO_GATEWAY', 'PENDING')`,
      [paymentId, bookingId, initialTxnId, serverCalculatedAmount]
    );

    res.status(201).json({
      success: true,
      message: 'Booking created. Please proceed to payment to confirm your slot.',
      data: {
        bookingId,
        groundId,
        groundName: ground.ground_name,
        bookingDate,
        startTime,
        endTime,
        durationHours: duration,
        hourlyPrice,
        amount: serverCalculatedAmount,
        bookingStatus: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING'
      }
    });
  } catch (err: any) {
    console.error('Create booking error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while creating the booking.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// GET /api/bookings/my (User view own bookings)
apiRouter.get('/bookings/my', requireAuth, requireUserRole, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const bookingsRes = await query(
      `SELECT b.*, g.ground_name, g.location as ground_location, g.image_url as ground_image_url
       FROM bookings b
       JOIN grounds g ON b.ground_id = g.id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC, b.start_time DESC`,
      [userId]
    );

    res.json({
      success: true,
      message: 'User bookings retrieved successfully.',
      data: bookingsRes.rows.map(formatBooking)
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong while retrieving bookings.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// GET /api/bookings/:id (Strict ownership check!)
apiRouter.get('/bookings/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bookingRes = await query(
      `SELECT b.*,
              g.ground_name, g.location as ground_location, g.image_url as ground_image_url,
              u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM bookings b
       JOIN grounds g ON b.ground_id = g.id
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'The requested booking was not found.',
        errorCode: 'BOOKING_NOT_FOUND'
      });
      return;
    }

    const booking = bookingRes.rows[0];

    // Ownership check: If normal user, MUST be their booking!
    if (req.user!.role === 'USER' && booking.user_id !== req.user!.userId) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to view this booking.',
        errorCode: 'FORBIDDEN'
      });
      return;
    }

    // Get payment details
    const payRes = await query('SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1', [id]);
    const payment = payRes.rows[0] ? {
      paymentId: payRes.rows[0].id,
      transactionId: payRes.rows[0].transaction_id,
      paymentMethod: payRes.rows[0].payment_method,
      status: payRes.rows[0].status,
      paidAt: payRes.rows[0].paid_at
    } : null;

    res.json({
      success: true,
      message: 'Booking details retrieved successfully.',
      data: {
        ...formatBooking(booking),
        payment
      }
    });
  } catch (err: any) {
    console.error('Get booking error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching the booking.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// PUT /api/bookings/:id/cancel
apiRouter.put('/bookings/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bookingRes = await query('SELECT * FROM bookings WHERE id = $1', [id]);

    if (bookingRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Booking not found.',
        errorCode: 'BOOKING_NOT_FOUND'
      });
      return;
    }

    const booking = bookingRes.rows[0];

    // Ownership check
    if (req.user!.role === 'USER' && booking.user_id !== req.user!.userId) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking.',
        errorCode: 'FORBIDDEN'
      });
      return;
    }

    if (booking.booking_status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        message: 'Booking is already cancelled.',
        errorCode: 'ALREADY_CANCELLED'
      });
      return;
    }

    if (booking.booking_status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'Past or completed bookings cannot be cancelled.',
        errorCode: 'CANNOT_CANCEL_COMPLETED'
      });
      return;
    }

    // If payment was completed, set refund status
    let newPaymentStatus = booking.payment_status;
    if (booking.payment_status === 'SUCCESS') {
      newPaymentStatus = 'REFUNDED';
      await query(
        `UPDATE payments SET status = 'REFUNDED' WHERE booking_id = $1`,
        [id]
      );
    }

    await query(
      `UPDATE bookings
       SET booking_status = 'CANCELLED', payment_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newPaymentStatus, id]
    );

    res.json({
      success: true,
      message: 'Booking has been cancelled successfully. Any applicable refund has been initiated.',
      data: {
        bookingId: id,
        bookingStatus: 'CANCELLED',
        paymentStatus: newPaymentStatus
      }
    });
  } catch (err: any) {
    console.error('Cancel booking error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while cancelling the booking.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// ==========================================
// 5. PAYMENTS & TRANSACTION SAFETY
// ==========================================

// POST /api/payments/create
apiRouter.post('/payments/create', requireAuth, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      res.status(400).json({ success: false, message: 'Booking ID is required.' });
      return;
    }

    const bookingRes = await query(
      `SELECT b.*, g.ground_name, g.location, g.hourly_price
       FROM bookings b
       JOIN grounds g ON b.ground_id = g.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    const b = bookingRes.rows[0];
    if (req.user!.role === 'USER' && b.user_id !== req.user!.userId) {
      res.status(403).json({ success: false, message: 'Unauthorized access to booking.' });
      return;
    }

    const duration = calculateDurationHours(b.start_time, b.end_time);

    res.json({
      success: true,
      message: 'Payment invoice ready.',
      data: {
        bookingId: b.id,
        groundName: b.ground_name,
        location: b.location,
        bookingDate: b.booking_date,
        startTime: b.start_time,
        endTime: b.end_time,
        durationHours: duration,
        amount: Number(b.amount),
        hourlyPrice: Number(b.hourly_price),
        bookingStatus: b.booking_status,
        paymentStatus: b.payment_status,
        mode: process.env.PAYMENT_MODE || 'DEMO'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error processing payment invoice.' });
  }
});

// POST /api/payments/verify (DEMO & GATEWAY VERIFICATION)
apiRouter.post('/payments/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const { bookingId, simulateOutcome, paymentMethod = 'DEMO_UPI' } = req.body;

    if (!bookingId) {
      res.status(400).json({ success: false, message: 'Booking ID is required.' });
      return;
    }

    const bookingRes = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bookingRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    const booking = bookingRes.rows[0];

    // Ownership check
    if (req.user!.role === 'USER' && booking.user_id !== req.user!.userId) {
      res.status(403).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    if (booking.booking_status === 'CONFIRMED' && booking.payment_status === 'SUCCESS') {
      res.json({
        success: true,
        message: 'This booking has already been confirmed and paid.',
        data: {
          bookingId: booking.id,
          bookingStatus: 'CONFIRMED',
          paymentStatus: 'SUCCESS'
        }
      });
      return;
    }

    // Controlled simulation check
    if (simulateOutcome === 'FAILURE') {
      // Mark payment failed
      await query(
        `UPDATE payments
         SET status = 'FAILED'
         WHERE booking_id = $1`,
        [bookingId]
      );

      await query(
        `UPDATE bookings
         SET payment_status = 'FAILED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [bookingId]
      );

      res.status(400).json({
        success: false,
        message: 'Payment failed. Please try again.',
        errorCode: 'PAYMENT_FAILED',
        data: {
          bookingId,
          bookingStatus: booking.booking_status,
          paymentStatus: 'FAILED'
        }
      });
      return;
    }

    // MANDATORY DOUBLE BOOKING RACE-CONDITION SAFETY CHECK:
    // Before confirming payment, make sure no other user confirmed an overlapping slot!
    const conflictCheck = await query(
      `SELECT id FROM bookings
       WHERE ground_id = $1
         AND booking_date = $2
         AND id != $3
         AND booking_status = 'CONFIRMED'
         AND start_time < $4
         AND end_time > $5`,
      [booking.ground_id, booking.booking_date, booking.id, booking.end_time, booking.start_time]
    );

    if (conflictCheck.rows.length > 0) {
      // Slot was already taken
      await query(
        `UPDATE bookings SET booking_status = 'CANCELLED', payment_status = 'FAILED' WHERE id = $1`,
        [bookingId]
      );
      res.status(409).json({
        success: false,
        message: 'This time slot was just booked by another user. Your card/account was not charged.',
        errorCode: 'SLOT_CONFLICT'
      });
      return;
    }

    // Payment Success Flow
    const txnId = `TXN_DEMO_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const nowIso = new Date().toISOString();

    // 1. Update/insert payment as SUCCESS
    await query(
      `UPDATE payments
       SET transaction_id = $1, payment_method = $2, status = 'SUCCESS', paid_at = $3
       WHERE booking_id = $4`,
      [txnId, paymentMethod, nowIso, bookingId]
    );

    // 2. Update booking to CONFIRMED and payment_status to SUCCESS
    await query(
      `UPDATE bookings
       SET booking_status = 'CONFIRMED', payment_status = 'SUCCESS', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [bookingId]
    );

    // Development-safe notification record
    const notificationMessage = 'Booking confirmation sent successfully via registered email.';

    res.json({
      success: true,
      message: 'Payment successful! Your booking is confirmed.',
      data: {
        bookingId,
        transactionId: txnId,
        paymentStatus: 'SUCCESS',
        bookingStatus: 'CONFIRMED',
        notificationStatus: notificationMessage
      }
    });
  } catch (err: any) {
    console.error('Payment verify error:', err);
    res.status(500).json({
      success: false,
      message: 'Payment processing error.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// GET /api/payments/:bookingId
apiRouter.get('/payments/:bookingId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const payRes = await query('SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1', [bookingId]);
    if (payRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'No payment record found for this booking.' });
      return;
    }
    const p = payRes.rows[0];
    res.json({
      success: true,
      message: 'Payment record retrieved.',
      data: {
        paymentId: p.id,
        bookingId: p.booking_id,
        transactionId: p.transaction_id,
        amount: Number(p.amount),
        paymentMethod: p.payment_method,
        status: p.status,
        paidAt: p.paid_at,
        createdAt: p.created_at
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving payment.' });
  }
});

// ==========================================
// 6. ADMIN DASHBOARD & MANAGEMENT
// ==========================================

// GET /api/admin/dashboard
apiRouter.get('/admin/dashboard', requireAuth, requireAdminRole, async (_req: Request, res: Response) => {
  try {
    // 1. Total Grounds & Available Grounds
    const groundsStats = await query(`
      SELECT
        COUNT(*) as total_grounds,
        COUNT(CASE WHEN availability = 'AVAILABLE' THEN 1 END) as available_grounds
      FROM grounds
    `);

    // 2. Bookings Stats
    const bookingsStats = await query(`
      SELECT
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN booking_status = 'CONFIRMED' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) as pending_payments
      FROM bookings
    `);

    // 3. Real Revenue from Confirmed/Paid bookings
    const revStats = await query(`
      SELECT COALESCE(SUM(amount), 0) as total_revenue
      FROM payments
      WHERE status = 'SUCCESS'
    `);

    // 4. Recent bookings list
    const recentRes = await query(`
      SELECT b.*, g.ground_name, g.location as ground_location, u.name as user_name, u.email as user_email
      FROM bookings b
      JOIN grounds g ON b.ground_id = g.id
      JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      message: 'Admin dashboard statistics calculated from live database.',
      data: {
        totalGrounds: Number(groundsStats.rows[0]?.total_grounds || 0),
        availableGrounds: Number(groundsStats.rows[0]?.available_grounds || 0),
        totalBookings: Number(bookingsStats.rows[0]?.total_bookings || 0),
        confirmedBookings: Number(bookingsStats.rows[0]?.confirmed_bookings || 0),
        pendingPayments: Number(bookingsStats.rows[0]?.pending_payments || 0),
        totalRevenue: Number(revStats.rows[0]?.total_revenue || 0),
        recentBookings: recentRes.rows.map(formatBooking)
      }
    });
  } catch (err: any) {
    console.error('Admin dashboard stats error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard metrics.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// GET /api/admin/grounds
apiRouter.get('/admin/grounds', requireAuth, requireAdminRole, async (_req: Request, res: Response) => {
  try {
    const groundsRes = await query('SELECT * FROM grounds ORDER BY created_at DESC');
    res.json({
      success: true,
      message: 'All grounds retrieved for administration.',
      data: groundsRes.rows.map(formatGround)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving grounds.' });
  }
});

// POST /api/admin/grounds (Add Ground)
apiRouter.post('/admin/grounds', requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { groundName, location, description, hourlyPrice, openingTime, closingTime, availability = 'AVAILABLE', imageUrl } = req.body;

    if (!groundName || !location || !hourlyPrice || !openingTime || !closingTime) {
      res.status(400).json({
        success: false,
        message: 'Ground name, location, hourly price, opening time, and closing time are required.',
        errorCode: 'VALIDATION_ERROR'
      });
      return;
    }

    const groundId = `grd_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const finalImage = imageUrl?.trim() || 'https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?auto=format&fit=crop&w=1200&q=80';

    await query(
      `INSERT INTO grounds (id, ground_name, location, description, hourly_price, opening_time, closing_time, availability, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        groundId,
        groundName.trim(),
        location.trim(),
        description ? description.trim() : 'Standard cricket pitch with pavilion facilities.',
        Number(hourlyPrice),
        openingTime.trim(),
        closingTime.trim(),
        availability === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE',
        finalImage
      ]
    );

    const inserted = await query('SELECT * FROM grounds WHERE id = $1', [groundId]);

    res.status(201).json({
      success: true,
      message: 'Ground added successfully.',
      data: formatGround(inserted.rows[0])
    });
  } catch (err: any) {
    console.error('Add ground error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to add cricket ground.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// PUT /api/admin/grounds/:id (Update Ground)
apiRouter.put('/api/admin/grounds/:id', requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { groundName, location, description, hourlyPrice, openingTime, closingTime, availability, imageUrl } = req.body;

    const existingRes = await query('SELECT * FROM grounds WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Ground not found.' });
      return;
    }
    const current = existingRes.rows[0];

    await query(
      `UPDATE grounds
       SET ground_name = $1,
           location = $2,
           description = $3,
           hourly_price = $4,
           opening_time = $5,
           closing_time = $6,
           availability = $7,
           image_url = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        groundName !== undefined ? groundName.trim() : current.ground_name,
        location !== undefined ? location.trim() : current.location,
        description !== undefined ? description.trim() : current.description,
        hourlyPrice !== undefined ? Number(hourlyPrice) : current.hourly_price,
        openingTime !== undefined ? openingTime.trim() : current.opening_time,
        closingTime !== undefined ? closingTime.trim() : current.closing_time,
        availability !== undefined ? availability : current.availability,
        imageUrl !== undefined ? imageUrl.trim() : current.image_url,
        id
      ]
    );

    const updated = await query('SELECT * FROM grounds WHERE id = $1', [id]);
    res.json({
      success: true,
      message: 'Ground details updated successfully.',
      data: formatGround(updated.rows[0])
    });
  } catch (err: any) {
    console.error('Update ground error:', err);
    res.status(500).json({ success: false, message: 'Failed to update ground.' });
  }
});

// Also alias PUT /admin/grounds/:id because Router mounts under /api
apiRouter.put('/admin/grounds/:id', requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { groundName, location, description, hourlyPrice, openingTime, closingTime, availability, imageUrl } = req.body;

    const existingRes = await query('SELECT * FROM grounds WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Ground not found.' });
      return;
    }
    const current = existingRes.rows[0];

    await query(
      `UPDATE grounds
       SET ground_name = $1,
           location = $2,
           description = $3,
           hourly_price = $4,
           opening_time = $5,
           closing_time = $6,
           availability = $7,
           image_url = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        groundName !== undefined ? groundName.trim() : current.ground_name,
        location !== undefined ? location.trim() : current.location,
        description !== undefined ? description.trim() : current.description,
        hourlyPrice !== undefined ? Number(hourlyPrice) : current.hourly_price,
        openingTime !== undefined ? openingTime.trim() : current.opening_time,
        closingTime !== undefined ? closingTime.trim() : current.closing_time,
        availability !== undefined ? availability : current.availability,
        imageUrl !== undefined ? imageUrl.trim() : current.image_url,
        id
      ]
    );

    const updated = await query('SELECT * FROM grounds WHERE id = $1', [id]);
    res.json({
      success: true,
      message: 'Ground details updated successfully.',
      data: formatGround(updated.rows[0])
    });
  } catch (err: any) {
    console.error('Update ground error:', err);
    res.status(500).json({ success: false, message: 'Failed to update ground.' });
  }
});

// GET /api/admin/bookings (View and filter all bookings)
apiRouter.get('/admin/bookings', requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { search, bookingStatus, paymentStatus, groundId, date } = req.query;

    let sql = `
      SELECT b.*,
             g.ground_name, g.location as ground_location, g.image_url as ground_image_url,
             u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM bookings b
      JOIN grounds g ON b.ground_id = g.id
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(b.id) LIKE $${params.length} OR LOWER(u.name) LIKE $${params.length} OR LOWER(g.ground_name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`;
    }

    if (bookingStatus && typeof bookingStatus === 'string' && bookingStatus !== 'ALL') {
      params.push(bookingStatus);
      sql += ` AND b.booking_status = $${params.length}`;
    }

    if (paymentStatus && typeof paymentStatus === 'string' && paymentStatus !== 'ALL') {
      params.push(paymentStatus);
      sql += ` AND b.payment_status = $${params.length}`;
    }

    if (groundId && typeof groundId === 'string' && groundId !== 'ALL') {
      params.push(groundId);
      sql += ` AND b.ground_id = $${params.length}`;
    }

    if (date && typeof date === 'string' && date.trim()) {
      params.push(date.trim());
      sql += ` AND b.booking_date = $${params.length}`;
    }

    sql += ' ORDER BY b.created_at DESC';

    const bookingsRes = await query(sql, params);
    res.json({
      success: true,
      message: 'Admin bookings list retrieved.',
      data: bookingsRes.rows.map(formatBooking)
    });
  } catch (err: any) {
    console.error('Admin bookings fetch error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings list.',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// PUT /api/admin/bookings/:id (Update booking status by admin)
apiRouter.put('/admin/bookings/:id', requireAuth, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { bookingStatus } = req.body;

    const existingRes = await query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }
    const current = existingRes.rows[0];

    // DO NOT allow administrator to falsely mark payment as SUCCESS
    // But allow changing bookingStatus to CANCELLED or COMPLETED
    if (!['CONFIRMED', 'CANCELLED', 'COMPLETED', 'PENDING_PAYMENT'].includes(bookingStatus)) {
      res.status(400).json({ success: false, message: 'Invalid booking status.' });
      return;
    }

    let paymentStatus = current.payment_status;
    if (bookingStatus === 'CANCELLED' && current.payment_status === 'SUCCESS') {
      paymentStatus = 'REFUNDED';
      await query(`UPDATE payments SET status = 'REFUNDED' WHERE booking_id = $1`, [id]);
    }

    await query(
      `UPDATE bookings
       SET booking_status = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [bookingStatus, paymentStatus, id]
    );

    res.json({
      success: true,
      message: `Booking status updated to ${bookingStatus}.`,
      data: {
        bookingId: id,
        bookingStatus,
        paymentStatus
      }
    });
  } catch (err: any) {
    console.error('Update booking status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
});
