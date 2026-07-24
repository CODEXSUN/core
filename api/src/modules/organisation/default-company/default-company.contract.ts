import { runWithCoreDatabase } from "../../../database/core-database.js";
import { DefaultCompanyService } from "./default-company.service.js";
import type { DefaultCompanyRecord, DefaultCompanySavePayload } from "./default-company.types.js";

export function defaultCompanyApplicationContract(databaseName: string) {
  const service = new DefaultCompanyService();
  const run = <T>(operation: () => Promise<T>) => runWithCoreDatabase(databaseName, operation);

  return {
    get: () => run(() => service.get()),
    save: (payload: DefaultCompanySavePayload) => run(() => service.save(payload)),
    syncLandingApp: (landingApp: string) =>
      run(async (): Promise<DefaultCompanyRecord | null> => {
        const current = await service.get();
        if (!current || current.landingApp === landingApp) return current;
        return service.save({
          companyId: current.companyId,
          financialYearId: current.financialYearId,
          landingApp,
          status: current.status
        });
      })
  };
}
