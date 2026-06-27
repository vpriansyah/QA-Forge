import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config';

export class AuthService {
  async register(data: { email: string; password: string; name: string }) {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw { code: 'BAD_REQUEST', message: 'Email sudah terdaftar', status: 400 };
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // 3. Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password_hash: passwordHash,
      },
    });

    // 4. Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  async login(data: { email: string; password: string }) {
    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw { code: 'UNAUTHORIZED', message: 'Email atau password salah', status: 401 };
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw { code: 'UNAUTHORIZED', message: 'Email atau password salah', status: 401 };
    }

    // 3. Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    });

    if (!user) {
      throw { code: 'NOT_FOUND', message: 'User tidak ditemukan', status: 404 };
    }

    return user;
  }

  private generateToken(user: any) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}
