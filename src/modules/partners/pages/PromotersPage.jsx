'use client';

import PartnersPage from 'modules/partners/pages/PartnersPage';
import { PARTNER_KIND } from 'modules/partners/api/partners.service';

export default function PromotersPage() {
  return (
    <PartnersPage
      kind={PARTNER_KIND.Promoter}
      formMode="person"
      title="Promotörler"
      addLabel="Promotör Ekle"
      editLabel="Promotör Düzenle"
      emptyLabel="Henüz promotör yok."
      description="Promotörler kişi bazlıdır. Ad, soyad, e-posta ve telefon ile ekleyin."
    />
  );
}
