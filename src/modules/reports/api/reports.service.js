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
    const orderCount = 18 + (index % 7);
    const ticketCount = orderCount * 2;

    return {
      periodStartUtc: day.toISOString(),
      salesAmount: amount,
      orderCount,
      ticketCount
    };
  });
}

function createMockSalesReport(params = {}) {
  const { from, to } = makeRange(params);
  const dayCount = daysBetween(from, to);
  const breakdown = createMockBreakdown(from, dayCount);
  const gross = breakdown.reduce((total, item) => total + Number(item.salesAmount || 0), 0);
  const orderCount = breakdown.reduce((total, item) => total + Number(item.orderCount || 0), 0);
  const tickets = dayCount * 42;

  return {
    totalSalesAmount: gross,
    orderCount,
    ticketCount: tickets,
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
      ticketsUsed: 210,
      ticketsRefunded: 12,
      capacity: 500,
      grossSalesAmount: 184000,
      refundCount: 6
    },
    {
      eventId: 'event-102',
      eventTitle: 'Salsa Marathon',
      ticketsSold: 245,
      ticketsUsed: 180,
      ticketsRefunded: 8,
      capacity: 380,
      grossSalesAmount: 141800,
      refundCount: 4
    },
    {
      eventId: 'event-103',
      eventTitle: 'Bachata Bootcamp',
      ticketsSold: 198,
      ticketsUsed: 142,
      ticketsRefunded: 5,
      capacity: 300,
      grossSalesAmount: 118700,
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
