"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/authContext'; 
import {
  FiSearch, FiPlus, FiChevronDown, FiEye, FiEdit, FiTrash2, FiFilter
} from 'react-icons/fi';
import { deleteSubjectAction, ActionResult } from '@/app/actions/subjectActions';

interface SubjectData {
  id: string; 
  nama_mapel: string;
  nama_pendek: string; 
  kelompok: string | null;
  kkm: number | null;
  tingkat: string[]; 
  urutan: number | null;
}

export default function ManageSubjectsPage() {
  const { user } = useAuth();
  const [allSubjects, setAllSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelompok, setFilterKelompok] = useState("Semua Kelompok");
  const fetchSubjects = async () => {
    setLoading(true); setError(null);
    try {
      const subjectsCollection = collection(db, "subjects");
      const q = query(subjectsCollection, orderBy("urutan", "asc"), orderBy("nama_mapel", "asc"));
      const querySnapshot = await getDocs(q);
      const subjectsList = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id, 
        ...doc.data()
      } as SubjectData));

      setAllSubjects(subjectsList);
    } catch (err: any) {
      console.error("Error fetching subjects: ", err);
      setError("Gagal mengambil data mata pelajaran. Pastikan koleksi 'subjects' ada dan Anda memiliki izin.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchSubjects(); }, []);

  const filteredSubjects = useMemo(() => {
    return allSubjects.filter(item =>
      (item.nama_mapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.nama_pendek.toLowerCase().includes(searchQuery.toLowerCase())) && 
      (filterKelompok === "Semua Kelompok" || item.kelompok === filterKelompok)
    );
  }, [allSubjects, searchQuery, filterKelompok]);

   const handleDeleteSubjectInternal = (subjectId: string, subjectName: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-2">
        <span>Anda yakin ingin menghapus mapel <strong className="text-red-600">{subjectName} ({subjectId})</strong>?</span>
        <p className="text-xs text-yellow-700">Perhatian: Ini dapat mempengaruhi data jadwal atau nilai terkait.</p>
        <div className="flex gap-3 justify-end mt-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-200 rounded-md text-sm">Batal</button>
          <button
            onClick={() => { toast.dismiss(t.id); performDeleteInternal(subjectId, subjectName); }}
            className="px-3 py-1 bg-red-600 text-white rounded-md text-sm">Ya, Hapus</button>
        </div>
      </div>
    ), { duration: 8000, position: 'top-center' });
  };

  const performDeleteInternal = async (subjectId: string, subjectName: string) => {
    const promise = deleteSubjectAction(subjectId);
    toast.promise(promise, {
      loading: `Menghapus ${subjectName}...`,
      success: (result: ActionResult) => {
        if (result.success) { fetchSubjects(); return result.message; } 
        else { throw new Error(result.message); }
      },
      error: (err) => `Gagal menghapus: ${err.message}`,
    });
  };


  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-semibold mb-5">Manajemen Mata Pelajaran</h2>
      {error && ( <div className="p-4 mb-4 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-200">{error}</div> )}

      <div className="bg-white rounded-lg shadow-md border border-gray-100"> 
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-200 gap-4">
          <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
              <select value={filterKelompok} onChange={(e) => setFilterKelompok(e.target.value)}
                      className="appearance-none w-full bg-gray-100 border-none rounded-lg py-2 px-4 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]">
                <option value="Semua Kelompok">Semua Kelompok</option>
                <option value="UMUM">Umum</option> 
                <option value="AGAMA">Agama</option>
                <option value="MULOK">Muatan Lokal</option>
                <option value="LAIN">Lainnya</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-grow">
              <input type="text" placeholder="Cari nama/nama pendek..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {user?.role === 'admin' && (
              <Link href="/list/subjects/create" 
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    title="Tambah Mata Pelajaran Baru">
                <FiPlus className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Urutan</th> 
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">(ID)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Mata Pelajaran</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelompok</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tingkat</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">KKM</th> 
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500 italic">
                        Memuat data mata pelajaran...
                    </td>
                </tr>
              )}

              {!loading && filteredSubjects.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{item.urutan ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{item.nama_pendek || item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama_mapel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.kelompok || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {(item.tingkat && item.tingkat.length > 0) ? item.tingkat.join(', ') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-center text-blue-700">{item.kkm ?? '-'}</td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                       {user?.role === 'admin' && (
                         <Link href={`/list/subjects/${item.id}/edit`}
                               className="text-purple-500 hover:text-purple-700 p-2 bg-purple-50 rounded-lg transition-colors" title="Edit">
                           <FiEdit className="w-5 h-5" />
                         </Link>
                       )}
                       {user?.role === 'admin' && (
                         <button onClick={() => handleDeleteSubjectInternal(item.id, item.nama_mapel)}
                                 className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg transition-colors" title="Hapus">
                           <FiTrash2 className="w-5 h-5" />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredSubjects.length === 0 && (
             <div className="px-6 py-10 text-center text-gray-500 italic">
               {allSubjects.length === 0 ? "Belum ada data mata pelajaran." : "Tidak ada mata pelajaran ditemukan dengan filter saat ini."}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

type InputProps = { label: string; name: string; value: string | null | undefined; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; type?: string; required?: boolean; readOnly?: boolean; placeholder?: string; min?: string | number; max?: string | number; };
const Input = ({ label, name, value, onChange, type = 'text', required = false, readOnly = false, placeholder = '', min, max }: InputProps) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type={type} id={name} name={name} value={value || ''} onChange={onChange} required={required} readOnly={readOnly} placeholder={placeholder} min={min} max={max}
           className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} />
  </div>
);
type SelectProps = { label: string; name: string; value: string | null | undefined; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; options: { value: string; label: string }[]; required?: boolean; disabled?: boolean; };
const Select = ({ label, name, value, onChange, options, required = false, disabled = false }: SelectProps) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select id={name} name={name} value={value || ''} onChange={onChange} required={required} disabled={disabled}
            className={`block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
     
      {options.length === 0 || options[0]?.value !== '' && <option value="" disabled={required}> -- Pilih -- </option>}
      {options.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
    </select>
  </div>
);

