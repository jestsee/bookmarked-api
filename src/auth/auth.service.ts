import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signUp({ email, password, name }: AuthDto) {
    try {
      // generate the password
      const hash = await argon.hash(password);

      // save the new user in db
      const user = await this.prisma.user.create({
        data: { email, hash, name },
      });

      // return the saved user
      delete user.hash; // TODO dirty solution
      return user;
    } catch (error) {
      if (!(error instanceof PrismaClientKnownRequestError)) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ForbiddenException('Credentials taken');
      }
    }
  }

  async signIn({ email, password }: Omit<AuthDto, 'name'>) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // user not found
    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }

    // check password
    const pwMatches = await argon.verify(user.hash, password);

    // password incorrect
    if (!pwMatches) {
      throw new ForbiddenException('Credentials incorrect');
    }

    delete user.hash;
    return this.signToken(user.id, user.email);
  }

  async signToken(userId: string, email: string) {
    const payload = {
      sub: userId,
      email,
    };

    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret,
    });

    return { access_token: token };
  }
}
