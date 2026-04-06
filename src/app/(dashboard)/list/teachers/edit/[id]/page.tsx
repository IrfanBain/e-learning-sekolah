"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from "next/image";
import Link from "next/link"; 
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig'; 
import { format } from 'date-fns'; 
import { toast } from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi'; 
import { TeacherUpdateFormData, updateTeacherAction } from '@/app/actions/teacherActions'; 

interface TeacherDetailData {
  nama_lengkap: string;
  nip_nuptk: string;
  email: string | null;
  foto_profil: string | null;
  jenis_kelamin: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: Timestamp | null;
  agama: string | null;
  nomor_hp: string | null;
  status_kepegawaian: string | null;
  pendidikan_terakhir: string | null;
  almamater: string | null;
  jurusan_pendidikan: string | null;
  tanggal_mulai_kerja: Timestamp | null;
  mata_pelajaran_diampu: string[]; 
  peran: string[]; 
  wali_kelas_ref: string | null;
  alamat: {
    jalan?: string | null;
    rt_rw?: string | null;
    kelurahan_desa?: string | null;
    kecamatan?: string | null;
    kota_kabupaten?: string | null;
    provinsi?: string | null;
    kode_pos?: string | null;
  } | null;
}

const initialFormState: Omit<TeacherUpdateFormData, 'uid' | 'foto_profil'> = {
  nama_lengkap: '', nip_nuptk: '', email: '',
  jenis_kelamin: 'L', tempat_lahir: '', tanggal_lahir: '', agama: 'Islam', nomor_hp: '',
  status_kepegawaian: 'pns', pendidikan_terakhir: 's1', almamater: '', jurusan_pendidikan: '',
  tanggal_mulai_kerja: '', mata_pelajaran_diampu: '', peran: 'guru', wali_kelas_ref: '',
  alamat_jalan: '', alamat_rt_rw: '', alamat_kelurahan_desa: '', alamat_kecamatan: '',
  alamat_kota_kabupaten: '', alamat_provinsi: '', alamat_kode_pos: '',
};


