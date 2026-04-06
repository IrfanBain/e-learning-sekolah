"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/authContext'; 
import { db } from '@/lib/firebaseConfig'; 
import { doc, getDoc, collection, query, where, getDocs, DocumentReference } from 'firebase/firestore'; 

import Announcements from "@/components/Announcements"; 
import DynamicEventCalendar from "@/components/EventCalendar"; 
import { 
    Book, 
    Calculator, 
    Globe, 
    Users, 
    Palette, 
    FlaskConical, 
    Clock, 
    User, 
    CalendarDays 
} from 'lucide-react';


interface StudentData {
    nama_lengkap: string;
    kelas_ref: DocumentReference | null; 
}
interface ScheduleDoc {
    id: string;
    hari: string; 
    jam_mulai: string; 
    jam_selesai: string; 
    mapel_ref: DocumentReference; 
    guru_ref: DocumentReference; 
}
interface CombinedSchedule {
    id: string;
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
    mapelNama: string;
    guruNama: string;
    mapelIcon: React.ReactNode;
}
type GroupedSchedules = {
    [key: string]: CombinedSchedule[];
};

const HARI_URUT = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const getHariIni = () => {
    const hariIndex = new Date().getDay(); 
    const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return namaHari[hariIndex] || "Senin"; 
};

const getSubjectIcon = (subjectName: string): React.ReactNode => {
    if (!subjectName) return <Book className="w-6 h-6 text-gray-500" />;
    const name = subjectName.toLowerCase();
    if (name.includes('matematika')) return <Calculator className="w-6 h-6 text-red-500" />;
    if (name.includes('biologi')) return <FlaskConical className="w-6 h-6 text-green-500" />;
    if (name.includes('fisika')) return <FlaskConical className="w-6 h-6 text-blue-500" />;
    if (name.includes('kimia')) return <FlaskConical className="w-6 h-6 text-yellow-500" />;
    if (name.includes('ips')) return <Globe className="w-6 h-6 text-orange-500" />;
    if (name.includes('pkn') || name.includes('ppkn')) return <Users className="w-6 h-6 text-purple-500" />;
    if (name.includes('seni')) return <Palette className="w-6 h-6 text-pink-500" />;
    return <Book className="w-6 h-6 text-gray-500" />;
};


