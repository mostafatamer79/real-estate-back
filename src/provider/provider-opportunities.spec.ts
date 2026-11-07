import { ProviderService } from './provider.service';
import { Repository, DataSource } from 'typeorm';
import { User } from '../user/user-entity';
import { ServiceRequest } from '../service/service-request.entity';
import { Invoice } from '../financial/entities/invoice.entity';
import { SettingsService } from '../settings/settings.service';
import { providerRequestCategory } from './provider-category';

describe('provider opportunity browsing', () => {
  const setup = (categories = ['legal']) => {
    const query = {
      where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[],0]),
    };
    const users = { findOne: jest.fn().mockResolvedValue({ providerProfile: { status:'approved', categories, kind:'general', deliveryModes:['online'] } }) };
    const requests = { createQueryBuilder: jest.fn().mockReturnValue(query) };
    const settings = { findOne: jest.fn().mockResolvedValue(null) };
    const service = new ProviderService(users as unknown as Repository<User>, requests as unknown as Repository<ServiceRequest>, {} as Repository<Invoice>, {} as DataSource, settings as unknown as SettingsService);
    return {service,query};
  };
  it('applies category, service, and grant constraints before pagination', async () => {
    const {service,query} = setup();
    await service.opportunities('provider', 2, { category:'legal_contracts', service:'عقد بيع' });
    expect(query.andWhere).toHaveBeenCalledWith(expect.any(String), { browseCategory:'legal_contracts' });
    expect(query.andWhere).toHaveBeenCalledWith('request.serviceType = :browseService', { browseService:'عقد بيع' });
    expect(query.andWhere).toHaveBeenCalledWith(expect.any(String), { grant0:'legal', grantPrefix0:'legal_' });
    expect(query.skip).toHaveBeenCalledWith(30);
    expect(query.andWhere.mock.invocationCallOrder.at(-1)).toBeLessThan(query.skip.mock.invocationCallOrder[0]);
  });
  it('browsing another category cannot expand approved grants', async () => {
    const {service,query} = setup(['legal_contracts']);
    const result = await service.opportunities('provider', 1, { category:'marketing' });
    expect(result.items).toEqual([]);
    expect(query.where).toHaveBeenCalledWith('request.category IN (:...categories)', { categories:['legal'] });
    expect(query.andWhere).toHaveBeenCalledWith(expect.any(String), { browseCategory:'marketing' });
  });
  it('handles approved profiles without grants as an empty page', async () => {
    const {service,query} = setup([]);
    expect(await service.opportunities('provider',1)).toEqual({items:[],total:0,page:1});
    expect(query.where).not.toHaveBeenCalled();
  });
  it('classifies metadata-only branches and gives documentation priority', () => {
    expect(providerRequestCategory({category:'legal',serviceType:'خدمة',metadata:{contractDetails:{}}})).toBe('legal_contracts');
    expect(providerRequestCategory({category:'legal',serviceType:'عقد توثيق',metadata:{disputeType:'test'}})).toBe('legal_documentation');
    expect(providerRequestCategory({category:'marketing',serviceType:'توثيق'})).toBe('marketing');
  });
});
