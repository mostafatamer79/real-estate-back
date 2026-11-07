import {
  ProviderApplicationDto,
  ProviderReviewDto,
  ProviderOfferDto,
  ProviderControlsDto,
} from "./provider.dto";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Request,
} from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorators";
import { Role } from "../user/user-entity";
import { SkipSubscriptionGuard } from "../common/decorators/skip-subscription.decorator";
import { ProviderService } from "./provider.service";

interface ProviderActorRequest {
  user: { id: string; role: Role };
}

const pageNumber = (page?: string) =>
  Math.max(1, Math.min(10000, Math.floor(Number(page) || 1)));
@SkipSubscriptionGuard()
@Controller("service-providers")
export class ProviderController {
  constructor(private readonly providers: ProviderService) {}

  @Get("me") mine(@Request() req: ProviderActorRequest) {
    return this.providers.mine(req.user.id);
  }
  @Post("apply") apply(
    @Request() req: ProviderActorRequest,
    @Body() input: ProviderApplicationDto,
  ) {
    return this.providers.apply(req.user.id, input);
  }
  @Get("my-requests") myRequests(
    @Request() req: ProviderActorRequest,
    @Query("page") page?: string,
  ) {
    return this.providers.myRequests(req.user.id, pageNumber(page));
  }
  @Get("opportunities") opportunities(
    @Request() req: ProviderActorRequest,
    @Query("page") page?: string,
    @Query("category") category?: string,
    @Query("service") service?: string,
  ) {
    if ((category !== undefined && (typeof category !== "string" || category.length > 80)) || (service !== undefined && (typeof service !== "string" || service.length > 500))) {
      throw new BadRequestException("Invalid service filter");
    }
    return this.providers.opportunities(req.user.id, pageNumber(page), { category, service });
  }
  @Get("controls") @Roles([Role.ADMIN]) controls() {
    return this.providers.getControls();
  }
  @Put("controls") @Roles([Role.ADMIN]) saveControls(
    @Body() input: ProviderControlsDto,
  ) {
    return this.providers.saveControls(input);
  }
  @Get() @Roles([Role.ADMIN]) list(@Query("page") page?: string) {
    return this.providers.list(pageNumber(page));
  }
  @Put(":id/review") @Roles([Role.ADMIN]) review(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: ProviderReviewDto,
    @Request() req: ProviderActorRequest,
  ) {
    return this.providers.review(id, input, req.user.id);
  }
  @Post("requests/:id/offers") offer(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: ProviderOfferDto,
    @Request() req: ProviderActorRequest,
  ) {
    return this.providers.offer(id, req.user.id, input);
  }
  @Get("requests/:id/offers") offers(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: ProviderActorRequest,
  ) {
    return this.providers.offers(id, req.user);
  }
  @Put("requests/:id/assign/:providerId") @Roles([Role.ADMIN]) assign(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("providerId", ParseUUIDPipe) providerId: string,
  ) {
    return this.providers.assign(id, providerId);
  }
  @Get("requests/:id/contact") contact(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: ProviderActorRequest,
  ) {
    return this.providers.contact(id, req.user.id);
  }
}
