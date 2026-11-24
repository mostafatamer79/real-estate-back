import { validateSync } from "class-validator";
import {
  CreateManagementPackageDto,
  UpdateManagementPackageDto,
} from "./create-management-package.dto";

describe("package discount validation", () => {
  it.each([CreateManagementPackageDto, UpdateManagementPackageDto])(
    "rejects a discount over 100 and an unknown period on %p",
    (Dto) => {
      const value = Object.assign(new Dto(), {
        name: "Plan",
        monthlyPrice: 100,
        yearlyPrice: 1000,
        administrations: [],
        discount: 101,
        discountPeriod: "weekly",
      });
      const fields = validateSync(value).map((error) => error.property);
      expect(fields).toContain("discount");
      expect(fields).toContain("discountPeriod");
    },
  );
});
