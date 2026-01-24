import { Controller, Get, Query } from '@nestjs/common';
import { PlacesService } from './place.service';
import { GetPlacesDto } from './get-places.dto';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  async getPlaces(@Query() query: GetPlacesDto) {
    const { latitude, longitude, radius } = query;

    if (latitude == null || longitude == null) {
      return { error: 'latitude and longitude are required' };
    }

    return this.placesService.getPlaces(latitude, longitude, radius || 1000);
  }
}
