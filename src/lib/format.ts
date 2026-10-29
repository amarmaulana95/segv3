const rupiah = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatMoney(value: number | null | undefined) {
  return rupiah.format(Number(value ?? 0))
}

// Angka format Indonesia dengan jumlah desimal tertentu, mis. formatAngka(1250000, 0) = "1.250.000".
export function formatAngka(value: number | null | undefined, desimal = 0) {
  return Number(value ?? 0).toLocaleString("id-ID", { minimumFractionDigits: desimal, maximumFractionDigits: desimal })
}

// Kebalikan formatAngka: "1.250.000,5" -> 1250000.5 (titik = ribuan, koma = desimal).
export function parseAngka(value: string) {
  return parseFloat(value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")) || 0
}

const tanggal = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" })

// Kolom timestamp DB tanpa zona waktu dikirim backend berakhiran "Z"; ambil tanggalnya saja supaya tidak
// bergeser karena konversi zona waktu browser.
export function formatTanggal(value: string | null | undefined) {
  return value ? tanggal.format(new Date(`${value.slice(0, 10)}T00:00:00`)) : "-"
}

// Satuan tampil: huruf kecil, m2/m3 jadi m²/m³.
export function formatSatuan(unit: string | null | undefined) {
  return String(unit ?? "")
    .trim()
    .toLowerCase()
    .replace(/^m([23])$/, (_, d: string) => (d === "2" ? "m²" : "m³"))
}
