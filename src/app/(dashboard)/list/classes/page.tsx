"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy, DocumentData, QueryDocumentSnapshot, DocumentReference, Firestore, doc as firestoreDoc, DocumentSnapshot, getDoc } from 'firebase/firestore'; 
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/authContext'; 

import {
  FiSearch, FiPlus, FiChevronDown, FiEye, FiEdit, FiTrash2
} from 'react-icons/fi';

import { deleteClassAction, ActionResult } from '@/app/actions/classActions';
interface ClassData {
  id: string; 
  nama_kelas: string; 
  tingkat: number;
  tahun_ajaran: string;
  wali_kelas_ref: DocumentReference | null;
}

interface WaliKelasInfo {
    id: string;
    nama: string | null;
}

function doc(db: Firestore, collectionPath: string, docId: string) {
  return firestoreDoc(db, collectionPath, docId);
}

export default function ManageClassesPage() {
  const { user } = useAuth(); 
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [waliKelasMap, setWaliKelasMap] = useState<Record<string, WaliKelasInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("Semua Tingkat");
  const fetchClasses = async () => {
    setLoading(true); setError(null);
    try {
      const classesCollection = collection(db, "classes");
      const q = query(classesCollection, orderBy("tingkat", "asc"), orderBy("nama_kelas", "asc"));
      const querySnapshot = await getDocs(q);

      const classesList = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data()
      } as ClassData));

      setAllClasses(classesList);

      fetchWaliKelasNames(classesList); 

    } catch (err: any) {
      console.error("Error fetching classes: ", err);
      setError("Gagal mengambil data kelas. Pastikan koleksi 'classes' ada.");
    } finally {
      setLoading(false);
    }
  };

   const fetchWaliKelasNames = async (classes: ClassData[]) => {
      const teacherIds = classes
          .map(cls => cls.wali_kelas_ref?.id) 
          .filter((id): id is string => !!id); 
      if (teacherIds.length === 0) {
          setLoading(false); 
          return;
      }

      const uniqueTeacherIds = Array.from(new Set(teacherIds));
      const newWaliKelasMap: Record<string, WaliKelasInfo> = {};

      try {
         for (const teacherId of uniqueTeacherIds) {
             const teacherDocRef = doc(db, "teachers", teacherId);
             const teacherSnap = await getDoc(teacherDocRef);
             if (teacherSnap.exists()) {
                 newWaliKelasMap[teacherId] = {
                     id: teacherId,
                     nama: teacherSnap.data()?.nama_lengkap || 'Nama Tidak Ditemukan'
                 };
             } else {
                 newWaliKelasMap[teacherId] = { id: teacherId, nama: 'Guru Tidak Ditemukan' };
             }
         }
         setWaliKelasMap(prevMap => ({ ...prevMap, ...newWaliKelasMap }));
      } catch (err) {
         console.error("Error fetching teacher names:", err);
      } finally {
          setLoading(false);
      }
   };


  useEffect(() => {
    fetchClasses();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const uniqueTingkat = useMemo(() => {
    return Array.from(new Set(allClasses.map(c => c.tingkat).filter(Boolean)))
           .sort((a, b) => a - b) 
           .map(String); 
  }, [allClasses]);

  const filteredClasses = useMemo(() => {
    return allClasses.filter(item => {
        const waliKelasNama = waliKelasMap[item.wali_kelas_ref?.id || '']?.nama?.toLowerCase() || '';
        const searchLower = searchQuery.toLowerCase();

        return (
            (item.nama_kelas.toLowerCase().includes(searchLower) ||
             waliKelasNama.includes(searchLower) || 
             item.tahun_ajaran.includes(searchQuery) 
            ) &&
            (filterTingkat === "Semua Tingkat" || String(item.tingkat) === filterTingkat)
        );
    });
  }, [allClasses, searchQuery, filterTingkat, waliKelasMap]); 

  const handleDeleteClass = (classId: string, className: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-2">
        <span>Anda yakin ingin menghapus kelas <strong className="text-red-600">{className} ({classId})</strong>?</span>
        <p className="text-xs text-yellow-700">Perhatian: Menghapus kelas mungkin mempengaruhi data siswa/jadwal terkait.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-200 rounded-md text-sm">Batal</button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              performDelete(classId, className);
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-md text-sm">Ya, Hapus
          </button>
        </div>
      </div>
    ), { duration: 10000, position: 'top-center' });
  };

  const performDelete = async (classId: string, className: string) => {
    const promise = deleteClassAction(classId);
    toast.promise(promise, {
      loading: `Menghapus kelas ${className}...`,
      success: (result: ActionResult) => {
        if (result.success) { fetchClasses(); return result.message; } 
        else { throw new Error(result.message); }
      },
      error: (err) => `Gagal menghapus: ${err.message}`,
    });
  };

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-semibold mb-5">Manajemen Kelas</h2>
      {error && ( <div className="p-4 mb-4 bg-yellow-100 text-yellow-800 rounded-md">{error}</div> )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-200 gap-4">
          <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
              <select value={filterTingkat} onChange={(e) => setFilterTingkat(e.target.value)}
                      className="appearance-none w-full bg-gray-100 border-none rounded-lg py-2 px-4 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]">
                <option value="Semua Tingkat">Semua Tingkat</option>
                {uniqueTingkat.map((tingkat) => ( <option key={tingkat} value={tingkat}>Tingkat {tingkat}</option> ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-grow">
              <input type="text" placeholder="Cari kelas/wali/tahun..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {user?.role === 'admin' && (
              <Link href="/list/classes/create" 
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    title="Tambah Kelas Baru">
                <FiPlus className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kelas (ID)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tingkat</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wali Kelas</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun Ajaran</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && ( <tr><td colSpan={5} className="p-10 text-center text-gray-500">Memuat data kelas...</td></tr> )}
              {!loading && filteredClasses.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama_kelas} ({item.id})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tingkat}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {waliKelasMap[item.wali_kelas_ref?.id || '']?.nama || (item.wali_kelas_ref ? 'Memuat...' : '-')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tahun_ajaran}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                       <Link href={`/list/classes/${item.id}`} className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-lg" title="Lihat Detail"><FiEye className="w-5 h-5" /></Link>
                       {user?.role === 'admin' && (
                         <Link href={`/list/classes/edit/${item.id}`} className="text-purple-500 hover:text-purple-700 p-2 bg-purple-50 rounded-lg" title="Edit"><FiEdit className="w-5 h-5" /></Link>
                       )}
                       {user?.role === 'admin' && (
                         <button onClick={() => handleDeleteClass(item.id, item.nama_kelas)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg" title="Hapus"><FiTrash2 className="w-5 h-5" /></button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {!loading && filteredClasses.length === 0 && ( <div className="p-10 text-center text-gray-500">Tidak ada kelas ditemukan.</div> )}
        </div>
      </div>
    </div>
  );
}

