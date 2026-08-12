import { endpoints, httpClient } from 'shared/api';

export const PARTNER_KIND = {
  Organizer: 0,
  Promoter: 1,
  DanceSchool: 2
};

function appendField(formData, key, value) {
  if (value === null || value === undefined || value === '') {
    return;
  }

  formData.append(key, String(value));
}

function toPartnerFormData(payload = {}, taxCertificateFile = null) {
  const formData = new FormData();

  appendField(formData, 'Kind', payload.kind);
  appendField(formData, 'CompanyTitle', payload.companyTitle);
  appendField(formData, 'Phone', payload.phone);
  appendField(formData, 'AuthorizedPerson', payload.authorizedPerson);
  appendField(formData, 'Email', payload.email);
  appendField(formData, 'IsActive', payload.isActive);

  if (taxCertificateFile) {
    formData.append('TaxCertificate', taxCertificateFile);
  }

  return formData;
}

function normalizeList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

export async function getPartners(params = {}) {
  const response = await httpClient.get(endpoints.admin.partners.list, {
    params: {
      kind: params.kind,
      search: params.search || undefined
    }
  });
  return normalizeList(response.data);
}

export async function getPartnerDetail(id) {
  const response = await httpClient.get(endpoints.admin.partners.detail(id));
  return response.data;
}

export async function createPartner(payload, taxCertificateFile = null) {
  const response = await httpClient.post(
    endpoints.admin.partners.list,
    toPartnerFormData(payload, taxCertificateFile)
  );
  return response.data;
}

export async function updatePartner(id, payload, taxCertificateFile = null) {
  const response = await httpClient.put(
    endpoints.admin.partners.detail(id),
    toPartnerFormData(payload, taxCertificateFile)
  );
  return response.data;
}

export async function updatePartnerActive(id, isActive) {
  await httpClient.patch(endpoints.admin.partners.active(id), { isActive });
}

export async function deletePartner(id) {
  await httpClient.delete(endpoints.admin.partners.detail(id));
}
