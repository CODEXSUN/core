import { FinancialYearRepository } from "./financial-year.repository.js";

export async function seedFinancialYearModule() {
  const repository = new FinancialYearRepository();
  const existing = await repository.list();
  const today = new Date();
  const calendarYear = today.getUTCFullYear();
  const currentStartYear = today.getUTCMonth() >= 3 ? calendarYear : calendarYear - 1;
  const hasCurrent = existing.some((record) => record.isCurrent);
  for (let startYear = currentStartYear - 3; startYear <= currentStartYear + 3; startYear += 1) {
    const startDate = `${startYear}-04-01`;
    const endDate = `${startYear + 1}-03-31`;
    if (existing.some((record) => record.startDate === startDate && record.endDate === endDate)) {
      continue;
    }
    await repository.create({
      name: `FY ${startYear}-${String(startYear + 1).slice(2)}`,
      startDate,
      endDate,
      isCurrent: !hasCurrent && startYear === currentStartYear,
      status: "active"
    });
  }
}
