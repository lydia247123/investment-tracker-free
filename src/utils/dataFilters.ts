/**
 * Filter records by date range
 * @param records - Records to filter (must have date property)
 * @param dateRange - Date range filter with start and/or end month
 * @returns Filtered records
 */
export function filterRecordsByDateRange<T extends { date: string }>(
  records: T[],
  dateRange: { startMonth: string | null; endMonth: string | null }
): T[] {
  // If no filter applied, return all records
  if (!dateRange.startMonth && !dateRange.endMonth) {
    return records;
  }

  return records.filter(record => {
    const recordDate = record.date;

    // Start date filter: record date must be >= start month
    if (dateRange.startMonth && recordDate < dateRange.startMonth) {
      return false;
    }

    // End date filter: record date must be <= end month
    if (dateRange.endMonth && recordDate > dateRange.endMonth) {
      return false;
    }

    return true;
  });
}

/**
 * Filter monthly data by date range
 * @param monthlyData - Array of monthly data points (must have month property)
 * @param dateRange - Date range filter
 * @returns Filtered monthly data
 */
export function filterMonthlyDataByDateRange<T extends { month: string }>(
  monthlyData: T[],
  dateRange: { startMonth: string | null; endMonth: string | null }
): T[] {
  // If no filter applied, return all data
  if (!dateRange.startMonth && !dateRange.endMonth) {
    return monthlyData;
  }

  return monthlyData.filter(data => {
    const dataMonth = data.month;

    // Start date filter
    if (dateRange.startMonth && dataMonth < dateRange.startMonth) {
      return false;
    }

    // End date filter
    if (dateRange.endMonth && dataMonth > dateRange.endMonth) {
      return false;
    }

    return true;
  });
}
