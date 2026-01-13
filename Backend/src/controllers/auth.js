import { config } from '../config/index.js';

/**
 * Auth controller - handles authentication-related API endpoints
 * Note: This is a basic implementation. In production, use proper:
 * - Password hashing (bcrypt/argon2)
 * - JWT implementation
 * - Database storage
 * - Rate limiting
 */
export const authController = {
  /**
   * User login
   */
  login: async (request) => {
    try {
      const body = await request.json();
      const { email, password } = body;
      
      // Validate input
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Demo authentication - in production, verify against database
      if (email === 'admin@adminlte.io' && password === 'admin123') {
        const user = {
          id: 1,
          email: 'admin@adminlte.io',
          name: 'Alexander Pierce',
          role: 'Admin',
          avatar: '/assets/img/user2-160x160.jpg',
        };
        
        // In production, generate proper JWT token
        const token = `demo-token-${Date.now()}`;
        
        return new Response(
          JSON.stringify({
            message: 'Login successful',
            user,
            token,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
  
  /**
   * User registration
   */
  register: async (request) => {
    try {
      const body = await request.json();
      const { name, email, password, confirmPassword } = body;
      
      // Validate input
      if (!name || !email || !password) {
        return new Response(
          JSON.stringify({ error: 'Name, email, and password are required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (password !== confirmPassword) {
        return new Response(
          JSON.stringify({ error: 'Passwords do not match' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      // In production, save to database and hash password
      const newUser = {
        id: Date.now(),
        name,
        email,
        role: 'User',
        avatar: '/assets/img/default-150x150.png',
        createdAt: new Date().toISOString(),
      };
      
      const token = `demo-token-${Date.now()}`;
      
      return new Response(
        JSON.stringify({
          message: 'Registration successful',
          user: newUser,
          token,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
  
  /**
   * Get current user from token
   */
  getCurrentUser: async (request) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No token provided' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // In production, verify JWT token
    if (!token.startsWith('demo-token-')) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Return demo user
    const user = {
      id: 1,
      email: 'admin@adminlte.io',
      name: 'Alexander Pierce',
      role: 'Admin',
      avatar: '/assets/img/user2-160x160.jpg',
      memberSince: 'Nov. 2023',
    };
    
    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

