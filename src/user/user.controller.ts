import { Roles } from '../common/decorators/roles.decorators';
// src/user/user.controller.ts
import { Controller, Get, Put, Patch, Post, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../document/file-upload.service';
import { UserService } from './user.service';
import { LicenseApplicationDto, UpdateUserDto } from './create-user-dto';
import { Department, OnboardingStatus, Role, User, VerifyStatus } from './user-entity';
import { AllowUnverified } from '../common/decorators/allow-unverified.decorator';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { EmployeeManagementGuard } from '../common/guards/employee-management.guard';
import { SkipSubscriptionGuard } from '../common/decorators/skip-subscription.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly fileUploadService: FileUploadService,
    ) {}

    @Get()
    @UseGuards(EmployeeManagementGuard)
    async findAll() {
        return this.userService.findAll();
    }

    @Get('by-department/:department')
    @UseGuards(EmployeeManagementGuard)
    async findByDepartment(@Param('department') department: Department) {
        return this.userService.findByDepartment(department);
    }

    @Post()
    @UseGuards(EmployeeManagementGuard)
    async create(@Body() createUserDto: any) { // Using any temporarily, should use CreateUserDto but ensure it's imported
        return this.userService.createUser(createUserDto);
    }

    @Get('profile')
    @SkipSubscriptionGuard()
    async getProfile(@Request() req) {
        return this.userService.getUserProfile(req.user.id);
    }

    @Get(':id/overview')
    @UseGuards(EmployeeManagementGuard)
    async getAdminOverview(@Param('id') userId: string) {
        return this.userService.getAdminUserOverview(userId);
    }

    @Get(':id')
    @UseGuards(EmployeeManagementGuard)
    async findOneById(@Param('id') userId: string) {
        return this.userService.getAdminUserDetails(userId);
    }

    @AllowUnverified()
    @Put('profile')
    @SkipSubscriptionGuard()
    async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
        // License-review fields are server controlled. A user must use the
        // dedicated application endpoint instead of self-verifying a role.
        // Profile maintenance never grants staff departments, pricing, approval or an administrative role.
        const allowed = new Set(['firstName', 'lastName', 'role', 'roleOtherDescription', 'address', 'city', 'country', 'profileImage', 'idDocument', 'licenseDocument', 'falLicenseNumber', 'agentLicenseNumber', 'falLicenseExpiry', 'licenseIssueDate', 'lawLicenseNumber', 'commercialRegistrationNumber', 'brokerType']);
        const profileUpdate = Object.fromEntries(Object.entries(updateUserDto).filter(([key, value]) => allowed.has(key) && value !== undefined));
        if (profileUpdate.role && ![Role.USER, Role.VIEWER, Role.OWNER, req.user.role].includes(profileUpdate.role)) {
            throw new BadRequestException('Submit a professional application or contact the administrator to change this role');
        }
        return this.userService.updateUserDetails(req.user.id, profileUpdate as UpdateUserDto);
    }

    @AllowUnverified()
    @Post('profile/license-application')
    @SkipSubscriptionGuard()
    async submitLicenseApplication(@Request() req, @Body() application: LicenseApplicationDto) {
        return this.userService.submitLicenseApplication(req.user.id, application);
    }

    @AllowUnverified()
    @Patch('profile/onboarding')
    @SkipSubscriptionGuard()
    async updateOnboardingStatus(
        @Request() req,
        @Body('status') status: OnboardingStatus
    ) {
        if (!status || !Object.values(OnboardingStatus).includes(status)) {
            throw new BadRequestException('Invalid onboarding status');
        }
        return this.userService.updateOnboardingStatus(req.user.id, status);
    }

    @Post(':id/license-review')
    @Roles([Role.ADMIN])
    @UseGuards(EmployeeManagementGuard)
    async reviewLicenseApplication(
        @Param('id') userId: string,
        @Body('status') status: VerifyStatus,
        @Body('reviewNote') reviewNote?: string
    ) {
        if (status !== VerifyStatus.VERIFIED && status !== VerifyStatus.REJECTED) {
            throw new BadRequestException('Invalid license review status');
        }
        return this.userService.reviewLicenseApplication(userId, status, reviewNote);
    }


    @AllowUnverified()
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
    @SkipSubscriptionGuard()
    async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
        // Folder 'profile-images'
        const uploaded = await this.fileUploadService.uploadFile(file, 'profile-images');
        return {
            success: true,
            data: { url: uploaded.fileUrl }
        };
    }

    @Delete(':id')
    @UseGuards(EmployeeManagementGuard)
    async remove(@Param('id') userId: string) {
        await this.userService.remove(userId);
        return { success: true, message: 'User deleted successfully' };
    }

    @Put(':id')
    @UseGuards(EmployeeManagementGuard)
    async update(
        @Param('id') userId: string,
        @Body() updateUserDto: UpdateUserDto
    ) {
        const { agentVerificationStatus, licenseVerificationStatus, requestedRole, ...adminUpdate } = updateUserDto;
        return this.userService.updateUserDetails(userId, adminUpdate);
    }

    @Put(':id/role')
    @UseGuards(EmployeeManagementGuard)
    async updateRole(
        @Param('id') userId: string,
        @Body('role') role: Role
    ) {
        return this.userService.updateUserDetails(userId, { role });
    }
}
