import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Role, User, VerifyStatus } from './user-entity';
import { AuthService } from 'src/auth/auth.service';
import { CreateUserDto, UpdateUserDto } from './create-user-dto';
import { PasswordService } from 'src/password/password.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository : Repository<User>,
        private readonly passwordService : PasswordService
    ){}

    public async findAll(): Promise<User[]> {
        return await this.userRepository.find();
    }

    public async findOneByPhone(phone: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { phone } });
        if (!user) {
          return null
        }
        return user;
      }
      public async findOneByEmail(email: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
          return null
        }
        return user;
      }
      public async createUserByphone(createUserDto: CreateUserDto,otp:string): Promise<User> {
        const existingUser = await this.findOneByPhone(createUserDto.phone);
        
        if(existingUser){
          existingUser.isActive=false;
          existingUser.otp=otp;
          existingUser.expireOtp=createUserDto.expiredOtp;
          await this.updateUser(existingUser);
           return existingUser;
        }
        const newUser = this.userRepository.create({...createUserDto,expireOtp:createUserDto.expiredOtp,otp});
        return await this.userRepository.save(newUser);
      }
      public async createUserByemail(createUserDto: CreateUserDto,otp:string): Promise<User> {
        const existingUser =  await this.findOneByEmail(createUserDto.email);
    
        if(existingUser){
          existingUser.isActive=false;
          existingUser.otp=otp;
          existingUser.expireOtp=createUserDto.expiredOtp;
          await this.updateUser(existingUser);
          return existingUser;
        }

        const newUser = this.userRepository.create({...createUserDto,expireOtp:createUserDto.expiredOtp,otp});
        return await this.userRepository.save(newUser);
      }
      public async findOne(id: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
          return null
        }
        return user;
      }
      
      public async updateUser(user: User): Promise<User> {
        return await this.userRepository.save(user);
      }

      public async updateUserDetails(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(userId);
        
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // If user is updating to agent role and provides license number
        if (updateUserDto.role === Role.AGENT && updateUserDto.agentLicenseNumber) {
            user.agentVerificationStatus = VerifyStatus.PENDING;
        }
        if(updateUserDto.firstName || updateUserDto.lastName ){
        user.isVerified = true
        // Update user fields
        }
        Object.assign(user, updateUserDto);
        
        return await this.userRepository.save(user);
    }

    public async getUserProfile(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 
                    'isVerified', 'isActive', 'agentLicenseNumber', 
                    'agentVerificationStatus', 'address', 'city', 'country',
                    'profileImage', 'createAt']
        });
        
        if (!user) {
            throw new NotFoundException('User not found');
        }
        
        return user;
    }

    public async updateVerificationStatus(userId: string, status: VerifyStatus): Promise<User> {
        const user = await this.findOne(userId);
        
        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.agentVerificationStatus = status;
        if (status === VerifyStatus.VERIFIED) {
            user.isVerified = true;
        }
        
        return await this.userRepository.save(user);
    }
}
