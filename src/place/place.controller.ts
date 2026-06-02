import { Controller, Get, Query } from '@nestjs/common';
import { PlacesService } from './place.service';
import { GetPlacesDto } from './get-places.dto';
import { Public } from '../common/decorators/public.decorator';
import { SkipSubscriptionGuard } from '../common/decorators/skip-subscription.decorator';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Public()
  @SkipSubscriptionGuard()
  @Get()
  async getPlaces(@Query() query: GetPlacesDto) {
    const { latitude, longitude, radius } = query;

    if (latitude == null || longitude == null) {
      return { error: 'latitude and longitude are required' };
    }

    return this.placesService.getPlaces(latitude, longitude, radius || 1000);
  }
}
