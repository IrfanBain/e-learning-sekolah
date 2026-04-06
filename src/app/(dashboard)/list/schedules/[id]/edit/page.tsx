"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { collection, getDocs, query, orderBy, doc, getDoc, Timestamp, DocumentReference, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig'; 
import { ScheduleUpdateFormData, updateScheduleAction } from '@/app/actions/schedulesActions';
import { ActionResult } from '@/app/actions/teacherActions'; 
import { FiArrowLeft } from 'react-icons/fi';

interface Option { value: string; label: string; }
interface TeacherOption { value: string; label: string; }
interface ClassOption { value: string; label: string; }
interface SubjectOption { value: string; label: string; }

interface ScheduleFetchData {
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  kelas_ref: DocumentReference | null;
  mapel_ref: DocumentReference | null;
  guru_ref: DocumentReference | null;
  tahun_ajaran: string;
  jumlah_jam_pelajaran: number;
  ruangan: string | null;
}

const HARI_OPTIONS: Option[] = [
    { value: "Senin", label: "Senin" }, { value: "Selasa", label: "Selasa" },
    { value: "Rabu", label: "Rabu" }, { value: "Kamis", label: "Kamis" },
    { value: "Jumat", label: "Jumat" }, { value: "Sabtu", label: "Sabtu" },
];

