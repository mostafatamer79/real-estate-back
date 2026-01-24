import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from './place.entity';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(Place)
    private placeRepo: Repository<Place>,
  ) {}

  /**
   * Get all places within a radius (meters) from a given point
   */
  async getPlaces(lat: number, lng: number, radius = 1000): Promise<Place[]> {
    const query = `
      SELECT *,
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude
      FROM place
      WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
    `;
    const places = await this.placeRepo.query(query, [lng, lat, radius]);
    return places;
  }

  /**
//    * Optional: bulk insert or update places
//    */
//   async savePlaces(places: Partial<Place>[]) {
//     for (const place of places) {
//       await this.placeRepo.save({
//         ...place,
//         // Convert plain lat/lng to PostGIS point
//         location: `POINT(${place.longitude} ${place.latitude})`,
//       });
//     }
//   }
// }
}