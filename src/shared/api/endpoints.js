export const endpoints = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    adminPing: '/auth/admin/ping'
  },
  admin: {
    dashboard: {
      summary: '/admin/dashboard/summary'
    },
    reports: {
      sales: '/admin/reports/sales',
      salesExport: '/admin/reports/sales/export',
      performance: '/admin/reports/performance'
    },
    auditLogs: {
      list: '/admin/audit-logs',
      detail: (id) => `/admin/audit-logs/${id}`
    },
    categories: {
      list: '/admin/categories',
      detail: (id) => `/admin/categories/${id}`,
      active: (id) => `/admin/categories/${id}/active`,
      reorder: '/admin/categories/reorder'
    },
    venues: {
      list: '/admin/venues',
      detail: (id) => `/admin/venues/${id}`,
      active: (id) => `/admin/venues/${id}/active`,
      photos: (id) => `/admin/venues/${id}/photos`,
      photoDetail: (id, photoId) => `/admin/venues/${id}/photos/${photoId}`
    },
    events: {
      list: '/admin/events',
      detail: (id) => `/admin/events/${id}`,
      publish: (id) => `/admin/events/${id}/publish`,
      unpublish: (id) => `/admin/events/${id}/unpublish`,
      cancel: (id) => `/admin/events/${id}/cancel`,
      featured: (id) => `/admin/events/${id}/featured`,
      cover: (id) => `/admin/events/${id}/cover`,
      photos: (id) => `/admin/events/${id}/photos`,
      photoDetail: (id, photoId) => `/admin/events/${id}/photos/${photoId}`,
      banner: (id) => `/admin/events/${id}/banner`,
      sessions: (eventId) => `/admin/events/${eventId}/sessions`,
      sessionDetail: (eventId, sessionId) => `/admin/events/${eventId}/sessions/${sessionId}`,
      sessionCancel: (eventId, sessionId) => `/admin/events/${eventId}/sessions/${sessionId}/cancel`,
      ticketTypes: (eventId, sessionId) => `/admin/events/${eventId}/sessions/${sessionId}/ticket-types`,
      ticketTypeDetail: (eventId, sessionId, ticketTypeId) => `/admin/events/${eventId}/sessions/${sessionId}/ticket-types/${ticketTypeId}`,
      bulkRefunds: (eventId) => `/admin/events/${eventId}/start-bulk-refunds`
    },
    orders: {
      list: '/admin/orders',
      detail: (id) => `/admin/orders/${id}`,
      fulfillPayment: (id) => `/admin/orders/${id}/fulfill-payment`
    },
    tickets: {
      scan: '/admin/tickets/scan'
    },
    refunds: {
      list: '/admin/refund-requests',
      detail: (id) => `/admin/refund-requests/${id}`,
      approve: (id) => `/admin/refund-requests/${id}/approve`,
      reject: (id) => `/admin/refund-requests/${id}/reject`
    },
    blog: {
      categories: '/admin/blog/categories',
      categoryDetail: (id) => `/admin/blog/categories/${id}`,
      tags: '/admin/blog/tags',
      tagDetail: (id) => `/admin/blog/tags/${id}`,
      posts: '/admin/blog/posts',
      postDetail: (id) => `/admin/blog/posts/${id}`,
      postPublish: (id) => `/admin/blog/posts/${id}/publish`,
      postUnpublish: (id) => `/admin/blog/posts/${id}/unpublish`,
      postArchive: (id) => `/admin/blog/posts/${id}/archive`,
      postCover: (id) => `/admin/blog/posts/${id}/cover`,
      postPhotos: (id) => `/admin/blog/posts/${id}/photos`,
      postPhotoDetail: (id, photoId) => `/admin/blog/posts/${id}/photos/${photoId}`
    },
    legal: {
      list: '/admin/legal',
      detail: (slug) => `/admin/legal/${slug}`,
      publish: (slug) => `/admin/legal/${slug}/publish`,
      unpublish: (slug) => `/admin/legal/${slug}/unpublish`
    },
    raffles: {
      list: '/admin/raffles',
      detail: (id) => `/admin/raffles/${id}`,
      schedule: (id) => `/admin/raffles/${id}/schedule`,
      open: (id) => `/admin/raffles/${id}/open`,
      cancel: (id) => `/admin/raffles/${id}/cancel`,
      prizes: (id) => `/admin/raffles/${id}/prizes`,
      prizeDetail: (id, prizeId) => `/admin/raffles/${id}/prizes/${prizeId}`,
      entries: (id) => `/admin/raffles/${id}/entries`,
      winners: (id) => `/admin/raffles/${id}/winners`
    },
    users: {
      list: '/admin/users',
      detail: (id) => `/admin/users/${id}`,
      suspend: (id) => `/admin/users/${id}/suspend`,
      ban: (id) => `/admin/users/${id}/ban`,
      activate: (id) => `/admin/users/${id}/activate`
    }
  }
};

export default endpoints;
