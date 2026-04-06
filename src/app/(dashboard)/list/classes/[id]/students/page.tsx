"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, where, orderBy, doc, getDoc, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import {
  FiSearch,
  FiArrowLeft, 
  FiEye,
} from 'react-icons/fi';

interface StudentData {
  id: string;
  nama_lengkap: string;
  nisn: string;
  nis: string | null;
  kelas: string | null; 
  email: string | null;
  foto_profil: string | null;
  jenis_kelamin: string | null;
}

interface ClassInfo {
    nama_kelas: string;
    tingkat: number;
    tahun_ajaran: string;
}

export default function ClassStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string; 

  const [studentsInClass, setStudentsInClass] = useState<StudentData[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); 

  useEffect(() => {
    if (!classId) {
      setError("ID Kelas tidak ditemukan di URL.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const classDocRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classDocRef);
        if (classSnap.exists()) {
            setClassInfo(classSnap.data() as ClassInfo);
        } else {
            console.warn(`Info kelas ${classId} tidak ditemukan.`);
        }

        const studentsCollection = collection(db, "students");
        const q = query(
            studentsCollection,
            where("kelas", "==", classId), 
            orderBy("nama_lengkap", "asc") 
        );

        const querySnapshot = await getDocs(q);
        const studentsList = querySnapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => ({
          id: docSnap.id,
          ...docSnap.data()
        } as StudentData));

        setStudentsInClass(studentsList);

      } catch (err: any) {
        console.error("Error fetching class students:", err);
        setError("Gagal mengambil data siswa kelas: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]); 

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return studentsInClass; 
    const searchLower = searchQuery.toLowerCase();
    return studentsInClass.filter(student =>
      student.nama_lengkap.toLowerCase().includes(searchLower) ||
      student.nisn.includes(searchQuery) || 
      (student.nis && student.nis.includes(searchQuery)) 
    );
  }, [studentsInClass, searchQuery]);

  const handleBack = () => {
    router.push(`/list/classes/${classId}`);
  };

  if (loading) { return <div className="p-8 text-center text-gray-600">Memuat daftar siswa...</div>; }
   if (error) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-md">
        <p>{error}</p>
        <button onClick={handleBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Kembali</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-5">
         <button onClick={handleBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <FiArrowLeft /> Kembali ke Detail Kelas
         </button>
         <h2 className="text-xl md:text-2xl font-semibold text-gray-800 text-right">
             Daftar Siswa Kelas {classInfo?.nama_kelas || classId}
             {classInfo && <span className="block text-sm font-normal text-gray-500">T.A {classInfo.tahun_ajaran}</span>}
         </h2>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100">

        <div className="flex justify-end items-center p-4 border-b border-gray-200">
          <div className="relative w-full md:w-1/3">
              <input
                type="text"
                placeholder="Cari nama/NISN/NIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info Siswa</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NISN</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Kelamin</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!loading && filteredStudents.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                         <div className="flex-shrink-0 h-10 w-10">
                           <Image
                             className="h-10 w-10 rounded-full object-cover"
                             src={item.foto_profil || '/placeholder-avatar.png'}
                             alt={item.nama_lengkap}
                             width={40} height={40}
                             onError={(e) => { e.currentTarget.src = '/placeholder-avatar.png'; }}
                           />
                         </div>
                         <div className="ml-4">
                           <div className="text-sm font-medium text-gray-900">{item.nama_lengkap}</div>
                           <div className="text-sm text-gray-500">{item.email || '-'}</div>
                         </div>
                      </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nisn}</td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nis || '-'}</td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.jenis_kelamin === 'L' ? 'Laki-laki' : item.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</td>

                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/list/students/${item.id}`} 
                        className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-lg inline-flex items-center justify-center"
                        title="Lihat Detail Siswa">
                        <FiEye className="w-5 h-5" />
                      </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredStudents.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              {studentsInClass.length === 0 ? `Belum ada siswa di kelas ${classInfo?.nama_kelas || classId}.` : 'Tidak ada siswa ditemukan dengan kata kunci pencarian ini.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

