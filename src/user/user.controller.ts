// src/user/user.controller.ts
import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../document/file-upload.service';
import { UserService } from './user.service';
import { UpdateUserDto } from './create-user-dto';
import { Role, User, VerifyStatus } from './user-entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorators';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly fileUploadService: FileUploadService
    ) {}

    @Get()
    @Roles([Role.ADMIN])
    @UseGuards(RolesGuard)
    async findAll() {
        return this.userService.findAll();
    }

    @Post()
    @Roles([Role.ADMIN])
    @UseGuards(RolesGuard)
    async create(@Body() createUserDto: any) { // Using any temporarily, should use CreateUserDto but ensure it's imported
        return this.userService.createUser(createUserDto);
    }

    @Get('profile')
    async getProfile(@Request() req) {
        return this.userService.getUserProfile(req.user.id);
    }

    @Put('profile')
    async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUserDetails(req.user.id, updateUserDto);
    }

    @Put(':id/verify')
    @Roles([Role.ADMIN])
    @UseGuards(RolesGuard)
    async updateVerificationStatus(
        @Param('id') userId: string,
        @Body('status') status: VerifyStatus
    ) {
        return this.userService.updateVerificationStatus(userId, status);
    }


    @Post('nafath/send-otp')
    async sendNafathOtp(@Body('nationalId') nationalId: string) {
        return { message: 'OTP sent', success: true };
    }

    @Post('nafath/verify')
    async verifyNafath(@Request() req, @Body('nationalId') nationalId: string, @Body('otp') otp: string) {
        // Mock OTP check
        if (otp !== '1234') {
             throw new BadRequestException('Invalid OTP');
        }
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
    @Roles([Role.ADMIN])
    @UseGuards(RolesGuard)
    async remove(@Param('id') userId: string) {
        await this.userService.remove(userId);
        return { success: true, message: 'User deleted successfully' };
    }

    @Put(':id/role')
    @Roles([Role.ADMIN])
    @UseGuards(RolesGuard)
    async updateRole(
        @Param('id') userId: string,
        @Body('role') role: Role
    ) {
        return this.userService.updateRole(userId, role);
    }
}