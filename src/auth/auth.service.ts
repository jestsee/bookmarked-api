import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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

    // send back the user
    delete user.hash;
    return user;
  }
}
