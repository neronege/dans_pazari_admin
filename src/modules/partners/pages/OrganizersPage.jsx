'use client';

import PartnersPage from 'modules/partners/pages/PartnersPage';
import { PARTNER_KIND } from 'modules/partners/api/partners.service';

export default function OrganizersPage() {
  return (
    <PartnersPage
      kind={PARTNER_KIND.Organizer}
      formMode="company"
      title="Organizatörler"
      addLabel="Organizatör Ekle"
      editLabel="Organizatör Düzenle"
      emptyLabel="Henüz organizatör yok."
      description="Organizatör kayıtlarını ekleyin, vergi levhası yükleyin ve yönetin."
    />
  );
}
