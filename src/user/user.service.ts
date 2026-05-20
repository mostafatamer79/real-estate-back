import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Department, Role, User, VerifyStatus } from './user-entity';
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

    private normalizeEmail(email?: string | null): string | undefined {
        return email?.trim().toLowerCase();
    }

    public async findAll(): Promise<any[]> {
        const users = await this.userRepository.find({
            order: { createAt: 'DESC' }
        });
        return users.map(user => {
            const isOnline = user.lastSeen ? (new Date().getTime() - new Date(user.lastSeen).getTime() < 5 * 60 * 1000) : false;
            return { ...user, isOnline };
        });
    }

    public async findOneByPhone(phone: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { phone } });
        if (!user) {
          return null
        }
        return user;
      }
      public async findOneByEmail(email: string): Promise<User | null> {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.userRepository.findOne({ where: { email: normalizedEmail } });
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
        createUserDto.email = this.normalizeEmail(createUserDto.email);
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
        if (!createUserDto.phone && !createUserDto.email) {
            throw new BadRequestException('User must have phone or email');
        }
        // Check if user exists by phone or email
        if (createUserDto.phone) {
            const existingUser = await this.findOneByPhone(createUserDto.phone);
            if (existingUser) {
                throw new ConflictException('User with this phone already exists');
            }
        }

        if (createUserDto.email) {
            createUserDto.email = this.normalizeEmail(createUserDto.email);
            const existingUser = await this.findOneByEmail(createUserDto.email);
            if (existingUser) {
                throw new ConflictException('البريد الإلكتروني مستخدم مسبقاً');
            }
        }

        // If creating an employee under a manager, the employee's departments/permissions
        // must be a subset of the manager's allowed departments.
        if (createUserDto.role === Role.EMPLOYEE) {
            if (!createUserDto.parentId) {
                throw new BadRequestException('Employee must have a manager');
            }
            const parent = await this.userRepository.findOne({ where: { id: createUserDto.parentId } as any });
            if (!parent) {
                throw new BadRequestException('Manager not found');
            }
            const parentDepts = new Set((Array.isArray(parent.departments) ? parent.departments : []) as any[]);
            const parentPerms = parent.departmentPermissions || {};
            const allowedDept = (k: string) => parentDepts.has(k as any) || (parentPerms[k] && parentPerms[k] !== 'none');

            if (createUserDto.departmentPermissions && typeof createUserDto.departmentPermissions === 'object') {
                const nextPerms: any = {};
                Object.entries(createUserDto.departmentPermissions).forEach(([k, v]) => {
                    if (!allowedDept(k)) {
                        nextPerms[k] = 'none';
                        return;
                    }
                    nextPerms[k] = v;
                });
                createUserDto.departmentPermissions = nextPerms;
            }

            if (Array.isArray(createUserDto.departments) && createUserDto.departments.length > 0) {
                createUserDto.departments = createUserDto.departments.filter((d: any) => allowedDept(String(d)));
            }
        }

        let departments: Department[] = createUserDto.departments || [];
        
        // Derive departments from departmentPermissions if not explicitly provided
        if (departments.length === 0 && createUserDto.departmentPermissions) {
            const deptMap: Record<string, Department> = {
                'marketing': Department.MARKETING,
                'properties': Department.PROPERTIES,
                'financial': Department.FINANCE,
                'finance': Department.FINANCE,
                'legal': Department.LEGAL,
                'employees': Department.EMPLOYEES
            };
            departments = Object.entries(createUserDto.departmentPermissions)
                .filter(([key, value]) => value !== 'none' && value !== false)
                .map(([key]) => deptMap[key])
                .filter(Boolean); // Remove any undefined mappings
        }

        if (departments.length === 0) {
            departments = (
                createUserDto.role === Role.MARKETING ? [Department.MARKETING] :
                createUserDto.role === Role.LEGAL ? [Department.LEGAL] :
                createUserDto.role === Role.FINANCE ? [Department.FINANCE] :
                []
            );
        }

        if (createUserDto.role === Role.EMPLOYEE && departments.length === 0) {
            // It's acceptable for an employee to have 0 departments (they only see Dashboard)
            // We just ensure they don't crash the system
        }

        const newUser = this.userRepository.create({
            ...createUserDto,
            isActive: true, // Auto-activate when created by admin
            isVerified: true, // Auto-verify when created by admin
            createAt: new Date(),
            updateAt: new Date(),
            parentId: createUserDto.parentId,
            departments,
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
        if (updateUserDto.falLicenseNumber) {
            // Logic to verify Fal license could go here or trigger a job
             user.agentVerificationStatus = VerifyStatus.PENDING; 
        }

        // Standardize verify flag based on profile completion (simplified logic)
        if(updateUserDto.firstName || updateUserDto.lastName ){
            user.isVerified = true
        }

        Object.assign(user, updateUserDto);
        if (!user.phone && !user.email) {
            throw new BadRequestException('User must have phone or email');
        }
        if (updateUserDto.role === Role.MARKETING) user.departments = [Department.MARKETING];
        if (updateUserDto.role === Role.LEGAL) user.departments = [Department.LEGAL];
        if (updateUserDto.role === Role.FINANCE) user.departments = [Department.FINANCE];
        
        // Derive departments from departmentPermissions if it's an employee
        if (updateUserDto.departmentPermissions) {
            // Employees are constrained by their manager's allowed departments.
            if (user.role === Role.EMPLOYEE && user.parentId) {
                const parent = await this.userRepository.findOne({ where: { id: user.parentId } as any });
                if (parent) {
                    const parentDepts = new Set((Array.isArray(parent.departments) ? parent.departments : []) as any[]);
                    const parentPerms = parent.departmentPermissions || {};
                    const allowedDept = (k: string) => parentDepts.has(k as any) || (parentPerms[k] && parentPerms[k] !== 'none');
                    const nextPerms: any = {};
                    Object.entries(updateUserDto.departmentPermissions).forEach(([k, v]) => {
                        if (!allowedDept(k)) {
                            nextPerms[k] = 'none';
                            return;
                        }
                        nextPerms[k] = v;
                    });
                    updateUserDto.departmentPermissions = nextPerms;
                }
            }

            const deptMap: Record<string, Department> = {
                'marketing': Department.MARKETING,
                'properties': Department.PROPERTIES,
                'financial': Department.FINANCE,
                'finance': Department.FINANCE,
                'legal': Department.LEGAL,
                'employees': Department.EMPLOYEES
            };
            const derivedDepts = Object.entries(updateUserDto.departmentPermissions)
                .filter(([key, value]) => value !== 'none' && value !== false)
                .map(([key]) => deptMap[key])
                .filter(Boolean);
            
            user.departments = derivedDepts;
        }

        if (updateUserDto.role === Role.EMPLOYEE && (!user.departments || user.departments.length === 0)) {
            // Acceptable for employee to have no departments
        }
        
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
                'financialAgreementType', 'financialAgreementValue', 'departmentPermissions',
                'departments'
            ]
        });
        
        if (!user) {
            throw new NotFoundException('auth.user_not_found');
        }
        
        // Update lastSeen asynchronously to avoid blocking the response
        this.userRepository.update(userId, { lastSeen: new Date() }).catch(err => console.error('Failed to update lastSeen', err));
        
        return user;
    }

    public async findByDepartment(department: Department): Promise<User[]> {
        // Since departments is simple-json (stored as string), we search for the department in the JSON string
        return await this.userRepository.createQueryBuilder('user')
            .where('user.departments LIKE :dept', { dept: `%${department}%` })
            .getMany();
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
