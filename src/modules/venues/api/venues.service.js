import { endpoints, httpClient } from 'shared/api';

function appendField(formData, key, value) {
  if (value === null || value === undefined || value === '') {
    return;
  }

  formData.append(key, String(value));
}

function toVenueFormData(payload = {}, photos = []) {
  const formData = new FormData();

  appendField(formData, 'name', payload.name);
  appendField(formData, 'slug', payload.slug);
  appendField(formData, 'city', payload.city);
  appendField(formData, 'district', payload.district);
  appendField(formData, 'address', payload.address);
  appendField(formData, 'latitude', payload.latitude);
  appendField(formData, 'longitude', payload.longitude);
  appendField(formData, 'description', payload.description);
  appendField(formData, 'capacity', payload.capacity);
  appendField(formData, 'isActive', payload.isActive);

  if (payload.translations) {
    formData.append('translations', JSON.stringify(payload.translations));
  }

  (photos || []).forEach((file) => {
    if (file) {
      formData.append('Photos', file);
    }
  });

  return formData;
}

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.venues)) {
    return payload.venues;
  }

  return [];
}

export async function getVenues(params = {}) {
  const response = await httpClient.get(endpoints.admin.venues.list, { params });
  return normalizeListPayload(response.data);
}

export async function getVenueDetail(venueId) {
  const response = await httpClient.get(endpoints.admin.venues.detail(venueId));
  return response.data;
}

export async function createVenue(payload, photos = []) {
  const response = await httpClient.post(endpoints.admin.venues.list, toVenueFormData(payload, photos));
  return response.data;
}

export async function updateVenue(venueId, payload, photos = []) {
  const response = await httpClient.put(endpoints.admin.venues.detail(venueId), toVenueFormData(payload, photos));
  return response.data;
}

export async function addVenuePhotos(venueId, photos = []) {
  const formData = new FormData();
  (photos || []).forEach((file) => {
    if (file) {
      formData.append('Photos', file);
    }
  });

  const response = await httpClient.post(endpoints.admin.venues.photos(venueId), formData);
  return response.data;
}

export async function deleteVenuePhoto(venueId, photoId) {
  await httpClient.delete(endpoints.admin.venues.photoDetail(venueId, photoId));
}

export async function updateVenueActive(venueId, isActive) {
  await httpClient.patch(endpoints.admin.venues.active(venueId), { isActive });
}

export async function deleteVenue(venueId) {
  await httpClient.delete(endpoints.admin.venues.detail(venueId));
}