const initialFormState: Omit<ScheduleUpdateFormData, 'id'> = {
  hari: '', 
  jam_mulai: '',
  jam_selesai: '',
  kelas_id: '', 
  mapel_id: '', 
  guru_id: '',  
  tahun_ajaran: '',
  jumlah_jam_pelajaran: 0, 
  ruangan: '',
};

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.id as string; 

  const [formData, setFormData] = useState(initialFormState);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(false); 
  const [pageLoading, setPageLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scheduleId) return; 
    const fetchData = async () => {
      setPageLoading(true); setError(null);
      let fetchedScheduleData: ScheduleFetchData | null = null; 

      try {
        const scheduleDocRef = doc(db, "schedules", scheduleId);
        const scheduleSnap = await getDoc(scheduleDocRef);
        if (!scheduleSnap.exists()) { throw new Error("Data jadwal tidak ditemukan."); }
        fetchedScheduleData = scheduleSnap.data() as ScheduleFetchData;

        const classQuery = query(collection(db, "classes"), orderBy("tingkat"), orderBy("nama_kelas"));
        const subjectQuery = query(collection(db, "subjects"), orderBy("urutan"), orderBy("nama_mapel"));
        const teacherQuery = query(collection(db, "teachers"), orderBy("nama_lengkap"));

        const [classSnap, subjectSnap, teacherSnap] = await Promise.all([
             getDocs(classQuery), getDocs(subjectQuery), getDocs(teacherQuery)
        ]);

        const classList = classSnap.docs.map(d => ({ value: d.id, label: d.data().nama_kelas || d.id }));
        const subjectList = subjectSnap.docs.map(d => ({ value: d.id, label: d.data().nama_mapel || d.id }));
        const teacherList = teacherSnap.docs.map(d => ({ value: d.id, label: d.data().nama_lengkap || d.id }));

        setClasses(classList);
        setSubjects(subjectList);
        setTeachers(teacherList);

        if (fetchedScheduleData) {
            setFormData({
                hari: fetchedScheduleData.hari || '',
                jam_mulai: fetchedScheduleData.jam_mulai || '',
                jam_selesai: fetchedScheduleData.jam_selesai || '',
                kelas_id: fetchedScheduleData.kelas_ref?.id || '',
                mapel_id: fetchedScheduleData.mapel_ref?.id || '',
                guru_id: fetchedScheduleData.guru_ref?.id || '',
                tahun_ajaran: fetchedScheduleData.tahun_ajaran || '',
                jumlah_jam_pelajaran: fetchedScheduleData.jumlah_jam_pelajaran ?? 0,
                ruangan: fetchedScheduleData.ruangan || '',
            });
        }

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("Gagal memuat data: " + err.message);
        toast.error("Gagal memuat data.");
      } finally {
        setPageLoading(false); 
      }
    };
    fetchData();
  }, [scheduleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jumlah_jam_pelajaran' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     if (!formData.hari || !formData.jam_mulai || !formData.jam_selesai || !formData.kelas_id || !formData.mapel_id || !formData.guru_id || !formData.tahun_ajaran || formData.jumlah_jam_pelajaran <= 0) { /*...*/ return; }
     const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
     if (!timeRegex.test(formData.jam_mulai) || !timeRegex.test(formData.jam_selesai)) { return; }
     if (formData.jam_selesai <= formData.jam_mulai) { return; }
      if (!/^\d{4}\/\d{4}$/.test(formData.tahun_ajaran)) { return; }


    setLoading(true); setError(null);

    const payload: ScheduleUpdateFormData = {
        id: scheduleId, 
        hari: formData.hari,
        jam_mulai: formData.jam_mulai,
        jam_selesai: formData.jam_selesai,
        kelas_id: formData.kelas_id, 
        mapel_id: formData.mapel_id, 
        guru_id: formData.guru_id,   
        tahun_ajaran: formData.tahun_ajaran,
        jumlah_jam_pelajaran: formData.jumlah_jam_pelajaran,
        ruangan: formData.ruangan,
    };

    const result: ActionResult = await updateScheduleAction(payload); 
    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      router.push('/list/schedules'); 
      router.refresh();
    } else {
      setError(result.message);
      toast.error(`Gagal: ${result.message}`);
    }
  };

  const handleBatal = () => { if (!loading) router.push('/list/schedules'); };

   if (pageLoading) {
     return <div className="p-8 text-center text-gray-600">Memuat data jadwal...</div>;
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
        <FiArrowLeft /> Kembali ke Daftar Jadwal
      </button>

      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto border border-gray-200">
        <div className="border-b p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
             Edit Jadwal Pelajaran (ID: {scheduleId.substring(0, 6)}...)
          </h1>
          <p className="text-sm text-gray-500 mt-1">{formData.hari}, {formData.jam_mulai}-{formData.jam_selesai}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
          {error && !loading && ( <div className="p-3 bg-red-100 text-red-700 rounded-md border border-red-200 text-sm">{error}</div> )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select name="hari" label="Hari*" value={formData.hari} onChange={handleChange} required options={HARI_OPTIONS} />
              <Input name="tahun_ajaran" label="Tahun Ajaran*" value={formData.tahun_ajaran} onChange={handleChange} required placeholder="YYYY/YYYY"/>
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <Input name="jam_mulai" label="Jam Mulai*" value={formData.jam_mulai} onChange={handleChange} type="time" required />
             <Input name="jam_selesai" label="Jam Selesai*" value={formData.jam_selesai} onChange={handleChange} type="time" required />
             <Input name="jumlah_jam_pelajaran" label="Jumlah JP*" value={String(formData.jumlah_jam_pelajaran)} onChange={handleChange} type="number" required min="1" />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <Select name="kelas_id" label="Kelas*" value={formData.kelas_id} onChange={handleChange} required disabled={pageLoading || classes.length === 0}
                       options={ classes.length === 0 ? [{value:'', label:'Memuat...'}] : classes } />

               <Select name="mapel_id" label="Mata Pelajaran*" value={formData.mapel_id} onChange={handleChange} required disabled={pageLoading || subjects.length === 0}
                       options={ subjects.length === 0 ? [{value:'', label:'Memuat...'}] : subjects } />

               <Select name="guru_id" label="Guru Pengajar*" value={formData.guru_id} onChange={handleChange} required disabled={pageLoading || teachers.length === 0}
                       options={ teachers.length === 0 ? [{value:'', label:'Memuat...'}] : teachers } />
           </div>
            {(classes.length === 0 || subjects.length === 0 || teachers.length === 0) && !pageLoading && (
                <p className="text-xs text-yellow-600 -mt-3">Data Kelas/Mapel/Guru mungkin belum dimuat.</p>
            )}

           <Input name="ruangan" label="Ruangan (Opsional)" value={formData.ruangan || ''} onChange={handleChange} placeholder="Cth: Lab IPA, R.101"/>

          <div className="flex justify-end gap-4 pt-5 border-t mt-6">
            <button type="button" onClick={handleBatal} disabled={loading || pageLoading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">Batal</button>
            <button type="submit" disabled={loading || pageLoading || classes.length === 0 || subjects.length === 0 || teachers.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 min-w-[150px] transition-colors">
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type InputProps = { label: string; name: string; value: string | null | undefined; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; type?: string; required?: boolean; readOnly?: boolean; placeholder?: string; min?: string | number; max?: string | number; pattern?: string; };
const Input = ({ label, name, value, onChange, type = 'text', required = false, readOnly = false, placeholder = '', min, max, pattern }: InputProps) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
    <input type={type} id={name} name={name} value={value ?? ''} onChange={onChange} required={required} readOnly={readOnly} placeholder={placeholder} min={min} max={max} pattern={pattern}
           className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} ${type === 'time' ? 'leading-snug' : ''}`} />
  </div>
);

type SelectProps = { label: string; name: string; value: string | null | undefined; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; options: { value: string; label: string }[]; required?: boolean; disabled?: boolean; };
const Select = ({ label, name, value, onChange, options, required = false, disabled = false }: SelectProps) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
    <select id={name} name={name} value={value ?? ''} onChange={onChange} required={required} disabled={disabled}
            className={`block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
      {(!required || disabled || options.length === 0 || options[0]?.value !== '') && <option value="" disabled={required}> -- Pilih -- </option>}
      {options.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
    </select>
  </div>
);
