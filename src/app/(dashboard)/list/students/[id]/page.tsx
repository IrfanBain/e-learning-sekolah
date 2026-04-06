"use client"; 

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebaseConfig';       
import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import Performance from "@/components/Performance";
import { format } from 'date-fns'; 

interface StudentDetailData {
  id: string; 
  nama_lengkap: string;
  nisn: string;
  nis: string | null;
  kelas: string | null;
  email: string | null; 
  jenis_kelamin: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: any; 
  agama: string | null;
  kewarganegaraan: string | null;
  asal_sekolah: string | null;
  nomor_hp: string | null;
  status_siswa: string | null;
  foto_profil: string | null;
  alamat: { 
    jalan?: string | null;
    rt_rw?: string | null;
    kelurahan_desa?: string | null;
    kecamatan?: string | null;
    kota_kabupaten?: string | null;
    provinsi?: string | null;
    kode_pos?: string | null;
  };
  orang_tua: { 
    alamat?: string | null;
    ayah?: { nama?: string | null; pendidikan?: string | null; pekerjaan?: string | null; telepon?: string | null };
    ibu?: { nama?: string | null; pendidikan?: string | null; pekerjaan?: string | null; telepon?: string | null };
  };
  tanggal_masuk?: any; 
}

const SingleStudentPage = () => {
  const params = useParams();
  const router = useRouter(); 
  const studentId = params.id as string; 

  const [student, setStudent] = useState<StudentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) {
        setError("ID Siswa tidak ditemukan di URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const studentDocRef = doc(db, "students", studentId);
        const docSnap = await getDoc(studentDocRef);

        if (docSnap.exists()) {
          setStudent({ id: docSnap.id, ...docSnap.data() } as StudentDetailData);
        } else {
          setError("Data siswa tidak ditemukan.");
          setStudent(null);
        }
      } catch (err: any) {
        console.error("Error fetching student:", err);
        setError("Gagal mengambil data siswa: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);
  if (loading) {
    return <div className="p-8 text-center">Memuat data siswa...</div>;
  }

  if (error) {
     return (
       <div className="p-8 text-center text-red-600">
         {error}
         <button onClick={() => router.back()} className="text-blue-600 hover:underline block mt-2">
           Kembali
         </button>
       </div>
     );
  }

  if (!student) {
    return (
      <div className="p-8 text-center">
        Data siswa tidak ditemukan.
        <Link href="/list/students" className="text-blue-600 hover:underline block mt-2">
          Kembali ke Daftar Siswa
        </Link>
      </div>
    );
  }
  
  const formatAlamat = (alamat: StudentDetailData['alamat']) => {
    if (!alamat) return 'N/A';
    const parts = [
      alamat.jalan,
      alamat.rt_rw ? `RT/RW ${alamat.rt_rw}` : null,
      alamat.kelurahan_desa,
      alamat.kecamatan,
      alamat.kota_kabupaten,
      alamat.provinsi,
      alamat.kode_pos,
    ].filter(Boolean); 
    return parts.join(', ') || 'N/A';
  };
  
  const formatFirestoreTimestamp = (timestamp: any) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      try {
        return format(timestamp.toDate(), "d MMMM yyyy");
      } catch (e) {
        return "Invalid Date";
      }
    }
    return 'N/A';
  };

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3 flex justify-center">
              <Image
                src={student.foto_profil || '/placeholder-avatar.png'} 
                alt={student.nama_lengkap}
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-md"
              />
            </div>
            <div className="w-full md:w-2/3 flex flex-col justify-between gap-4">
              <h1 className="text-xl font-semibold text-center md:text-left">{student.nama_lengkap}</h1>
              <p className="text-sm text-gray-500 text-center md:text-left">
                Siswa kelas {student.kelas || 'N/A'} - NISN: {student.nisn}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-x-4 gap-y-2 flex-wrap text-xs font-medium">
                 <div className="flex items-center gap-1">
                   <Image src="/mail.png" alt="" width={14} height={14} />
                   <span>{student.email || 'N/A'}</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <Image src="/phone.png" alt="" width={14} height={14} />
                   <span>{student.nomor_hp || 'N/A'}</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <Image src="/date.png" alt="" width={14} height={14} />
                   <span>Masuk: {formatFirestoreTimestamp(student.tanggal_masuk)}</span> 
                 </div>
                 <div className="flex items-center gap-1">
                   <span className={`px-2 py-0.5 rounded-full text-xs ${student.status_siswa === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                     Status: {student.status_siswa || 'N/A'}
                   </span>
                 </div>
              </div>
              <div className="flex justify-center md:justify-start gap-2 mt-2">
                 <button onClick={() => router.back()} className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Kembali</button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-white p-4 rounded-md flex gap-4 w-full sm:w-[48%] xl:w-full 2xl:w-[48%] shadow">
              <Image src="/singleAttendance.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">N/A</h1>
                <span className="text-sm text-gray-400">Kehadiran</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex gap-4 w-full sm:w-[48%] xl:w-full 2xl:w-[48%] shadow">
              <Image src="/singleClass.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{student.kelas || 'N/A'}</h1>
                <span className="text-sm text-gray-400">Kelas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-md p-4 shadow">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">Detail Informasi Siswa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
             <InfoItem label="NIS" value={student.nis} />
             <InfoItem label="Jenis Kelamin" value={student.jenis_kelamin === 'L' ? 'Laki-laki' : student.jenis_kelamin === 'P' ? 'Perempuan' : 'N/A'} />
             <InfoItem label="Tempat Lahir" value={student.tempat_lahir} />
             <InfoItem label="Tanggal Lahir" value={formatFirestoreTimestamp(student.tanggal_lahir)} />
             <InfoItem label="Agama" value={student.agama} />
             <InfoItem label="Kewarganegaraan" value={student.kewarganegaraan} />
             <InfoItem label="Asal Sekolah" value={student.asal_sekolah} />
             <InfoItem label="Alamat Lengkap" value={formatAlamat(student.alamat)} />
          </div>
        </div>
        
        <div className="mt-4 bg-white rounded-md p-4 shadow">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">Detail Informasi Orang Tua</h2>
          <InfoItem label="Alamat Orang Tua" value={student.orang_tua?.alamat} />
          
          <h3 className="text-md font-semibold mt-3 mb-1">Ayah</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
             <InfoItem label="Nama" value={student.orang_tua?.ayah?.nama} />
             <InfoItem label="Pendidikan" value={student.orang_tua?.ayah?.pendidikan} />
             <InfoItem label="Pekerjaan" value={student.orang_tua?.ayah?.pekerjaan} />
             <InfoItem label="Telepon" value={student.orang_tua?.ayah?.telepon} />
          </div>
           
          <h3 className="text-md font-semibold mt-3 mb-1">Ibu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
             <InfoItem label="Nama" value={student.orang_tua?.ibu?.nama} />
             <InfoItem label="Pendidikan" value={student.orang_tua?.ibu?.pendidikan} />
             <InfoItem label="Pekerjaan" value={student.orang_tua?.ibu?.pekerjaan} />
             <InfoItem label="Telepon" value={student.orang_tua?.ibu?.telepon} />
          </div>
        </div>

         <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;

const InfoItem = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="py-1">
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="ml-2 text-gray-800">{value || 'N/A'}</span>
  </div>
);