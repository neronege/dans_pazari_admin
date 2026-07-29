import { buildPageQuery, endpoints, httpClient, normalizePagedResponse } from 'shared/api';

export async function getOrders(params = {}) {
  const paging = buildPageQuery({
    page: params.page,
    pageSize: params.pageSize
  });

  const response = await httpClient.get(endpoints.admin.orders.list, {
    params: {
      ...paging,
      search: params.search,
      status: params.status
    }
  });

  return normalizePagedResponse(response.data, paging);
}

export async function getOrderDetail(orderId) {
  const response = await httpClient.get(endpoints.admin.orders.detail(orderId));
  return response.data;
}

export async function fulfillOrderPayment(orderId) {
  const response = await httpClient.post(endpoints.admin.orders.fulfillPayment(orderId), {});
  return response.data;
}
