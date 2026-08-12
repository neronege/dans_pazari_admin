'use client';

import PartnersPage from 'modules/partners/pages/PartnersPage';
import { PARTNER_KIND } from 'modules/partners/api/partners.service';

export default function DanceSchoolsPage() {
  return (
    <PartnersPage
      kind={PARTNER_KIND.DanceSchool}
      formMode="company"
      title="Dans Okulları"
      addLabel="Dans Okulu Ekle"
      editLabel="Dans Okulu Düzenle"
      emptyLabel="Henüz dans okulu yok."
      description="Dans okulu kayıtlarını ekleyin, vergi levhası yükleyin ve yönetin."
    />
  );
}
