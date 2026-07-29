import { endpoints, httpClient } from 'shared/api';

const USE_MOCK_REPORTS = false;

function asDate(value, fallbackDate) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return new Date(fallbackDate);
  }

  return parsed;
}

function makeRange(params = {}) {
  const now = new Date();
  const fallbackFrom = new Date(now);
  fallbackFrom.setDate(fallbackFrom.getDate() - 6);

  const from = asDate(params.fromUtc, fallbackFrom);
  const to = asDate(params.toUtc, now);

  if (from > to) {
    return { from: to, to: from };
  }

  return { from, to };
}

function daysBetween(from, to) {
  const diffMs = to.getTime() - from.getTime();
  return Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
}

function createMockBreakdown(from, totalDays) {
  return Array.from({ length: totalDays }).map((_, index) => {
    const day = new Date(from);
    day.setDate(day.getDate() + index);
    const amount = 12000 + index * 850;

    return {
      periodStartUtc: day.toISOString(),
      salesAmount: amount
    };
  });
}

function createMockSalesReport(params = {}) {
  const { from, to } = makeRange(params);
  const dayCount = daysBetween(from, to);
  const breakdown = createMockBreakdown(from, dayCount);
  const gross = breakdown.reduce((total, item) => total + Number(item.salesAmount || 0), 0);
  const net = Math.round(gross * 0.9);
  const tickets = dayCount * 42;

  return {
    grossSalesAmount: gross,
    netSalesAmount: net,
    ticketsSold: tickets,
    currency: 'TRY',
    breakdown
  };
}

function createMockPerformanceReport() {
  return [
    {
      eventId: 'event-101',
      eventTitle: 'Yaz Dans Gecesi',
      ticketsSold: 320,
      grossSalesAmount: 184000,
      netSalesAmount: 168500,
      refundCount: 6
    },
    {
      eventId: 'event-102',
      eventTitle: 'Salsa Marathon',
      ticketsSold: 245,
      grossSalesAmount: 141800,
      netSalesAmount: 129400,
      refundCount: 4
    },
    {
      eventId: 'event-103',
      eventTitle: 'Bachata Bootcamp',
      ticketsSold: 198,
      grossSalesAmount: 118700,
      netSalesAmount: 109100,
      refundCount: 3
    }
  ];
}

function createMockCsv(params = {}) {
  const report = createMockSalesReport(params);
  const lines = ['Tarih,SatisTutari'];

  report.breakdown.forEach((row) => {
    lines.push(`${row.periodStartUtc},${row.salesAmount}`);
  });

  return new Blob([`${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8' });
}

export async function getSalesReport(params) {
  if (USE_MOCK_REPORTS) {
    return createMockSalesReport(params);
  }

  const response = await httpClient.get(endpoints.admin.reports.sales, { params });
  return response.data;
}

export async function getPerformanceReport(params) {
  if (USE_MOCK_REPORTS) {
    return createMockPerformanceReport(params);
  }

  const response = await httpClient.get(endpoints.admin.reports.performance, { params });
  return response.data;
}

export async function exportSalesReportCsv(params) {
  if (USE_MOCK_REPORTS) {
    return createMockCsv(params);
  }

  const response = await httpClient.get(endpoints.admin.reports.salesExport, {
    params,
    responseType: 'blob'
  });

  return response.data;
}
