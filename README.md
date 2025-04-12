# twittcleaner

## 🧪 `main.js` – Jalankan di Console

Script ini cocok untuk dijalankan langsung dari halaman web melalui DevTools Console.

### ✅ Cara Menggunakan:
1. Buka halaman web target.
2. Tekan `F12` atau klik kanan → **Inspect** → buka tab **Console**.
3. Buka file [`main.js (Tanpa Mode Cepat)`](./main.js) atau [`main-fast.js (+Mode Cepat)`](./main-fast.js) dari repo ini.
4. **Salin seluruh kode** dari `main.js`.
5. **Tempelkan** ke dalam Console.
6. Tekan `Enter` dan script akan berjalan.

📌 **Tips:** Pastikan halaman telah dimuat sepenuhnya sebelum menjalankan script.

---

## 🔖 `bookmark.js` – Gunakan sebagai Bookmarklet

Script ini dirancang agar bisa dijalankan langsung dengan satu klik dari bookmark bar.

### ✅ Cara Menggunakan:
1. Buka file [`bookmark.txt (Tanpa Mode Cepat)`](./bookmark.txt) atau [`bookmark-fast.txt (+Mode Cepat)`](./bookmark-fast.txt).
2. **Salin seluruh kode** dari file tersebut.
3. Buka browser dan buat bookmark baru.
4. Ubah URL bookmark menjadi:

    ```
    javascript:[paste code here]
    ```

    ✨ Contoh:

    ```javascript
    javascript:(function(){alert("Hello from bookmarklet!");})();
    ```

5. Simpan bookmark dengan nama sesuai keinginan.
6. Buka halaman web yang ingin digunakan, lalu klik bookmark tersebut.

📝 **Catatan:** Jangan hapus awalan `javascript:` – itu penting agar script dikenali sebagai bookmarklet.

---

## ⚠️ Disclaimer

- Script ini ditujukan untuk penggunaan pribadi atau eksperimen.
- Selalu baca dan pahami isi script sebelum menjalankannya.

---

