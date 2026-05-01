# Cozy Diary — Versi Supabase + Vercel

Stack: **React + Vite => Vercel** (hosting) + **Supabase** (auth + database). Gak butuh backend server, gak butuh custom domain.

---

## Langkah Deploy (~30 menit)

### Langkah 1 — Daftar Supabase

1. Buka https://supabase.com, klik **Start your project**
2. Login pake GitHub
3. Klik **New project**, isi nama: `diary`
4. Pilih region: **Southeast Asia (Singapore)**
5. Buat password database (catet!), klik **Create new project**
6. Tunggu ~2 menit

### Langkah 2 — Setup Database

Di Supabase dashboard: **SQL Editor => New query**, jalankan SQL ini:

```sql
CREATE TABLE diary_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  mood text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX diary_entries_user_date ON diary_entries(user_id, entry_date DESC);

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own entries only" ON diary_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Langkah 3 — Aktifkan Google Login (opsional)

Supabase => **Authentication => Providers => Google** => Enable, ikutin panduan.
Skip kalau gak mau, daftar via email tetap bisa.

### Langkah 4 — Ambil API Keys

Supabase => **Project Settings => API**, copy:
- **Project URL** contoh: `https://xxxxxxxxxxx.supabase.co`
- **anon public** key (diawali `eyJ...`)

### Langkah 5 — Upload ke GitHub

Upload folder ini ke GitHub repo baru via github.com => New repository => drag-drop.

### Langkah 6 — Deploy ke Vercel

1. Buka https://vercel.com => **Add New => Project**
2. Import repo dari GitHub
3. **Framework Preset**: Vite
4. Tambahin **Environment Variables**:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | Project URL dari langkah 4 |
| `VITE_SUPABASE_ANON_KEY` | anon public key dari langkah 4 |

5. Klik **Deploy**. App lo live di `https://diary-xxxx.vercel.app` setelah ~2 menit.

### Langkah 7 — Tambahkan Redirect URL di Supabase (PENTING)

1. Supabase => **Authentication => URL Configuration**
2. **Redirect URLs** => klik **Add URL**
3. Masukin: `https://diary-xxxx.vercel.app/journal`
4. Save

Tanpa ini, setelah login Supabase gak tau mau redirect ke mana.

---

## Run di Lokal

```
npm install
cp .env.example .env
# Edit .env, isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm run dev
```

Buka http://localhost:5173

---

## Free Tier Limits

| Service | Free Limit |
|---|---|
| Vercel Hobby | 100 GB bandwidth/bulan |
| Supabase Free | 500 MB DB, 50.000 MAU auth |

Untuk diary pribadi 5 bulan: lebih dari cukup.

---

## Troubleshooting

**Setelah login balik lagi ke halaman login:**
Pastiin Redirect URL sudah ditambahin di Supabase (Langkah 7).

**Error "permission denied for table diary_entries":**
Jalankan ulang SQL dari Langkah 2, cek RLS policy sudah ada.

**Login Google gak muncul:**
Cek Supabase => Authentication => Providers => Google sudah enabled.

**Entries kosong setelah login:**
Cek di Supabase => Table Editor apakah tabel `diary_entries` sudah ada.
