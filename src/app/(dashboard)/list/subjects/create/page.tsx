"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { SubjectFormData, createSubjectAction } from '@/app/actions/subjectActions';
import { ActionResult } from '@/app/actions/teacherActions'; 
import { FiArrowLeft } from 'react-icons/fi';

const TINGKAT_OPTIONS = ["6", "7", "8", "9"];

const initialState: SubjectFormData = {
  nama_pendek: '', 
  nama_mapel: '',
  kelompok: '', 
  kkm: 75,     
  urutan: 10,  
  tingkat: [], 
};

export default function CreateSubjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SubjectFormData>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumericField = name === 'kkm' || name === 'urutan';
    setFormData(prev => ({
      ...prev,
      [name]: isNumericField ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleTingkatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target; 

    setFormData(prev => {
        const currentTingkat = prev.tingkat || []; 
        let newTingkat: string[];
        if (checked) {
            newTingkat = [...currentTingkat, value];
        } else {
            newTingkat = currentTingkat.filter(t => t !== value);
        }
        newTingkat.sort();
        return { ...prev, tingkat: newTingkat };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_pendek || !formData.nama_mapel || !formData.kelompok || formData.tingkat.length === 0) {
      setError("Nama Pendek, Nama Mapel, Kelompok, dan minimal satu Tingkat wajib diisi.");
      toast.error("Field wajib (*) belum lengkap.");
      return;
    }
     if (isNaN(formData.kkm) || formData.kkm < 0 || formData.kkm > 100) {
        setError("KKM harus berupa angka antara 0 dan 100.");
        toast.error("Nilai KKM tidak valid.");
        return;
    }
     if (isNaN(formData.urutan)) {
         setError("Urutan harus berupa angka.");
         toast.error("Nilai Urutan tidak valid.");
         return;
     }

    setLoading(true); 
    setError(null); 

    const result: ActionResult = await createSubjectAction(formData);

    setLoading(false); 

    if (result.success) {
      toast.success(result.message);
      router.push('/list/subjects'); 
      router.refresh(); 
    } else {
      setError(result.message);
      toast.error(`Gagal: ${result.message}`);
    }
  };

  const handleBatal = () => { if (!loading) router.push('/list/subjects'); };

  return (
    <div className="container mx-auto p-4 md:p-8">
       <button onClick={handleBatal} disabled={loading} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 self-start transition-colors">
        <FiArrowLeft /> Kembali ke Daftar Mata Pelajaran
      </button>

      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto border border-gray-200">
        <div className="border-b border-gray-200 p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Tambah Mata Pelajaran Baru
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
          {error && ( <div className="p-3 bg-red-100 text-red-700 rounded-md border border-red-200 text-sm">{error}</div> )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input name="nama_pendek" label="Nama Pendek (ID Unik)*" value={formData.nama_pendek} onChange={handleChange} required placeholder="Cth: MTK, FIS, BIND" />
            <Input name="nama_mapel" label="Nama Mata Pelajaran*" value={formData.nama_mapel} onChange={handleChange} required placeholder="Cth: Matematika" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select name="kelompok" label="Kelompok Mapel*" value={formData.kelompok} onChange={handleChange} required
                      options={[
                          {value: '', label: '-- Pilih --'},
                          {value: 'UMUM', label: 'Umum'},
                          {value: 'AGAMA', label: 'Agama'},
                          {value: 'MULOK', label: 'Muatan Lokal'},
                          {value: 'LAIN', label: 'Lainnya'},
                      ]}
              />
            <Input name="kkm" label="KKM (0-100)*" value={String(formData.kkm)} onChange={handleChange} type="number" required min="0" max="100"/>
            <Input name="urutan" label="Urutan Tampil*" value={String(formData.urutan)} onChange={handleChange} type="number" required min="0"/>
          </div>

           <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Diajarkan di Tingkat*:</label>
               <div className="flex flex-wrap gap-x-6 gap-y-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                   {TINGKAT_OPTIONS.map(tingkat => (
                       <label key={tingkat} className="flex items-center space-x-2 cursor-pointer hover:text-blue-600">
                           <input
                               type="checkbox"
                               name="tingkat" 
                               value={tingkat} 
                               checked={formData.tingkat.includes(tingkat)}
                               onChange={handleTingkatChange} 
                               className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                           />
                           <span className="text-sm text-gray-700">Tingkat {tingkat}</span>
                       </label>
                   ))}
               </div>
               {formData.tingkat.length === 0 && <p className="text-xs text-red-500 mt-1">Pilih minimal satu tingkat.</p>}
           </div>

          <div className="flex justify-end gap-4 pt-5 border-t border-gray-200 mt-6"> 
            <button type="button" onClick={handleBatal} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">Batal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 min-w-[150px] transition-colors">
              {loading ? 'Menyimpan...' : 'Simpan Mata Pelajaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type InputProps = { label: string; name: string; value: string | null | undefined; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; type?: string; required?: boolean; readOnly?: boolean; placeholder?: string; min?: string | number; max?: string | number; };
const Input = ({ label, name, value, onChange, type = 'text', required = false, readOnly = false, placeholder = '', min, max }: InputProps) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label> {/* Tambah tanda * */}
    <input type={type} id={name} name={name} value={value ?? ''} onChange={onChange} required={required} readOnly={readOnly} placeholder={placeholder} min={min} max={max}
           className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} />
  </div>
);

type SelectProps = { label: string; name: string; value: string | null | undefined; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; options: { value: string; label: string }[]; required?: boolean; disabled?: boolean; };
const Select = ({ label, name, value, onChange, options, required = false, disabled = false }: SelectProps) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label> 
    <select id={name} name={name} value={value ?? ''} onChange={onChange} required={required} disabled={disabled}
            className={`block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
      {options.length === 0 || (options[0]?.value !== '' && !required) && <option value="" disabled={required}> -- Pilih -- </option>}
      {options.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
    </select>
  </div>
);
