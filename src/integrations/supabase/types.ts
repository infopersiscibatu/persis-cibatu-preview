export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_unit_sekolah: {
        Row: {
          admin_sekolah: string | null
          admin_spmb: string | null
          admin_tu: string | null
          aktif: boolean
          diperbarui: string
          pin: string
          unit_id: string
        }
        Insert: {
          admin_sekolah?: string | null
          admin_spmb?: string | null
          admin_tu?: string | null
          aktif?: boolean
          diperbarui?: string
          pin: string
          unit_id: string
        }
        Update: {
          admin_sekolah?: string | null
          admin_spmb?: string | null
          admin_tu?: string | null
          aktif?: boolean
          diperbarui?: string
          pin?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_unit_sekolah_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "unit_pendidikan"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda: {
        Row: {
          dibaca: number
          dibuat: string
          diperbarui: string
          id: string
          isi: Json
          judul: string
          media_id: string | null
          tag: string | null
          tanggal: string
          tempat: string | null
          terbit: boolean
          waktu: string | null
        }
        Insert: {
          dibaca?: number
          dibuat?: string
          diperbarui?: string
          id: string
          isi?: Json
          judul: string
          media_id?: string | null
          tag?: string | null
          tanggal: string
          tempat?: string | null
          terbit?: boolean
          waktu?: string | null
        }
        Update: {
          dibaca?: number
          dibuat?: string
          diperbarui?: string
          id?: string
          isi?: Json
          judul?: string
          media_id?: string | null
          tag?: string | null
          tanggal?: string
          tempat?: string | null
          terbit?: boolean
          waktu?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      aktivitas: {
        Row: {
          aksi: string
          data: Json | null
          dibuat: string
          entitas: string | null
          entitas_id: string | null
          id: number
          pengguna_id: string | null
          ringkasan: string | null
        }
        Insert: {
          aksi: string
          data?: Json | null
          dibuat?: string
          entitas?: string | null
          entitas_id?: string | null
          id?: number
          pengguna_id?: string | null
          ringkasan?: string | null
        }
        Update: {
          aksi?: string
          data?: Json | null
          dibuat?: string
          entitas?: string | null
          entitas_id?: string | null
          id?: number
          pengguna_id?: string | null
          ringkasan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aktivitas_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      alumni: {
        Row: {
          aktif: boolean
          catatan: string | null
          dibuat: string
          diperbarui: string
          id: string
          instansi: string | null
          jenjang_id: string | null
          kota: string | null
          nama: string
          nis: string | null
          pekerjaan: string | null
          santri_id: string | null
          tahun_lulus: number | null
          telepon: string | null
          unit_id: string | null
        }
        Insert: {
          aktif?: boolean
          catatan?: string | null
          dibuat?: string
          diperbarui?: string
          id: string
          instansi?: string | null
          jenjang_id?: string | null
          kota?: string | null
          nama: string
          nis?: string | null
          pekerjaan?: string | null
          santri_id?: string | null
          tahun_lulus?: number | null
          telepon?: string | null
          unit_id?: string | null
        }
        Update: {
          aktif?: boolean
          catatan?: string | null
          dibuat?: string
          diperbarui?: string
          id?: string
          instansi?: string | null
          jenjang_id?: string | null
          kota?: string | null
          nama?: string
          nis?: string | null
          pekerjaan?: string | null
          santri_id?: string | null
          tahun_lulus?: number | null
          telepon?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alumni_jenjang_id_fkey"
            columns: ["jenjang_id"]
            isOneToOne: false
            referencedRelation: "jenjang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumni_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumni_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unit_pendidikan"
            referencedColumns: ["id"]
          },
        ]
      }
      artikel: {
        Row: {
          dibaca: number
          dibuat: string
          diperbarui: string
          gambar_url: string | null
          id: string
          isi: Json
          judul: string
          kategori: string | null
          media_id: string | null
          menit_baca: number
          penulis: string | null
          ringkasan: string | null
          slug: string
          tanggal: string
          terbit: boolean
        }
        Insert: {
          dibaca?: number
          dibuat?: string
          diperbarui?: string
          gambar_url?: string | null
          id: string
          isi?: Json
          judul: string
          kategori?: string | null
          media_id?: string | null
          menit_baca?: number
          penulis?: string | null
          ringkasan?: string | null
          slug: string
          tanggal?: string
          terbit?: boolean
        }
        Update: {
          dibaca?: number
          dibuat?: string
          diperbarui?: string
          gambar_url?: string | null
          id?: string
          isi?: Json
          judul?: string
          kategori?: string | null
          media_id?: string | null
          menit_baca?: number
          penulis?: string | null
          ringkasan?: string | null
          slug?: string
          tanggal?: string
          terbit?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "artikel_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      berita: {
        Row: {
          dibaca: number
          dibuat: string
          diperbarui: string
          gambar_url: string | null
          id: string
          isi: Json
          judul: string
          kategori: string | null
          media_id: string | null
          penulis: string | null
          ringkasan: string | null
          slug: string
          sorotan: boolean
          tanggal: string
          terbit: boolean
          terbit_pada: string | null
        }
        Insert: {
          dibaca?: number
          dibuat?: string
          diperbarui?: string
          gambar_url?: string | null
          id: string
          isi?: Json
          judul: string
          kategori?: string | null
          media_id?: string | null
          penulis?: string | null
          ringkasan?: string | null
          slug: string
          sorotan?: boolean
          tanggal?: string
          terbit?: boolean
          terbit_pada?: string | null
        }
        Update: {
          dibaca?: number
          dibuat?: string
          diperbarui?: string
          gambar_url?: string | null
          id?: string
          isi?: Json
          judul?: string
          kategori?: string | null
          media_id?: string | null
          penulis?: string | null
          ringkasan?: string | null
          slug?: string
          sorotan?: boolean
          tanggal?: string
          terbit?: boolean
          terbit_pada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "berita_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      donasi: {
        Row: {
          anonim: boolean
          bukti_media_id: string | null
          dibuat: string
          dicatat_oleh: string | null
          diperbarui: string
          email: string | null
          id: number
          jumlah: number
          metode: string | null
          metode_id: string | null
          nama: string | null
          pesan: string | null
          program_id: string | null
          status: string
          telepon: string | null
        }
        Insert: {
          anonim?: boolean
          bukti_media_id?: string | null
          dibuat?: string
          dicatat_oleh?: string | null
          diperbarui?: string
          email?: string | null
          id?: number
          jumlah?: number
          metode?: string | null
          metode_id?: string | null
          nama?: string | null
          pesan?: string | null
          program_id?: string | null
          status?: string
          telepon?: string | null
        }
        Update: {
          anonim?: boolean
          bukti_media_id?: string | null
          dibuat?: string
          dicatat_oleh?: string | null
          diperbarui?: string
          email?: string | null
          id?: number
          jumlah?: number
          metode?: string | null
          metode_id?: string | null
          nama?: string | null
          pesan?: string | null
          program_id?: string | null
          status?: string
          telepon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donasi_bukti_media_id_fkey"
            columns: ["bukti_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donasi_dicatat_oleh_fkey"
            columns: ["dicatat_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donasi_metode_id_fkey"
            columns: ["metode_id"]
            isOneToOne: false
            referencedRelation: "donasi_metode"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donasi_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "donasi_program"
            referencedColumns: ["id"]
          },
        ]
      }
      donasi_donatur: {
        Row: {
          id: string
          jumlah: number
          metode: string | null
          nama: string
          program_id: string
          tampil: boolean
          waktu: string | null
        }
        Insert: {
          id: string
          jumlah?: number
          metode?: string | null
          nama: string
          program_id: string
          tampil?: boolean
          waktu?: string | null
        }
        Update: {
          id?: string
          jumlah?: number
          metode?: string | null
          nama?: string
          program_id?: string
          tampil?: boolean
          waktu?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donasi_donatur_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "donasi_program"
            referencedColumns: ["id"]
          },
        ]
      }
      donasi_kategori: {
        Row: {
          aktif: boolean
          dibuat: string
          diperbarui: string
          id: string
          keterangan: string | null
          nama: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          id: string
          keterangan?: string | null
          nama: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          id?: string
          keterangan?: string | null
          nama?: string
          urutan?: number
        }
        Relationships: []
      }
      donasi_metode: {
        Row: {
          aktif: boolean
          diperbarui: string
          gambar_url: string | null
          id: string
          keterangan: string | null
          langkah: Json
          media_id: string | null
          nama: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          diperbarui?: string
          gambar_url?: string | null
          id: string
          keterangan?: string | null
          langkah?: Json
          media_id?: string | null
          nama: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          diperbarui?: string
          gambar_url?: string | null
          id?: string
          keterangan?: string | null
          langkah?: Json
          media_id?: string | null
          nama?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "donasi_metode_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      donasi_penyaluran: {
        Row: {
          bukti_media_id: string | null
          dibuat: string
          dicatat_oleh: string | null
          diperbarui: string
          id: string
          judul: string
          keterangan: string | null
          nominal: number
          program_id: string | null
          tanggal: string | null
        }
        Insert: {
          bukti_media_id?: string | null
          dibuat?: string
          dicatat_oleh?: string | null
          diperbarui?: string
          id: string
          judul: string
          keterangan?: string | null
          nominal?: number
          program_id?: string | null
          tanggal?: string | null
        }
        Update: {
          bukti_media_id?: string | null
          dibuat?: string
          dicatat_oleh?: string | null
          diperbarui?: string
          id?: string
          judul?: string
          keterangan?: string | null
          nominal?: number
          program_id?: string | null
          tanggal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donasi_penyaluran_bukti_media_id_fkey"
            columns: ["bukti_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donasi_penyaluran_dicatat_oleh_fkey"
            columns: ["dicatat_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donasi_penyaluran_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "donasi_program"
            referencedColumns: ["id"]
          },
        ]
      }
      donasi_program: {
        Row: {
          aktif: boolean
          batas: string | null
          dibuat: string
          diperbarui: string
          gambar_url: string | null
          id: string
          isi: Json
          judul: string
          jumlah_donatur: number
          kategori: string | null
          media_id: string | null
          metode: Json
          pengelola: string | null
          rincian: Json
          ringkasan: string | null
          slug: string
          target: number
          terkumpul: number
        }
        Insert: {
          aktif?: boolean
          batas?: string | null
          dibuat?: string
          diperbarui?: string
          gambar_url?: string | null
          id: string
          isi?: Json
          judul: string
          jumlah_donatur?: number
          kategori?: string | null
          media_id?: string | null
          metode?: Json
          pengelola?: string | null
          rincian?: Json
          ringkasan?: string | null
          slug: string
          target?: number
          terkumpul?: number
        }
        Update: {
          aktif?: boolean
          batas?: string | null
          dibuat?: string
          diperbarui?: string
          gambar_url?: string | null
          id?: string
          isi?: Json
          judul?: string
          jumlah_donatur?: number
          kategori?: string | null
          media_id?: string | null
          metode?: Json
          pengelola?: string | null
          rincian?: Json
          ringkasan?: string | null
          slug?: string
          target?: number
          terkumpul?: number
        }
        Relationships: [
          {
            foreignKeyName: "donasi_program_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      donasi_rekening: {
        Row: {
          aktif: boolean
          atas_nama: string | null
          bank: string
          id: string
          nomor: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          atas_nama?: string | null
          bank: string
          id: string
          nomor: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          atas_nama?: string | null
          bank?: string
          id?: string
          nomor?: string
          urutan?: number
        }
        Relationships: []
      }
      donasi_riwayat: {
        Row: {
          id: string
          jenis: string
          judul: string
          keterangan: string | null
          nominal: number
          program_id: string
          tanggal: string | null
          urutan: number
        }
        Insert: {
          id: string
          jenis?: string
          judul: string
          keterangan?: string | null
          nominal?: number
          program_id: string
          tanggal?: string | null
          urutan?: number
        }
        Update: {
          id?: string
          jenis?: string
          judul?: string
          keterangan?: string | null
          nominal?: number
          program_id?: string
          tanggal?: string | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "donasi_riwayat_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "donasi_program"
            referencedColumns: ["id"]
          },
        ]
      }
      donatur: {
        Row: {
          aktif: boolean
          catatan: string | null
          dibuat: string
          diperbarui: string
          id: string
          jumlah_donasi: number
          jumlah_total: number
          nama: string
          program_terakhir: string | null
          telepon: string | null
        }
        Insert: {
          aktif?: boolean
          catatan?: string | null
          dibuat?: string
          diperbarui?: string
          id: string
          jumlah_donasi?: number
          jumlah_total?: number
          nama: string
          program_terakhir?: string | null
          telepon?: string | null
        }
        Update: {
          aktif?: boolean
          catatan?: string | null
          dibuat?: string
          diperbarui?: string
          id?: string
          jumlah_donasi?: number
          jumlah_total?: number
          nama?: string
          program_terakhir?: string | null
          telepon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donatur_program_terakhir_fkey"
            columns: ["program_terakhir"]
            isOneToOne: false
            referencedRelation: "donasi_program"
            referencedColumns: ["id"]
          },
        ]
      }
      galeri_album: {
        Row: {
          aktif: boolean
          diperbarui: string
          gambar_url: string | null
          id: string
          keterangan: string | null
          media_id: string | null
          nama: string
          slug: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          diperbarui?: string
          gambar_url?: string | null
          id: string
          keterangan?: string | null
          media_id?: string | null
          nama: string
          slug: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          diperbarui?: string
          gambar_url?: string | null
          id?: string
          keterangan?: string | null
          media_id?: string | null
          nama?: string
          slug?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "galeri_album_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      galeri_foto: {
        Row: {
          aktif: boolean
          album_id: string | null
          diperbarui: string
          gambar_url: string | null
          id: string
          judul: string
          media_id: string | null
          tanggal: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          album_id?: string | null
          diperbarui?: string
          gambar_url?: string | null
          id: string
          judul: string
          media_id?: string | null
          tanggal?: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          album_id?: string | null
          diperbarui?: string
          gambar_url?: string | null
          id?: string
          judul?: string
          media_id?: string | null
          tanggal?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "galeri_foto_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "galeri_album"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "galeri_foto_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      halaman: {
        Row: {
          aktif: boolean
          dibuat: string
          diperbarui: string
          id: string
          isi: Json
          judul: string
          ringkasan: string | null
          slug: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          id: string
          isi?: Json
          judul: string
          ringkasan?: string | null
          slug: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          id?: string
          isi?: Json
          judul?: string
          ringkasan?: string | null
          slug?: string
          urutan?: number
        }
        Relationships: []
      }
      hero_slide: {
        Row: {
          aktif: boolean
          dibuat: string
          diperbarui: string
          gambar_url: string | null
          id: string
          judul: string
          media_id: string | null
          tag: string | null
          teks: string | null
          tombol_halaman: string | null
          tombol_label: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          gambar_url?: string | null
          id: string
          judul: string
          media_id?: string | null
          tag?: string | null
          teks?: string | null
          tombol_halaman?: string | null
          tombol_label?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          gambar_url?: string | null
          id?: string
          judul?: string
          media_id?: string | null
          tag?: string | null
          teks?: string | null
          tombol_halaman?: string | null
          tombol_label?: string | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "hero_slide_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      iklan: {
        Row: {
          aktif: boolean
          dibuat: string
          diperbarui: string
          gambar_url: string | null
          id: string
          judul: string
          label: string
          media_id: string | null
          tautan: string | null
          teks: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          gambar_url?: string | null
          id: string
          judul: string
          label?: string
          media_id?: string | null
          tautan?: string | null
          teks?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          gambar_url?: string | null
          id?: string
          judul?: string
          label?: string
          media_id?: string | null
          tautan?: string | null
          teks?: string | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "iklan_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      jenjang: {
        Row: {
          aktif: boolean
          diperbarui: string
          fasilitas: Json
          gambar_url: string | null
          hitung_jenjang: boolean
          id: string
          intro: string | null
          istilah: Json
          jumlah: string | null
          lokasi: string | null
          media_id: string | null
          nama: string
          pimpinan_label: string | null
          rentang: string | null
          satuan: string | null
          singkatan: string | null
          slug: string
          tagline: string | null
          tone: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          diperbarui?: string
          fasilitas?: Json
          gambar_url?: string | null
          hitung_jenjang?: boolean
          id: string
          intro?: string | null
          istilah?: Json
          jumlah?: string | null
          lokasi?: string | null
          media_id?: string | null
          nama: string
          pimpinan_label?: string | null
          rentang?: string | null
          satuan?: string | null
          singkatan?: string | null
          slug: string
          tagline?: string | null
          tone?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          diperbarui?: string
          fasilitas?: Json
          gambar_url?: string | null
          hitung_jenjang?: boolean
          id?: string
          intro?: string | null
          istilah?: Json
          jumlah?: string | null
          lokasi?: string | null
          media_id?: string | null
          nama?: string
          pimpinan_label?: string | null
          rentang?: string | null
          satuan?: string | null
          singkatan?: string | null
          slug?: string
          tagline?: string | null
          tone?: string | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "jenjang_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      jurusan: {
        Row: {
          aktif: boolean
          diperbarui: string
          fokus: Json
          gambar_url: string | null
          id: string
          intro: string | null
          jenjang_id: string
          keterangan: string | null
          nama: string
          singkatan: string | null
          slug: string
          ukt: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          diperbarui?: string
          fokus?: Json
          gambar_url?: string | null
          id: string
          intro?: string | null
          jenjang_id: string
          keterangan?: string | null
          nama: string
          singkatan?: string | null
          slug: string
          ukt?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          diperbarui?: string
          fokus?: Json
          gambar_url?: string | null
          id?: string
          intro?: string | null
          jenjang_id?: string
          keterangan?: string | null
          nama?: string
          singkatan?: string | null
          slug?: string
          ukt?: string | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "jurusan_jenjang_id_fkey"
            columns: ["jenjang_id"]
            isOneToOne: false
            referencedRelation: "jenjang"
            referencedColumns: ["id"]
          },
        ]
      }
      kajian: {
        Row: {
          dibuat: string
          diperbarui: string
          hari: string | null
          id: string
          judul: string
          kategori: string | null
          kitab: string | null
          langsung: boolean
          media_id: string | null
          ringkasan: string | null
          tanggal: string | null
          tempat: string | null
          terbit: boolean
          ustadz: string | null
          waktu: string | null
        }
        Insert: {
          dibuat?: string
          diperbarui?: string
          hari?: string | null
          id: string
          judul: string
          kategori?: string | null
          kitab?: string | null
          langsung?: boolean
          media_id?: string | null
          ringkasan?: string | null
          tanggal?: string | null
          tempat?: string | null
          terbit?: boolean
          ustadz?: string | null
          waktu?: string | null
        }
        Update: {
          dibuat?: string
          diperbarui?: string
          hari?: string | null
          id?: string
          judul?: string
          kategori?: string | null
          kitab?: string | null
          langsung?: boolean
          media_id?: string | null
          ringkasan?: string | null
          tanggal?: string | null
          tempat?: string | null
          terbit?: boolean
          ustadz?: string | null
          waktu?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kajian_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      kajian_rutin: {
        Row: {
          aktif: boolean
          diperbarui: string
          hari: string
          id: string
          judul: string
          peserta: string | null
          tempat: string | null
          urutan: number
          ustadz: string | null
          waktu: string | null
        }
        Insert: {
          aktif?: boolean
          diperbarui?: string
          hari: string
          id: string
          judul: string
          peserta?: string | null
          tempat?: string | null
          urutan?: number
          ustadz?: string | null
          waktu?: string | null
        }
        Update: {
          aktif?: boolean
          diperbarui?: string
          hari?: string
          id?: string
          judul?: string
          peserta?: string | null
          tempat?: string | null
          urutan?: number
          ustadz?: string | null
          waktu?: string | null
        }
        Relationships: []
      }
      kategori: {
        Row: {
          aktif: boolean
          id: string
          jenis: string
          nama: string
          slug: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          id: string
          jenis: string
          nama: string
          slug: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          id?: string
          jenis?: string
          nama?: string
          slug?: string
          urutan?: number
        }
        Relationships: []
      }
      kategori_tagihan: {
        Row: {
          aktif: boolean
          dibuat: string
          diperbarui: string
          id: string
          jatuh_tempo_hari: number | null
          keterangan: string | null
          nama: string
          nominal: number
          tipe: string
          unit_id: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          id: string
          jatuh_tempo_hari?: number | null
          keterangan?: string | null
          nama: string
          nominal?: number
          tipe?: string
          unit_id: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          id?: string
          jatuh_tempo_hari?: number | null
          keterangan?: string | null
          nama?: string
          nominal?: number
          tipe?: string
          unit_id?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "kategori_tagihan_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unit_pendidikan"
            referencedColumns: ["id"]
          },
        ]
      }
      kontak_unit: {
        Row: {
          aktif: boolean
          id: string
          jam: string | null
          keterangan: string | null
          nama: string
          telepon: string | null
          urutan: number
          whatsapp: string | null
        }
        Insert: {
          aktif?: boolean
          id: string
          jam?: string | null
          keterangan?: string | null
          nama: string
          telepon?: string | null
          urutan?: number
          whatsapp?: string | null
        }
        Update: {
          aktif?: boolean
          id?: string
          jam?: string | null
          keterangan?: string | null
          nama?: string
          telepon?: string | null
          urutan?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      mata_pelajaran: {
        Row: {
          aktif: boolean
          id: string
          jenjang_id: string | null
          kelompok: string | null
          kode: string | null
          nama: string
        }
        Insert: {
          aktif?: boolean
          id: string
          jenjang_id?: string | null
          kelompok?: string | null
          kode?: string | null
          nama: string
        }
        Update: {
          aktif?: boolean
          id?: string
          jenjang_id?: string | null
          kelompok?: string | null
          kode?: string | null
          nama?: string
        }
        Relationships: [
          {
            foreignKeyName: "mata_pelajaran_jenjang_id_fkey"
            columns: ["jenjang_id"]
            isOneToOne: false
            referencedRelation: "jenjang"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt: string | null
          dibuat: string
          diperbarui: string
          folder: string
          id: string
          keterangan: string | null
          kunci: string
          lebar: number | null
          nama_asli: string | null
          pengunggah_id: string | null
          tinggi: number | null
          tipe: string | null
          ukuran: number | null
          url: string
        }
        Insert: {
          alt?: string | null
          dibuat?: string
          diperbarui?: string
          folder?: string
          id: string
          keterangan?: string | null
          kunci: string
          lebar?: number | null
          nama_asli?: string | null
          pengunggah_id?: string | null
          tinggi?: number | null
          tipe?: string | null
          ukuran?: number | null
          url: string
        }
        Update: {
          alt?: string | null
          dibuat?: string
          diperbarui?: string
          folder?: string
          id?: string
          keterangan?: string | null
          kunci?: string
          lebar?: number | null
          nama_asli?: string | null
          pengunggah_id?: string | null
          tinggi?: number | null
          tipe?: string | null
          ukuran?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_media_pengunggah"
            columns: ["pengunggah_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_cepat: {
        Row: {
          aktif: boolean
          diperbarui: string
          halaman: string
          id: string
          ikon: string | null
          keterangan: string | null
          label: string
          lencana: string | null
          tone: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          diperbarui?: string
          halaman: string
          id: string
          ikon?: string | null
          keterangan?: string | null
          label: string
          lencana?: string | null
          tone?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          diperbarui?: string
          halaman?: string
          id?: string
          ikon?: string | null
          keterangan?: string | null
          label?: string
          lencana?: string | null
          tone?: string | null
          urutan?: number
        }
        Relationships: []
      }
      metode_pembayaran: {
        Row: {
          aktif: boolean
          atas_nama: string | null
          bank: string | null
          diperbarui: string
          gambar_url: string | null
          id: string
          keterangan: string | null
          langkah: Json
          media_id: string | null
          nama: string
          nomor: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          atas_nama?: string | null
          bank?: string | null
          diperbarui?: string
          gambar_url?: string | null
          id: string
          keterangan?: string | null
          langkah?: Json
          media_id?: string | null
          nama: string
          nomor?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          atas_nama?: string | null
          bank?: string | null
          diperbarui?: string
          gambar_url?: string | null
          id?: string
          keterangan?: string | null
          langkah?: Json
          media_id?: string | null
          nama?: string
          nomor?: string | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "metode_pembayaran_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      nilai: {
        Row: {
          catatan: string | null
          dinilai_oleh: string | null
          diperbarui: string
          id: number
          mapel_id: string
          nilai: number
          predikat: string | null
          santri_id: string
          semester: string | null
          tahun_ajaran_id: string | null
          terbit: boolean
          terbit_pada: string | null
        }
        Insert: {
          catatan?: string | null
          dinilai_oleh?: string | null
          diperbarui?: string
          id?: number
          mapel_id: string
          nilai: number
          predikat?: string | null
          santri_id: string
          semester?: string | null
          tahun_ajaran_id?: string | null
          terbit?: boolean
          terbit_pada?: string | null
        }
        Update: {
          catatan?: string | null
          dinilai_oleh?: string | null
          diperbarui?: string
          id?: number
          mapel_id?: string
          nilai?: number
          predikat?: string | null
          santri_id?: string
          semester?: string | null
          tahun_ajaran_id?: string | null
          terbit?: boolean
          terbit_pada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nilai_mapel_id_fkey"
            columns: ["mapel_id"]
            isOneToOne: false
            referencedRelation: "mata_pelajaran"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_tahun_ajaran_id_fkey"
            columns: ["tahun_ajaran_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      notifikasi: {
        Row: {
          dibuat: string
          diperbarui: string
          id: string
          jenis: string | null
          judul: string
          jumlah_gagal: number
          jumlah_terkirim: number
          media_id: string | null
          pengguna_id: string | null
          ringkasan: string | null
          sasaran: string
          sumber_id: string | null
          sumber_tabel: string | null
          tautan: string | null
          terbit: boolean
          terkirim_pada: string | null
        }
        Insert: {
          dibuat?: string
          diperbarui?: string
          id: string
          jenis?: string | null
          judul: string
          jumlah_gagal?: number
          jumlah_terkirim?: number
          media_id?: string | null
          pengguna_id?: string | null
          ringkasan?: string | null
          sasaran?: string
          sumber_id?: string | null
          sumber_tabel?: string | null
          tautan?: string | null
          terbit?: boolean
          terkirim_pada?: string | null
        }
        Update: {
          dibuat?: string
          diperbarui?: string
          id?: string
          jenis?: string | null
          judul?: string
          jumlah_gagal?: number
          jumlah_terkirim?: number
          media_id?: string | null
          pengguna_id?: string | null
          ringkasan?: string | null
          sasaran?: string
          sumber_id?: string | null
          sumber_tabel?: string | null
          tautan?: string | null
          terbit?: boolean
          terkirim_pada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifikasi_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifikasi_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      notifikasi_dibaca: {
        Row: {
          dibaca_pada: string
          id: number
          notifikasi_id: string
          pengguna_id: string
        }
        Insert: {
          dibaca_pada?: string
          id?: number
          notifikasi_id: string
          pengguna_id: string
        }
        Update: {
          dibaca_pada?: string
          id?: number
          notifikasi_id?: string
          pengguna_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifikasi_dibaca_notifikasi_id_fkey"
            columns: ["notifikasi_id"]
            isOneToOne: false
            referencedRelation: "notifikasi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifikasi_dibaca_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      pembayaran: {
        Row: {
          bukti_media_id: string | null
          catatan: string | null
          dibayar_pada: string | null
          dibuat: string
          diperbarui: string
          diverifikasi_oleh: string | null
          diverifikasi_pada: string | null
          id: number
          jumlah: number
          label: string | null
          metode: string | null
          metode_id: string | null
          santri_id: string
          status: string
          tagihan_id: string | null
        }
        Insert: {
          bukti_media_id?: string | null
          catatan?: string | null
          dibayar_pada?: string | null
          dibuat?: string
          diperbarui?: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          id?: number
          jumlah?: number
          label?: string | null
          metode?: string | null
          metode_id?: string | null
          santri_id: string
          status?: string
          tagihan_id?: string | null
        }
        Update: {
          bukti_media_id?: string | null
          catatan?: string | null
          dibayar_pada?: string | null
          dibuat?: string
          diperbarui?: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          id?: number
          jumlah?: number
          label?: string | null
          metode?: string | null
          metode_id?: string | null
          santri_id?: string
          status?: string
          tagihan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pembayaran_bukti_media_id_fkey"
            columns: ["bukti_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_diverifikasi_oleh_fkey"
            columns: ["diverifikasi_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_metode_id_fkey"
            columns: ["metode_id"]
            isOneToOne: false
            referencedRelation: "metode_pembayaran"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_tagihan_id_fkey"
            columns: ["tagihan_id"]
            isOneToOne: false
            referencedRelation: "tagihan"
            referencedColumns: ["id"]
          },
        ]
      }
      pengaturan: {
        Row: {
          diperbarui: string
          kelompok: string
          keterangan: string | null
          kunci: string
          nilai: Json
        }
        Insert: {
          diperbarui?: string
          kelompok?: string
          keterangan?: string | null
          kunci: string
          nilai?: Json
        }
        Update: {
          diperbarui?: string
          kelompok?: string
          keterangan?: string | null
          kunci?: string
          nilai?: Json
        }
        Relationships: []
      }
      pengguna: {
        Row: {
          aktif: boolean
          avatar_media_id: string | null
          dibuat: string
          diperbarui: string
          email: string | null
          id: string
          kata_sandi_hash: string | null
          nama: string
          nama_pengguna: string | null
          peran: string
          telepon: string | null
          terakhir_masuk: string | null
          unit_kerja: string | null
        }
        Insert: {
          aktif?: boolean
          avatar_media_id?: string | null
          dibuat?: string
          diperbarui?: string
          email?: string | null
          id: string
          kata_sandi_hash?: string | null
          nama: string
          nama_pengguna?: string | null
          peran?: string
          telepon?: string | null
          terakhir_masuk?: string | null
          unit_kerja?: string | null
        }
        Update: {
          aktif?: boolean
          avatar_media_id?: string | null
          dibuat?: string
          diperbarui?: string
          email?: string | null
          id?: string
          kata_sandi_hash?: string | null
          nama?: string
          nama_pengguna?: string | null
          peran?: string
          telepon?: string | null
          terakhir_masuk?: string | null
          unit_kerja?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pengguna_avatar"
            columns: ["avatar_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      pengumuman: {
        Row: {
          berlaku_sampai: string | null
          dibaca: number
          dibuat: string
          diperbarui: string
          disematkan: boolean
          id: string
          isi: Json
          judul: string
          kategori: string | null
          lampiran_media_id: string | null
          ringkasan: string | null
          tanggal: string
          terbit: boolean
        }
        Insert: {
          berlaku_sampai?: string | null
          dibaca?: number
          dibuat?: string
          diperbarui?: string
          disematkan?: boolean
          id: string
          isi?: Json
          judul: string
          kategori?: string | null
          lampiran_media_id?: string | null
          ringkasan?: string | null
          tanggal?: string
          terbit?: boolean
        }
        Update: {
          berlaku_sampai?: string | null
          dibaca?: number
          dibuat?: string
          diperbarui?: string
          disematkan?: boolean
          id?: string
          isi?: Json
          judul?: string
          kategori?: string | null
          lampiran_media_id?: string | null
          ringkasan?: string | null
          tanggal?: string
          terbit?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pengumuman_lampiran_media_id_fkey"
            columns: ["lampiran_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      pengurus: {
        Row: {
          aktif: boolean
          bidang: string | null
          diperbarui: string
          foto_media_id: string | null
          id: string
          jabatan: string
          nama: string
          periode: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          bidang?: string | null
          diperbarui?: string
          foto_media_id?: string | null
          id: string
          jabatan: string
          nama: string
          periode?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          bidang?: string | null
          diperbarui?: string
          foto_media_id?: string | null
          id?: string
          jabatan?: string
          nama?: string
          periode?: string | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "pengurus_foto_media_id_fkey"
            columns: ["foto_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      pesan_kontak: {
        Row: {
          catatan: string | null
          dibuat: string
          diperbarui: string
          ditangani_oleh: string | null
          email: string | null
          id: number
          nama: string
          pesan: string
          status: string
          telepon: string | null
          topik: string | null
        }
        Insert: {
          catatan?: string | null
          dibuat?: string
          diperbarui?: string
          ditangani_oleh?: string | null
          email?: string | null
          id?: number
          nama: string
          pesan: string
          status?: string
          telepon?: string | null
          topik?: string | null
        }
        Update: {
          catatan?: string | null
          dibuat?: string
          diperbarui?: string
          ditangani_oleh?: string | null
          email?: string | null
          id?: number
          nama?: string
          pesan?: string
          status?: string
          telepon?: string | null
          topik?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pesan_kontak_ditangani_oleh_fkey"
            columns: ["ditangani_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      profil: {
        Row: {
          diperbarui: string
          gambar_alt: string | null
          gambar_url: string | null
          id: string
          media_id: string | null
          misi: Json
          motto: string | null
          periode: string | null
          ringkasan: Json
          sejarah: Json
          visi: string | null
        }
        Insert: {
          diperbarui?: string
          gambar_alt?: string | null
          gambar_url?: string | null
          id?: string
          media_id?: string | null
          misi?: Json
          motto?: string | null
          periode?: string | null
          ringkasan?: Json
          sejarah?: Json
          visi?: string | null
        }
        Update: {
          diperbarui?: string
          gambar_alt?: string | null
          gambar_url?: string | null
          id?: string
          media_id?: string | null
          misi?: Json
          motto?: string | null
          periode?: string | null
          ringkasan?: Json
          sejarah?: Json
          visi?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profil_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      push_langganan: {
        Row: {
          auth: string
          dibuat: string
          diubah: string
          endpoint: string
          p256dh: string
          pengguna_id: string | null
          perangkat: string | null
          santri_id: string | null
        }
        Insert: {
          auth: string
          dibuat?: string
          diubah?: string
          endpoint: string
          p256dh: string
          pengguna_id?: string | null
          perangkat?: string | null
          santri_id?: string | null
        }
        Update: {
          auth?: string
          dibuat?: string
          diubah?: string
          endpoint?: string
          p256dh?: string
          pengguna_id?: string | null
          perangkat?: string | null
          santri_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_push_langganan_pengguna"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_langganan_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_langganan_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      push_pesan: {
        Row: {
          dibuat: string
          diproses: string | null
          gagal: number
          id: string
          isi: string | null
          jenis: string | null
          judul: string
          kunci: string | null
          santri_id: string | null
          tautan: string | null
          terkirim: number
        }
        Insert: {
          dibuat?: string
          diproses?: string | null
          gagal?: number
          id: string
          isi?: string | null
          jenis?: string | null
          judul: string
          kunci?: string | null
          santri_id?: string | null
          tautan?: string | null
          terkirim?: number
        }
        Update: {
          dibuat?: string
          diproses?: string | null
          gagal?: number
          id?: string
          isi?: string | null
          jenis?: string | null
          judul?: string
          kunci?: string | null
          santri_id?: string | null
          tautan?: string | null
          terkirim?: number
        }
        Relationships: [
          {
            foreignKeyName: "push_pesan_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      push_terkirim: {
        Row: {
          dikirim: string
          id: string
          jenis: string | null
          judul: string | null
        }
        Insert: {
          dikirim?: string
          id: string
          jenis?: string | null
          judul?: string | null
        }
        Update: {
          dikirim?: string
          id?: string
          jenis?: string | null
          judul?: string | null
        }
        Relationships: []
      }
      push_vapid: {
        Row: {
          dibuat: string
          id: number
          privat: string
          publik: string
        }
        Insert: {
          dibuat?: string
          id?: number
          privat: string
          publik: string
        }
        Update: {
          dibuat?: string
          id?: number
          privat?: string
          publik?: string
        }
        Relationships: []
      }
      santri: {
        Row: {
          alamat: string | null
          asal_sekolah: string | null
          catatan: string | null
          dibuat: string
          diperbarui: string
          email: string | null
          foto_media_id: string | null
          id: string
          jenis_kelamin: string | null
          jenjang_id: string | null
          kelas: string | null
          nama: string
          nis: string | null
          nisn: string | null
          pendaftar_id: number | null
          pin_wali: string | null
          program: string | null
          status: string
          tahun_masuk: number | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          unit_id: string | null
          wali_nama: string | null
          wali_pengguna_id: string | null
          wali_telepon: string | null
        }
        Insert: {
          alamat?: string | null
          asal_sekolah?: string | null
          catatan?: string | null
          dibuat?: string
          diperbarui?: string
          email?: string | null
          foto_media_id?: string | null
          id: string
          jenis_kelamin?: string | null
          jenjang_id?: string | null
          kelas?: string | null
          nama: string
          nis?: string | null
          nisn?: string | null
          pendaftar_id?: number | null
          pin_wali?: string | null
          program?: string | null
          status?: string
          tahun_masuk?: number | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          unit_id?: string | null
          wali_nama?: string | null
          wali_pengguna_id?: string | null
          wali_telepon?: string | null
        }
        Update: {
          alamat?: string | null
          asal_sekolah?: string | null
          catatan?: string | null
          dibuat?: string
          diperbarui?: string
          email?: string | null
          foto_media_id?: string | null
          id?: string
          jenis_kelamin?: string | null
          jenjang_id?: string | null
          kelas?: string | null
          nama?: string
          nis?: string | null
          nisn?: string | null
          pendaftar_id?: number | null
          pin_wali?: string | null
          program?: string | null
          status?: string
          tahun_masuk?: number | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          unit_id?: string | null
          wali_nama?: string | null
          wali_pengguna_id?: string | null
          wali_telepon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "santri_foto_media_id_fkey"
            columns: ["foto_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "santri_jenjang_id_fkey"
            columns: ["jenjang_id"]
            isOneToOne: false
            referencedRelation: "jenjang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "santri_pendaftar_id_fkey"
            columns: ["pendaftar_id"]
            isOneToOne: false
            referencedRelation: "spmb_pendaftar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "santri_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unit_pendidikan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "santri_wali_pengguna_id_fkey"
            columns: ["wali_pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      sesi: {
        Row: {
          agen: string | null
          alamat_ip: string | null
          dibuat: string
          kedaluwarsa: string
          pengguna_id: string
          token: string
        }
        Insert: {
          agen?: string | null
          alamat_ip?: string | null
          dibuat?: string
          kedaluwarsa: string
          pengguna_id: string
          token: string
        }
        Update: {
          agen?: string | null
          alamat_ip?: string | null
          dibuat?: string
          kedaluwarsa?: string
          pengguna_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesi_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      sesi_unit: {
        Row: {
          dibuat: string
          kedaluwarsa: string
          kode: string
          token: string
          unit_id: string | null
        }
        Insert: {
          dibuat?: string
          kedaluwarsa: string
          kode: string
          token: string
          unit_id?: string | null
        }
        Update: {
          dibuat?: string
          kedaluwarsa?: string
          kode?: string
          token?: string
          unit_id?: string | null
        }
        Relationships: []
      }
      sesi_wali: {
        Row: {
          dibuat: string
          kedaluwarsa: string
          santri_id: string
          token: string
        }
        Insert: {
          dibuat?: string
          kedaluwarsa: string
          santri_id: string
          token: string
        }
        Update: {
          dibuat?: string
          kedaluwarsa?: string
          santri_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesi_wali_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      setoran_tahfidz: {
        Row: {
          ayat_mulai: number | null
          ayat_selesai: number | null
          catatan: string | null
          diperbarui: string
          id: string
          jenis: string | null
          juz: number | null
          materi: string
          nilai: string | null
          penilai: string | null
          santri_id: string
          surah: number | null
          tanggal: string
          terbit: boolean
          terbit_pada: string | null
        }
        Insert: {
          ayat_mulai?: number | null
          ayat_selesai?: number | null
          catatan?: string | null
          diperbarui?: string
          id: string
          jenis?: string | null
          juz?: number | null
          materi: string
          nilai?: string | null
          penilai?: string | null
          santri_id: string
          surah?: number | null
          tanggal?: string
          terbit?: boolean
          terbit_pada?: string | null
        }
        Update: {
          ayat_mulai?: number | null
          ayat_selesai?: number | null
          catatan?: string | null
          diperbarui?: string
          id?: string
          jenis?: string | null
          juz?: number | null
          materi?: string
          nilai?: string | null
          penilai?: string | null
          santri_id?: string
          surah?: number | null
          tanggal?: string
          terbit?: boolean
          terbit_pada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "setoran_tahfidz_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      situs: {
        Row: {
          alamat: string | null
          dibuat: string
          diperbarui: string
          email: string | null
          favicon_url: string | null
          id: string
          jam_layanan: string | null
          logo_media_id: string | null
          logo_url: string | null
          meta_deskripsi: string | null
          meta_judul: string | null
          nama: string
          nama_lengkap: string
          og_gambar_media_id: string | null
          pimpinan: string
          singkatan: string
          telepon: string | null
          whatsapp: string | null
          wilayah: string | null
          wilayah_lengkap: string | null
        }
        Insert: {
          alamat?: string | null
          dibuat?: string
          diperbarui?: string
          email?: string | null
          favicon_url?: string | null
          id?: string
          jam_layanan?: string | null
          logo_media_id?: string | null
          logo_url?: string | null
          meta_deskripsi?: string | null
          meta_judul?: string | null
          nama?: string
          nama_lengkap?: string
          og_gambar_media_id?: string | null
          pimpinan?: string
          singkatan?: string
          telepon?: string | null
          whatsapp?: string | null
          wilayah?: string | null
          wilayah_lengkap?: string | null
        }
        Update: {
          alamat?: string | null
          dibuat?: string
          diperbarui?: string
          email?: string | null
          favicon_url?: string | null
          id?: string
          jam_layanan?: string | null
          logo_media_id?: string | null
          logo_url?: string | null
          meta_deskripsi?: string | null
          meta_judul?: string | null
          nama?: string
          nama_lengkap?: string
          og_gambar_media_id?: string | null
          pimpinan?: string
          singkatan?: string
          telepon?: string | null
          whatsapp?: string | null
          wilayah?: string | null
          wilayah_lengkap?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "situs_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situs_og_gambar_media_id_fkey"
            columns: ["og_gambar_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      spmb_biaya: {
        Row: {
          aktif: boolean
          id: string
          label: string
          nilai: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          id: string
          label: string
          nilai?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          id?: string
          label?: string
          nilai?: string | null
          urutan?: number
        }
        Relationships: []
      }
      spmb_gelombang: {
        Row: {
          aktif: boolean
          id: string
          kuota: string | null
          mulai: string | null
          nama: string
          periode: string | null
          selesai: string | null
          sisa: string | null
          status: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          id: string
          kuota?: string | null
          mulai?: string | null
          nama: string
          periode?: string | null
          selesai?: string | null
          sisa?: string | null
          status?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          id?: string
          kuota?: string | null
          mulai?: string | null
          nama?: string
          periode?: string | null
          selesai?: string | null
          sisa?: string | null
          status?: string | null
          urutan?: number
        }
        Relationships: []
      }
      spmb_info: {
        Row: {
          catatan: string | null
          diperbarui: string
          form_aktif: boolean
          id: string
          judul: string
          pengantar: string | null
          wa_admin: string | null
        }
        Insert: {
          catatan?: string | null
          diperbarui?: string
          form_aktif?: boolean
          id?: string
          judul?: string
          pengantar?: string | null
          wa_admin?: string | null
        }
        Update: {
          catatan?: string | null
          diperbarui?: string
          form_aktif?: boolean
          id?: string
          judul?: string
          pengantar?: string | null
          wa_admin?: string | null
        }
        Relationships: []
      }
      spmb_pendaftar: {
        Row: {
          alamat: string | null
          asal_sekolah: string | null
          berkas: Json
          catatan: string | null
          dibuat: string
          diperbarui: string
          email: string | null
          gelombang_id: string | null
          id: number
          jenis_kelamin: string | null
          jenjang_id: string | null
          nama: string
          nama_wali: string | null
          nomor: string | null
          program: string | null
          status: string
          tanggal_lahir: string | null
          telepon: string | null
          tempat_lahir: string | null
          unit_id: string | null
        }
        Insert: {
          alamat?: string | null
          asal_sekolah?: string | null
          berkas?: Json
          catatan?: string | null
          dibuat?: string
          diperbarui?: string
          email?: string | null
          gelombang_id?: string | null
          id?: number
          jenis_kelamin?: string | null
          jenjang_id?: string | null
          nama: string
          nama_wali?: string | null
          nomor?: string | null
          program?: string | null
          status?: string
          tanggal_lahir?: string | null
          telepon?: string | null
          tempat_lahir?: string | null
          unit_id?: string | null
        }
        Update: {
          alamat?: string | null
          asal_sekolah?: string | null
          berkas?: Json
          catatan?: string | null
          dibuat?: string
          diperbarui?: string
          email?: string | null
          gelombang_id?: string | null
          id?: number
          jenis_kelamin?: string | null
          jenjang_id?: string | null
          nama?: string
          nama_wali?: string | null
          nomor?: string | null
          program?: string | null
          status?: string
          tanggal_lahir?: string | null
          telepon?: string | null
          tempat_lahir?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spmb_pendaftar_gelombang_id_fkey"
            columns: ["gelombang_id"]
            isOneToOne: false
            referencedRelation: "spmb_gelombang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spmb_pendaftar_jenjang_id_fkey"
            columns: ["jenjang_id"]
            isOneToOne: false
            referencedRelation: "jenjang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spmb_pendaftar_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unit_pendidikan"
            referencedColumns: ["id"]
          },
        ]
      }
      spmb_persyaratan: {
        Row: {
          aktif: boolean
          id: string
          jenjang_id: string | null
          teks: string
          urutan: number
          wajib: boolean
        }
        Insert: {
          aktif?: boolean
          id: string
          jenjang_id?: string | null
          teks: string
          urutan?: number
          wajib?: boolean
        }
        Update: {
          aktif?: boolean
          id?: string
          jenjang_id?: string | null
          teks?: string
          urutan?: number
          wajib?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "spmb_persyaratan_jenjang_id_fkey"
            columns: ["jenjang_id"]
            isOneToOne: false
            referencedRelation: "jenjang"
            referencedColumns: ["id"]
          },
        ]
      }
      spmb_tahapan: {
        Row: {
          aktif: boolean
          id: string
          keterangan: string | null
          media_id: string | null
          nama: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          id: string
          keterangan?: string | null
          media_id?: string | null
          nama: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          id?: string
          keterangan?: string | null
          media_id?: string | null
          nama?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "spmb_tahapan_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      statistik: {
        Row: {
          aktif: boolean
          catatan: string | null
          diperbarui: string
          id: string
          ikon: string | null
          label: string
          label_pendek: string | null
          nilai: string
          satuan: string | null
          sumber: string | null
          tone: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          catatan?: string | null
          diperbarui?: string
          id: string
          ikon?: string | null
          label: string
          label_pendek?: string | null
          nilai: string
          satuan?: string | null
          sumber?: string | null
          tone?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          catatan?: string | null
          diperbarui?: string
          id?: string
          ikon?: string | null
          label?: string
          label_pendek?: string | null
          nilai?: string
          satuan?: string | null
          sumber?: string | null
          tone?: string | null
          urutan?: number
        }
        Relationships: []
      }
      tagihan: {
        Row: {
          dibuat: string
          diperbarui: string
          id: string
          jatuh_tempo: string | null
          jenis: string | null
          jumlah: number
          kategori_id: string | null
          keterangan: string | null
          label: string
          periode: string | null
          santri_id: string
          status: string
          tahun_ajaran_id: string | null
        }
        Insert: {
          dibuat?: string
          diperbarui?: string
          id: string
          jatuh_tempo?: string | null
          jenis?: string | null
          jumlah?: number
          kategori_id?: string | null
          keterangan?: string | null
          label: string
          periode?: string | null
          santri_id: string
          status?: string
          tahun_ajaran_id?: string | null
        }
        Update: {
          dibuat?: string
          diperbarui?: string
          id?: string
          jatuh_tempo?: string | null
          jenis?: string | null
          jumlah?: number
          kategori_id?: string | null
          keterangan?: string | null
          label?: string
          periode?: string | null
          santri_id?: string
          status?: string
          tahun_ajaran_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tagihan_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "kategori_tagihan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tagihan_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tagihan_tahun_ajaran_id_fkey"
            columns: ["tahun_ajaran_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      tahfidz_target: {
        Row: {
          capaian: string | null
          diperbarui: string
          id: string
          jadwal: string | null
          pembimbing: string | null
          persen: number
          santri_id: string
          target: string | null
          target_juz: number | null
          tempat: string | null
          terbit: boolean
          terbit_pada: string | null
        }
        Insert: {
          capaian?: string | null
          diperbarui?: string
          id: string
          jadwal?: string | null
          pembimbing?: string | null
          persen?: number
          santri_id: string
          target?: string | null
          target_juz?: number | null
          tempat?: string | null
          terbit?: boolean
          terbit_pada?: string | null
        }
        Update: {
          capaian?: string | null
          diperbarui?: string
          id?: string
          jadwal?: string | null
          pembimbing?: string | null
          persen?: number
          santri_id?: string
          target?: string | null
          target_juz?: number | null
          tempat?: string | null
          terbit?: boolean
          terbit_pada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tahfidz_target_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: true
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      tahun_ajaran: {
        Row: {
          aktif: boolean
          dibuat: string
          diperbarui: string
          id: string
          mulai: string | null
          nama: string
          selesai: string | null
          semester: string | null
        }
        Insert: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          id: string
          mulai?: string | null
          nama: string
          selesai?: string | null
          semester?: string | null
        }
        Update: {
          aktif?: boolean
          dibuat?: string
          diperbarui?: string
          id?: string
          mulai?: string | null
          nama?: string
          selesai?: string | null
          semester?: string | null
        }
        Relationships: []
      }
      tautan_sosial: {
        Row: {
          aktif: boolean
          id: string
          ikon: string | null
          nama: string
          url: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          id: string
          ikon?: string | null
          nama: string
          url: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          id?: string
          ikon?: string | null
          nama?: string
          url?: string
          urutan?: number
        }
        Relationships: []
      }
      topik_kontak: {
        Row: {
          aktif: boolean
          id: string
          teks: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          id: string
          teks: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          id?: string
          teks?: string
          urutan?: number
        }
        Relationships: []
      }
      unit_pendidikan: {
        Row: {
          akreditasi: string | null
          aktif: boolean
          alamat: string | null
          berdiri: number | null
          daerah: string | null
          diperbarui: string
          ekstrakurikuler: Json
          email: string | null
          fasilitas: Json
          gambar_url: string | null
          guru: number | null
          id: string
          jam: string | null
          jenjang_id: string
          jumlah_peserta: number | null
          jurusan: Json
          kontak: string | null
          media_id: string | null
          nama: string
          nomor: string | null
          npsn: string | null
          pimpinan: string | null
          rombel: number | null
          slug: string
          staf: number | null
          status: string | null
        }
        Insert: {
          akreditasi?: string | null
          aktif?: boolean
          alamat?: string | null
          berdiri?: number | null
          daerah?: string | null
          diperbarui?: string
          ekstrakurikuler?: Json
          email?: string | null
          fasilitas?: Json
          gambar_url?: string | null
          guru?: number | null
          id: string
          jam?: string | null
          jenjang_id: string
          jumlah_peserta?: number | null
          jurusan?: Json
          kontak?: string | null
          media_id?: string | null
          nama: string
          nomor?: string | null
          npsn?: string | null
          pimpinan?: string | null
          rombel?: number | null
          slug: string
          staf?: number | null
          status?: string | null
        }
        Update: {
          akreditasi?: string | null
          aktif?: boolean
          alamat?: string | null
          berdiri?: number | null
          daerah?: string | null
          diperbarui?: string
          ekstrakurikuler?: Json
          email?: string | null
          fasilitas?: Json
          gambar_url?: string | null
          guru?: number | null
          id?: string
          jam?: string | null
          jenjang_id?: string
          jumlah_peserta?: number | null
          jurusan?: Json
          kontak?: string | null
          media_id?: string | null
          nama?: string
          nomor?: string | null
          npsn?: string | null
          pimpinan?: string | null
          rombel?: number | null
          slug?: string
          staf?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_pendidikan_jenjang_id_fkey"
            columns: ["jenjang_id"]
            isOneToOne: false
            referencedRelation: "jenjang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_pendidikan_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_agenda_terdekat: {
        Row: {
          id: string | null
          judul: string | null
          tag: string | null
          tanggal: string | null
          tempat: string | null
          waktu: string | null
        }
        Insert: {
          id?: string | null
          judul?: string | null
          tag?: string | null
          tanggal?: string | null
          tempat?: string | null
          waktu?: string | null
        }
        Update: {
          id?: string | null
          judul?: string | null
          tag?: string | null
          tanggal?: string | null
          tempat?: string | null
          waktu?: string | null
        }
        Relationships: []
      }
      v_berita_trending: {
        Row: {
          dibaca: number | null
          gambar_url: string | null
          id: string | null
          judul: string | null
          kategori: string | null
          penulis: string | null
          ringkasan: string | null
          slug: string | null
          tanggal: string | null
        }
        Insert: {
          dibaca?: number | null
          gambar_url?: string | null
          id?: string | null
          judul?: string | null
          kategori?: string | null
          penulis?: string | null
          ringkasan?: string | null
          slug?: string | null
          tanggal?: string | null
        }
        Update: {
          dibaca?: number | null
          gambar_url?: string | null
          id?: string | null
          judul?: string | null
          kategori?: string | null
          penulis?: string | null
          ringkasan?: string | null
          slug?: string | null
          tanggal?: string | null
        }
        Relationships: []
      }
      v_konten_terbaru: {
        Row: {
          id: string | null
          jenis: string | null
          judul: string | null
          ringkasan: string | null
          tanggal: string | null
          tautan: string | null
        }
        Relationships: []
      }
      v_pengumuman_terbaru: {
        Row: {
          dibaca: number | null
          disematkan: boolean | null
          id: string | null
          judul: string | null
          kategori: string | null
          ringkasan: string | null
          tanggal: string | null
        }
        Insert: {
          dibaca?: number | null
          disematkan?: boolean | null
          id?: string | null
          judul?: string | null
          kategori?: string | null
          ringkasan?: string | null
          tanggal?: string | null
        }
        Update: {
          dibaca?: number | null
          disematkan?: boolean | null
          id?: string | null
          judul?: string | null
          kategori?: string | null
          ringkasan?: string | null
          tanggal?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      jalankan_sql: { Args: { q: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
