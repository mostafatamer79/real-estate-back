// src/user/user.controller.ts
import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../document/file-upload.service';
import { UserService } from './user.service';
import { UpdateUserDto } from './create-user-dto';
import { Department, Role, User, VerifyStatus } from './user-entity';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { EmployeeManagementGuard } from '../common/guards/employee-management.guard';
import { MailService } from '../mail/mail.service';
import { AuthService } from '../auth/auth.service';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly fileUploadService: FileUploadService,
        private readonly mailService: MailService,
        private readonly authService: AuthService,
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

    @Put('profile')
    async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUserDetails(req.user.id, updateUserDto);
    }

    @Put(':id/verify')
    @UseGuards(EmployeeManagementGuard)
    async updateVerificationStatus(
        @Param('id') userId: string,
        @Body('status') status: VerifyStatus
    ) {
        return this.userService.updateVerificationStatus(userId, status);
    }


    @Post('nafath/send-otp')
    async sendNafathOtp(@Request() req, @Body('nationalId') nationalId: string) {
        if (!nationalId) {
            throw new BadRequestException('National ID is required');
        }

        const user = await this.userService.findOne(req.user.id);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (!user.email) {
            throw new BadRequestException('A verified email address is required to receive the code');
        }

        const otp = await this.authService.generateOtp();
        user.otp = otp;
        user.expireOtp = new Date(Date.now() + 5 * 60 * 1000);
        await this.userService.updateUser(user);
        await this.mailService.sendOtp(user, otp);

        return { message: 'OTP sent', success: true, nationalId };
    }

    @Post('nafath/verify')
    async verifyNafath(@Request() req, @Body('nationalId') nationalId: string, @Body('otp') otp: string) {
        const user = await this.userService.findOne(req.user.id);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (!user.otp || !user.expireOtp || user.expireOtp < new Date() || user.otp !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        user.otp = null;
        user.expireOtp = null;
        await this.userService.updateUser(user);

        return this.userService.verifyNafath(req.user.id, nationalId);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
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
        return this.userService.updateUserDetails(userId, updateUserDto);
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
