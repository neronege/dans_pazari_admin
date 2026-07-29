import { endpoints, httpClient } from 'shared/api';

const USE_MOCK_DASHBOARD_SUMMARY = false;

function createMockDashboardSummary() {
  return {
    totalSalesAmount: 542300,
    currency: 'TRY',
    paidOrderCount: 1248,
    activeEventCount: 18,
    pendingRefundCount: 9,
    generatedAtUtc: new Date().toISOString()
  };
}

export async function getDashboardSummary() {
  if (USE_MOCK_DASHBOARD_SUMMARY) {
    return createMockDashboardSummary();
  }

  const response = await httpClient.get(endpoints.admin.dashboard.summary);
  return response.data;
}
