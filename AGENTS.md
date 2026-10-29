## UI & Design Rules (Peraturan Paten)

- **DILARANG KERAS Menggunakan Bulatan Indikator "Live" (Status Dots)**:
  - Jangan pernah menambahkan elemen bulatan kecil seperti `<span class="w-1.5 h-1.5 rounded-full ...">`, `w-2 h-2 rounded-full`, `w-2.5 h-2.5 rounded-full`, `animate-ping`, atau `animate-pulse` di dalam badge status (contoh: `● Aktif`, `● Menunggu ACC`), di sudut avatar profil, di samping label statistik, ataupun di header komponen.
  - Pola bulatan indikator seperti itu memberikan kesan *vibe coding* / template AI generik dan dilarang secara permanen di seluruh proyek ini. Gunakan tipografi yang bersih, warna teks, atau garis aksen tanpa titik bulatan.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
