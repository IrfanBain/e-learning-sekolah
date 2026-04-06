"use client"

import Image from "next/image"
import { useAuth } from '@/context/authContext';
import React, { useState, useEffect } from "react"; 
import { db } from "@/lib/firebaseConfig"; 
import { type User as AuthUser } from 'firebase/auth'; 
import {
    collection,
    query,
    doc,
    getDoc,
    Timestamp,
    orderBy,
    onSnapshot, 
    QuerySnapshot,
    DocumentData,
    where, 
    QueryConstraint,
    limit 
} from 'firebase/firestore';
import { Loader2, Megaphone } from "lucide-react"; 
import Link from "next/link"; 


interface AnnouncementDoc {
    id: string;
    judul: string;
    isi: string;
    tanggal_dibuat: Timestamp;
    target_audiens: "Semua" | "Siswa" | "Guru";
}

const Announcements = () => {
  const { user, loading: authLoading } = useAuth() as { user: AuthUser | null, loading: boolean };
  
  const [announcements, setAnnouncements] = useState<AnnouncementDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"student" | "teacher" | "admin" | null>(null);

  useEffect(() => {
    if (user?.uid && !authLoading) {
      const fetchUserData = async () => {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const role = userData.role; 
            
            if (role === 'admin') setUserRole("admin");
            else if (role === 'teacher') setUserRole("teacher");
            else if (role === 'student') setUserRole("student");
            else setUserRole(null); 

          } else {
            const teacherDocRef = doc(db, "teachers", user.uid);
            const teacherDocSnap = await getDoc(teacherDocRef);
            if (teacherDocSnap.exists()) {
                 setUserRole("teacher");
            } else {
                 const studentDocRef = doc(db, "students", user.uid);
                 const studentDocSnap = await getDoc(studentDocRef);
                 if (studentDocSnap.exists()) {
                     setUserRole("student");
                 } else {
                     console.error("Data profil tidak ditemukan.");
                 }
            }
          }
        } catch (err: any) {
            console.error("Gagal mengambil data user:", err);
        }
      };
      fetchUserData();
    }
    if (!user && !authLoading) {
        setLoading(false); 
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!userRole || authLoading) {
        if (!authLoading) setLoading(false);
        return;
    }

    setLoading(true);

    const queryConstraints: QueryConstraint[] = [];

    if (userRole === 'admin') {
    } else if (userRole === 'teacher') {
        queryConstraints.push(where("target_audiens", "in", ["Semua", "Guru"]));
    } else if (userRole === 'student') {
        queryConstraints.push(where("target_audiens", "in", ["Semua", "Siswa"]));
    }

    queryConstraints.push(orderBy("tanggal_dibuat", "desc"));
    queryConstraints.push(limit(3)); 

    const q = query(
        collection(db, "announcements"),
        ...queryConstraints
    );

    const unsubscribe = onSnapshot(q, 
        (querySnapshot: QuerySnapshot) => {
            const announcementsData: AnnouncementDoc[] = [];
            querySnapshot.forEach((doc) => {
                announcementsData.push({ id: doc.id, ...doc.data() } as AnnouncementDoc);
            });
            
            setAnnouncements(announcementsData);
            setLoading(false);
        }, 
        (err: any) => {
            console.error("Error listening to announcements:", err);
            setLoading(false);
        }
    );

    return () => unsubscribe();
  }, [userRole, authLoading]);

  const colorClasses = [
    'bg-blue-100 text-blue-800', 
    'bg-purple-100 text-purple-800', 
    'bg-yellow-100 text-yellow-800' 
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pengumuman</h1>
        <Link href="/list/announcements" className="text-xs text-blue-600 hover:underline">
            Lihat Semua
        </Link>
      </div>
      <div className="flex flex-col gap-3 mt-4">
        
        {loading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        ) : announcements.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-40 text-gray-500">
                <Megaphone className="w-10 h-10 text-gray-300" />
                <p className="mt-2 text-sm font-medium">Belum ada pengumuman.</p>
            </div>
        ) : (
            announcements.map((item, index) => (
                <div 
                    key={item.id} 
                    className={`rounded-md p-4 ${colorClasses[index % colorClasses.length]}`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">{item.judul}</h2>
                    <span className="text-xs text-gray-500 bg-white/70 rounded-md px-1.5 py-0.5">
                      {item.tanggal_dibuat?.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) || 'Baru'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {item.isi}
                  </p>
                </div>
            ))
        )}
        
      </div>
    </div>
  );
};

export default Announcements;
