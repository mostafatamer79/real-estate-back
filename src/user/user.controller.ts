// src/user/user.controller.ts
import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './create-user-dto';
import { User, VerifyStatus } from './user-entity';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('profile')
    async getProfile(@Request() req) {
        return this.userService.getUserProfile(req.user.id);
    }

    @Put('profile')
    async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUserDetails(req.user.id, updateUserDto);
    }

    @Put(':id/verify')
    @Roles()
    @UseGuards(RolesGuard)
    async updateVerificationStatus(
        @Param('id') userId: string,
        @Body('status') status: VerifyStatus
    ) {
        return this.userService.updateVerificationStatus(userId, status);
    }
}