const StudentPage = () => {
    const { user, loading: authLoading } = useAuth(); 
    const [studentName, setStudentName] = useState<string>("Siswa");
    const [className, setClassName] = useState<string>("Memuat...");
    const [groupedSchedules, setGroupedSchedules] = useState<GroupedSchedules>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<string>(getHariIni());

    useEffect(() => {
        if (authLoading || !user) return; 

        const fetchScheduleData = async () => {
            setLoading(true);
            setError(null);

            try {
                const studentDocRef = doc(db, "students", user.uid);
                const studentSnap = await getDoc(studentDocRef);
                if (!studentSnap.exists()) {
                    throw new Error("Data siswa tidak ditemukan. Pastikan Anda login dengan akun siswa.");
                }
                
                const studentData = studentSnap.data() as StudentData;
                setStudentName(studentData.nama_lengkap || "Siswa");
                
                if (!studentData.kelas_ref) {
                    throw new Error("Siswa tidak terdaftar di kelas manapun.");
                }

                const classSnap = await getDoc(studentData.kelas_ref);
                setClassName(classSnap.exists() ? classSnap.data()?.nama_kelas : "Kelas Tidak Ditemukan");

                const schedulesQuery = query(
                    collection(db, "schedules"),
                    where("kelas_ref", "==", studentData.kelas_ref)
                );
                const scheduleSnapshot = await getDocs(schedulesQuery);
                
                if (scheduleSnapshot.empty) {
                    setGroupedSchedules({}); 
                    setLoading(false);
                    return;
                }
                
                const scheduleDocs = scheduleSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleDoc));
                
                const mapelRefs = Array.from(new Set(scheduleDocs.map(s => s.mapel_ref).filter(ref => ref)));
                const guruRefs = Array.from(new Set(scheduleDocs.map(s => s.guru_ref).filter(ref => ref)));

                const mapelDocs = mapelRefs.length > 0 ? await Promise.all(mapelRefs.map(ref => getDoc(ref))) : [];
                const guruDocs = guruRefs.length > 0 ? await Promise.all(guruRefs.map(ref => getDoc(ref))) : [];

                const mapelMap = new Map(mapelDocs.map(d => [d.id, d.data()?.nama_mapel || "N/A"]));
                const guruMap = new Map(guruDocs.map(d => [d.id, d.data()?.nama_lengkap || "N/A"]));
                
                const combinedSchedules: CombinedSchedule[] = scheduleDocs.map(sch => {
                    const mapelNama = mapelMap.get(sch.mapel_ref?.id) || "Mapel?";
                    const guruNama = guruMap.get(sch.guru_ref?.id) || "Guru?";
                    return {
                        id: sch.id,
                        hari: sch.hari,
                        jam_mulai: sch.jam_mulai,
                        jam_selesai: sch.jam_selesai,
                        mapelNama: mapelNama,
                        guruNama: guruNama,
                        mapelIcon: getSubjectIcon(mapelNama),
                    };
                });

                const grouped = HARI_URUT.reduce((acc, hari) => {
                    acc[hari] = combinedSchedules
                        .filter(s => s.hari === hari)
                        .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai)); 
                    return acc;
                }, {} as GroupedSchedules);

                setGroupedSchedules(grouped);

            } catch (err: any) {
                console.error("Error fetching schedule data:", err);
                setError(err.message || "Gagal memuat data jadwal."); 
                if (err.code === 'permission-denied') {
                    setError("Gagal memuat jadwal: Periksa aturan keamanan (Security Rules) Firestore Anda.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchScheduleData();
    }, [user, authLoading]); 

    const schedulesForSelectedDay = useMemo(() => {
        return groupedSchedules[selectedDay] || [];
    }, [groupedSchedules, selectedDay]);

    return (
        <div className="p-4 flex gap-4 flex-col lg:flex-row bg-gray-50 min-h-screen font-sans">
            
            <div className="w-full lg:w-2/3">
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
                    
                    <div className="mb-4">
                        <h1 className="text-xl font-semibold text-gray-900">Jadwal Pelajaran</h1>
                        <p className="text-sm text-gray-600">
                            Kelas: <span className="font-medium text-blue-600">{className}</span>
                        </p>
                    </div>

                    <nav className="flex border-b border-gray-200 overflow-x-auto mb-4">
                        {HARI_URUT.map(hari => {
                            const isHariIni = getHariIni() === hari;
                            return (
                                <button
                                    key={hari}
                                    onClick={() => setSelectedDay(hari)}
                                    className={`
                                        py-3 px-4 sm:px-5 font-medium text-sm sm:text-base whitespace-nowrap transition-all duration-200
                                        ${selectedDay === hari 
                                            ? 'border-b-4 border-blue-600 text-blue-600' 
                                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-b-4 border-transparent'
                                        }
                                        ${isHariIni && selectedDay !== hari ? 'font-bold text-blue-700 bg-blue-50' : ''}
                                    `}
                                >
                                    {hari} {isHariIni && "(Hari Ini)"}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="min-h-[300px] relative">
                        {error && <ErrorMessage message={error} />}
                        
                        {!error && loading && <LoadingSpinner isFullScreen={false} />}
                        
                        {!error && !loading && schedulesForSelectedDay.length === 0 && (
                            <NoScheduleMessage day={selectedDay} />
                        )}

                        {!error && !loading && schedulesForSelectedDay.length > 0 && (
                            <div className="space-y-4">
                                {schedulesForSelectedDay.map(schedule => (
                                    <ScheduleCard key={schedule.id} schedule={schedule} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-1/3 flex flex-col gap-4">
                <DynamicEventCalendar /> 
                <Announcements />
            </div>
        </div>
    );
};

const ScheduleCard = ({ schedule }: { schedule: CombinedSchedule }) => (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <div className="flex">
            <div className="w-24 sm:w-28 flex flex-col items-center justify-center bg-gray-50/50 p-4 border-r border-gray-200">
                {schedule.mapelIcon}
                <p className="text-lg sm:text-xl font-bold text-blue-600 mt-2">
                    {schedule.jam_mulai}
                </p>
                <p className="text-xs text-gray-500">s/d {schedule.jam_selesai}</p>
            </div>
            
            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                    {schedule.mapelNama}
                </h3>
                <div className="flex items-center text-gray-600 mt-1">
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm sm:text-base">{schedule.guruNama}</span>
                </div>
            </div>
        </div>
    </div>
);

const LoadingSpinner = ({ isFullScreen = false }: { isFullScreen?: boolean }) => {
    const wrapperClass = isFullScreen
        ? "absolute inset-0 flex items-center justify-center bg-white/50"
        : "flex items-center justify-center h-60";

    return (
        <div className={wrapperClass}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Memuat jadwal...</p>
        </div>
    );
};

const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-60 bg-red-50 text-red-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold">Oops! Terjadi Kesalahan</h3>
        <p className="text-center mt-2">{message}</p>
    </div>
);

const NoScheduleMessage = ({ day }: { day: string }) => (
    <div className="flex flex-col items-center justify-center h-60 text-gray-500 p-6">
        <CalendarDays className="w-16 h-16 text-gray-300" />
        <h3 className="text-xl font-semibold mt-4">Tidak Ada Jadwal</h3>
        <p className="text-center">Tidak ada jadwal pelajaran untuk hari {day}.</p>
    </div>
);

export default StudentPage;


