import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Role, User, VerifyStatus } from './user-entity';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto, UpdateUserDto } from './create-user-dto';
import { PasswordService } from '../password/password.service';
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

    public async createUser(createUserDto: CreateUserDto): Promise<User> {
        // Check if user exists by phone or email
        if (createUserDto.phone) {
            const existingUser = await this.findOneByPhone(createUserDto.phone);
            if (existingUser) {
                throw new ConflictException('User with this phone already exists');
            }
        }

        if (createUserDto.email) {
            const existingUser = await this.findOneByEmail(createUserDto.email);
            if (existingUser) {
                throw new ConflictException('User with this email already exists');
            }
        }

        const newUser = this.userRepository.create({
            ...createUserDto,
            isActive: true, // Auto-activate when created by admin
            isVerified: true, // Auto-verify when created by admin
            createAt: new Date(),
            updateAt: new Date()
        });
        
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
            throw new NotFoundException('auth.user_not_found');
        }

        // Handle verification status reset if critical info changes
        // For BROKER / REAL_ESTATE_OFFICE
        if ((updateUserDto.role === Role.BROKER || updateUserDto.role === Role.REAL_ESTATE_OFFICE) && updateUserDto.falLicenseNumber) {
            // Logic to verify Fal license could go here or trigger a job
            // For now, keep as is or set status
             user.agentVerificationStatus = VerifyStatus.PENDING; 
        }

        // Standardize verify flag based on profile completion (simplified logic)
        if(updateUserDto.firstName || updateUserDto.lastName ){
            user.isVerified = true
        }

        Object.assign(user, updateUserDto);
        
        return await this.userRepository.save(user);
    }

    public async getUserProfile(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            // Select all relevant fields including new ones
            select: [
                'id', 'firstName', 'lastName', 'email', 'phone', 'role', 'roleOtherDescription',
                'isVerified', 'isActive', 
                'falLicenseNumber', 'falLicenseExpiry', 'lawLicenseNumber', 'commercialRegistrationNumber',
                'agentLicenseNumber', 'agentVerificationStatus', 
                'address', 'city', 'country',
                'profileImage', 'createAt',
                'nationalId', 'postalCode', 'streetName', 'district', 'additionalNumber', 'unitNumber',
                'licenseIssueDate', 'brokerType', 'contracts',
                'financialAgreementType', 'financialAgreementValue', 'departmentPermissions'
            ]
        });
        
        if (!user) {
            throw new NotFoundException('auth.user_not_found');
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

    public async verifyNafath(userId: string, nationalId: string): Promise<User> {
        const user = await this.findOne(userId);
        if (!user) throw new NotFoundException('User not found');

        // Mock verification
        user.nationalId = nationalId;
        user.isVerified = true;
        
        return await this.userRepository.save(user);
    }

    public async remove(userId: string): Promise<void> {
        const user = await this.findOne(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.userRepository.remove(user);
    }

    public async updateRole(userId: string, role: Role): Promise<User> {
        const user = await this.findOne(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.role = role;
        user.updateAt = new Date();
        return await this.userRepository.save(user);
    }
}