export default function EditTeacherPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const [formData, setFormData] = useState(initialFormState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) return; 

    const fetchTeacherData = async () => {
      setPageLoading(true); setError(null);
      try {
        const docRef = doc(db, 'teachers', teacherId); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const teacher = docSnap.data() as TeacherDetailData; 
          const formatTimestampToInput = (ts: Timestamp | null | undefined): string => {
            if (!ts) return '';
            try { return ts.toDate().toISOString().split('T')[0]; }
            catch { return ''; }
          };

          const formatArrayToString = (arr: string[] | null | undefined): string => {
            if (!arr || arr.length === 0) return '';
            return arr.join(', '); 
          };

          setFormData({
            nama_lengkap: teacher.nama_lengkap || '',
            nip_nuptk: teacher.nip_nuptk || '',
            email: teacher.email || '',
            jenis_kelamin: teacher.jenis_kelamin || 'L',
            tempat_lahir: teacher.tempat_lahir || '',
            tanggal_lahir: formatTimestampToInput(teacher.tanggal_lahir),
            agama: teacher.agama || 'Islam',
            nomor_hp: teacher.nomor_hp || '',
            status_kepegawaian: teacher.status_kepegawaian || 'pns',
            pendidikan_terakhir: teacher.pendidikan_terakhir || 's1',
            almamater: teacher.almamater || '',
            jurusan_pendidikan: teacher.jurusan_pendidikan || '',
            tanggal_mulai_kerja: formatTimestampToInput(teacher.tanggal_mulai_kerja),
            mata_pelajaran_diampu: formatArrayToString(teacher.mata_pelajaran_diampu), 
            peran: formatArrayToString(teacher.peran), 
            wali_kelas_ref: teacher.wali_kelas_ref || '',
            alamat_jalan: teacher.alamat?.jalan || '',
            alamat_rt_rw: teacher.alamat?.rt_rw || '',
            alamat_kelurahan_desa: teacher.alamat?.kelurahan_desa || '',
            alamat_kecamatan: teacher.alamat?.kecamatan || '',
            alamat_kota_kabupaten: teacher.alamat?.kota_kabupaten || '',
            alamat_provinsi: teacher.alamat?.provinsi || '',
            alamat_kode_pos: teacher.alamat?.kode_pos || '',
          });

          setPreviewUrl(teacher.foto_profil || null);
          setCurrentPhotoUrl(teacher.foto_profil || null);

        } else {
          setError("Data guru tidak ditemukan.");
          toast.error("Data guru tidak ditemukan.");
        }
      } catch (err: any) {
        console.error("Error fetching teacher data: ", err);
        setError("Gagal mengambil data guru. Error: " + err.message);
        toast.error("Gagal mengambil data guru.");
      } finally {
        setPageLoading(false);
      }
    };
    fetchTeacherData();
  }, [teacherId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
          toast.error("Ukuran file terlalu besar. Maksimal 5MB.");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }
      setSelectedFile(file); 
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_lengkap || !formData.nip_nuptk) {
      setError("Nama Lengkap dan NIP/NUPTK wajib diisi.");
      toast.error("Nama Lengkap dan NIP/NUPTK wajib diisi.");
      return;
    }
     if (formData.nip_nuptk.length < 6) {
        setError("NIP/NUPTK harus minimal 6 karakter.");
        toast.error("NIP/NUPTK harus minimal 6 karakter.");
        return;
    }


    setLoading(true); 
    setError(null);

    let finalPhotoURL = currentPhotoUrl;

    if (selectedFile) {
      const toastId = toast.loading('Mempersiapkan unggah foto...');
      try {
        const fileExtension = selectedFile.name.split('.').pop() || 'jpg';

        const response = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: selectedFile.type,
            fileExtension: fileExtension,
            fileName: selectedFile.name,
            prefix: `user_photo`
          }),
        });

        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.error || 'Gagal mendapatkan URL upload dari server.');
        }
        const { uploadUrl, fileUrl } = await response.json() as { uploadUrl: string, fileUrl: string };
        toast.loading('Mengunggah foto...', { id: toastId });
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': selectedFile.type,
          },
        });

        if (!uploadResponse.ok) {
           const errorText = await uploadResponse.text();
           console.error("R2 Upload Error Response:", errorText);
           throw new Error(`Upload ke R2 gagal. Status: ${uploadResponse.status}`);
        }

        finalPhotoURL = fileUrl; 
        toast.success('Foto profil berhasil diunggah!', { id: toastId });

      } catch (uploadError: any) {
        console.error("Upload Error:", uploadError);
        setError("Gagal mengunggah foto profil: " + uploadError.message);
        toast.error(`Gagal upload foto: ${uploadError.message}`, { id: toastId });
        setLoading(false); 
        return; 
      }
    }

    try {
      const result = await updateTeacherAction({
        uid: teacherId,             
        ...formData,               
        foto_profil: finalPhotoURL, 
      });

      setLoading(false); 

      if (result.success) {
        toast.success(result.message);
        setSelectedFile(null);
        setCurrentPhotoUrl(finalPhotoURL); 
        if (fileInputRef.current) fileInputRef.current.value = ""; 
        router.push('/list/teachers'); 
        router.refresh(); 
      } else {
        setError(result.message);
        toast.error(`Gagal update data: ${result.message}`);
      }
    } catch (dbError: any) {
        setLoading(false); 
        console.error("DB Update Error:", dbError); 
        setError("Gagal menyimpan data guru: " + dbError.message);
        toast.error("Gagal menyimpan data guru: " + dbError.message);
    }
  };

  const handleBatal = () => { if (!loading && !pageLoading) router.push('/list/teachers'); }; 

  if (pageLoading) {
     return <div className="p-8 text-center text-gray-600">Memuat data guru...</div>;
  }
   if (error && !pageLoading) { 
     return (
       <div className="p-8 text-center text-red-600 bg-red-50 rounded-md">
         <p>{error}</p>
         <button onClick={handleBatal} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Kembali</button>
       </div>
     );
   }


  return (
    <div className="container mx-auto p-4 md:p-8">
       <button onClick={handleBatal} disabled={loading || pageLoading} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 self-start">
        <FiArrowLeft /> Kembali ke Daftar Guru
      </button>

      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto border border-gray-200">

        <div className="border-b p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Edit Guru: {formData.nama_lengkap || '...'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md border border-red-200">{error}</div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 text-gray-700">Informasi Akun & Profil</h3>
                <Input name="nama_lengkap" label="Nama Lengkap (Wajib)" value={formData.nama_lengkap} onChange={handleChange} required />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIP / NUPTK (Tidak bisa diubah)</label>
                    <input type="text" value={formData.nip_nuptk} readOnly className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"/>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 bg-gray-50 p-3 rounded-md border border-gray-200">
                    <div>
                        <label className="block text-xs font-medium text-gray-600">Username (Otomatis)</label>
                        <input type="text" value={formData.nip_nuptk} readOnly className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"/>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600">Password Awal (Otomatis)</label>
                        <input type="text" value={formData.nip_nuptk} readOnly className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                   <Input name="email" label="Email (Kontak)" value={formData.email} onChange={handleChange} type="email" placeholder="email@guru.com"/>
                   <Select name="jenis_kelamin" label="Jenis Kelamin" value={formData.jenis_kelamin} onChange={handleChange} options={[{value: 'L', label: 'Laki-laki'}, {value: 'P', label: 'Perempuan'}]} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 text-center md:text-left">Foto Profil</label>
                <div className="w-40 h-40 mx-auto md:mx-0 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-2 border-2 border-gray-300">
                  {previewUrl ? (
                    <Image
                      src={previewUrl} alt="Preview Foto Profil"
                      width={160} height={160} 
                      className="object-cover w-full h-full"
                      onError={() => {
                          console.warn("Gagal memuat preview:", previewUrl);
                          setPreviewUrl(null); 
                      }}
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">Tidak Ada Foto</span>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1 text-center md:text-left">Pilih foto baru (maks 5MB).</p>
              </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
             <h3 className="text-lg font-semibold border-b pb-2 text-gray-700">Data Pribadi</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input name="tempat_lahir" label="Tempat Lahir" value={formData.tempat_lahir} onChange={handleChange} />
                <Input name="tanggal_lahir" label="Tanggal Lahir" value={formData.tanggal_lahir} onChange={handleChange} type="date" />
                 <Select name="agama" label="Agama" value={formData.agama} onChange={handleChange} options={[{value: 'Islam', label: 'Islam'}, {value: 'Kristen', label: 'Kristen'}, {value: 'Katolik', label: 'Katolik'}, {value: 'Hindu', label: 'Hindu'}, {value: 'Buddha', label: 'Buddha'}, {value: 'Konghucu', label: 'Konghucu'}]} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Input name="wali_kelas_ref" label="ID Wali Kelas (Opsional)" value={formData.wali_kelas_ref} onChange={handleChange} placeholder="Kosongkan jika bukan wali kelas"/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <Input name="mata_pelajaran_diampu" label="Mata Pelajaran (Dipisah Koma)" value={formData.mata_pelajaran_diampu} onChange={handleChange} placeholder="Contoh: mtk, fisika, b. indo" />
              </div>
              <div>
                <Input name="peran" label="Peran (Dipisah Koma)" value={formData.peran} onChange={handleChange} placeholder="Minimal 'guru'. Contoh: guru, staf tu" required />
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
            <button type="button" onClick={handleBatal} disabled={loading || pageLoading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading || pageLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 min-w-[150px] transition-colors"> {/* Lebarkan sedikit */}
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
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
