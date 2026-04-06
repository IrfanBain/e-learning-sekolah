"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { TeacherFormData, createTeacherAction } from '@/app/actions/teacherActions';
import { FiArrowLeft } from 'react-icons/fi';

const initialState: TeacherFormData = {
  nama_lengkap: '',
  nip_nuptk: '',
  email: '', 
  jenis_kelamin: 'L',
  tempat_lahir: '',
  tanggal_lahir: '',
  agama: 'Islam',
  nomor_hp: '',
  status_kepegawaian: 'pns',
  pendidikan_terakhir: 's1', 
  almamater: '',
  jurusan_pendidikan: '',
  tanggal_mulai_kerja: '',
  mata_pelajaran_diampu: '', 
  peran: 'Guru', 
  wali_kelas_ref: '',
  alamat_jalan: '',
  alamat_rt_rw: '',
  alamat_kelurahan_desa: '', 
  alamat_kecamatan: '',
  alamat_kota_kabupaten: '',
  alamat_provinsi: '',
  alamat_kode_pos: '',
};

export default function CreateTeacherPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<TeacherFormData>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama_lengkap || !formData.nip_nuptk) {
      setError("Nama Lengkap dan NIP/NUPTK wajib diisi.");
      toast.error("Nama Lengkap dan NIP/NUPTK wajib diisi.");
      return;
    }
     if (formData.nip_nuptk.length < 6) {
        setError("NIP/NUPTK harus minimal 6 karakter untuk dijadikan password awal.");
        toast.error("NIP/NUPTK harus minimal 6 karakter.");
        return;
    }


    setLoading(true);
    setError(null);

    const result = await createTeacherAction(formData);

    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      router.push('/list/teachers');
      router.refresh(); 
    } else {
      setError(result.message);
      toast.error(`Gagal: ${result.message}`); 
    }
  };

  const handleBatal = () => {
    if (loading) return;
    router.push('/list/teachers'); 
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
       <button
        onClick={handleBatal}
        disabled={loading}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 self-start"
      >
        <FiArrowLeft /> Kembali ke Daftar Guru
      </button>

      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto border border-gray-200">

        <div className="border-b p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Tambah Guru Baru
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md border border-red-200">{error}</div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 text-gray-700">Informasi Akun & Profil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="nama_lengkap" label="Nama Lengkap (Wajib)" value={formData.nama_lengkap} onChange={handleChange} required />
              <Input name="nip_nuptk" label="NIP / NUPTK (Wajib, min. 6 char)" value={formData.nip_nuptk} onChange={handleChange} required />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                <div>
                    <label className="block text-xs font-medium text-gray-600">Username (Otomatis dari NIP/NUPTK)</label>
                    <input type="text" value={formData.nip_nuptk} readOnly className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"/>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600">Password Awal (Otomatis dari NIP/NUPTK)</label>
                    <input type="text" value={formData.nip_nuptk} readOnly className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <Input name="email" label="Email (Kontak)" value={formData.email} onChange={handleChange} type="email" placeholder="email@guru.com"/>
              <Select name="jenis_kelamin" label="Jenis Kelamin" value={formData.jenis_kelamin} onChange={handleChange} options={[{value: 'L', label: 'Laki-laki'}, {value: 'P', label: 'Perempuan'}]} />
              <Select name="agama" label="Agama" value={formData.agama} onChange={handleChange} options={[{value: 'Islam', label: 'Islam'}, {value: 'Kristen', label: 'Kristen'}, {value: 'Katolik', label: 'Katolik'}, {value: 'Hindu', label: 'Hindu'}, {value: 'Buddha', label: 'Buddha'}, {value: 'Konghucu', label: 'Konghucu'}]} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input name="tempat_lahir" label="Tempat Lahir" value={formData.tempat_lahir} onChange={handleChange} />
              <Input name="tanggal_lahir" label="Tanggal Lahir" value={formData.tanggal_lahir} onChange={handleChange} type="date" />
              <Input name="nomor_hp" label="Nomor HP" value={formData.nomor_hp} onChange={handleChange} type="tel"/>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 text-gray-700">Data Profesional & Mengajar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select name="status_kepegawaian" label="Status Kepegawaian" value={formData.status_kepegawaian} onChange={handleChange} options={[{value: 'pns', label: 'PNS'}, {value: 'pppk', label: 'PPPK'}, {value: 'honor', label: 'Honor/GTT'}, {value: 'lainnya', label: 'Lainnya'}]} />
              <Select name="pendidikan_terakhir" label="Pendidikan Terakhir" value={formData.pendidikan_terakhir} onChange={handleChange} options={[{value: 's1', label: 'S1'}, {value: 's2', label: 'S2'}, {value: 's3', label: 'S3'}, {value: 'd3', label: 'D3'}, {value: 'sma', label: 'SMA/Sederajat'}]} />
              <Input name="almamater" label="Almamater" value={formData.almamater} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input name="jurusan_pendidikan" label="Jurusan Pendidikan" value={formData.jurusan_pendidikan} onChange={handleChange} />
              <Input name="tanggal_mulai_kerja" label="Tgl. Mulai Kerja" value={formData.tanggal_mulai_kerja} onChange={handleChange} type="date" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <Input name="mata_pelajaran_diampu" label="Mata Pelajaran (Dipisah Koma)" value={formData.mata_pelajaran_diampu} onChange={handleChange} placeholder="Contoh: Mtk, Fisika, B.Indo" />
              </div>
              <div>
                <Input name="peran" label="Peran (Dipisah Koma)" value={formData.peran} onChange={handleChange} placeholder="Minimal 'Guru'. Contoh: Guru, Staf TU" required />
              </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 text-gray-700">Alamat Guru</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input name="alamat_jalan" label="Jalan/Dusun" value={formData.alamat_jalan} onChange={handleChange} />
                <Input name="alamat_rt_rw" label="RT/RW" value={formData.alamat_rt_rw} onChange={handleChange} placeholder="Contoh: 001/002"/>
                <Input name="alamat_kelurahan_desa" label="Kelurahan/Desa" value={formData.alamat_kelurahan_desa} onChange={handleChange} />
                <Input name="alamat_kecamatan" label="Kecamatan" value={formData.alamat_kecamatan} onChange={handleChange} />
                <Input name="alamat_kota_kabupaten" label="Kota/Kabupaten" value={formData.alamat_kota_kabupaten} onChange={handleChange} />
                <Input name="alamat_provinsi" label="Provinsi" value={formData.alamat_provinsi} onChange={handleChange} />
                <Input name="alamat_kode_pos" label="Kode Pos" value={formData.alamat_kode_pos} onChange={handleChange} type="number"/>
              </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t mt-6">
            <button type="button" onClick={handleBatal} disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 min-w-[120px] transition-colors">
              {loading ? 'Menyimpan...' : 'Simpan Guru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type InputProps = {
  label: string;
  name: string;
  value: string | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
}

const Input = ({ label, name, value, onChange, type = 'text', required = false, readOnly = false, placeholder = '' }: InputProps) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value || ''}
      onChange={onChange}
      required={required}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
    />
  </div>
);

type SelectProps = {
  label: string;
  name: string;
  value: string | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}

const Select = ({ label, name, value, onChange, options, required = false }: SelectProps) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      id={name}
      name={name}
      value={value || ''}
      onChange={onChange}
      required={required}
      className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

