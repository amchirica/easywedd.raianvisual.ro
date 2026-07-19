# GDPR — EasyWedd

## Privacy Center

Rută: `/dashboard/privacy`

- actualizare consimțăminte
- preferințe email (transactional / reminders / marketing)
- export JSON minimal
- cerere ștergere workspace (pending → admin)

## Jurnal

Tabel `gdpr_requests` — vizibil în `/admin/gdpr`.

## Ștergere workspace

La procesare (service role):

1. șterge / anonimizează date workspace
2. șterge fișiere storage asociate
3. păstrează doar agregate industry deja anonimizate

## Admin

Acces sensibil pe workspace necesită motiv (`admin_access_reasons`) + audit.
