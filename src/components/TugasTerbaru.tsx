"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig"; 

interface Tugas {
  id: string;
  judul: string; 
  tanggal_dibuat?: string;
}

const TugasTerbaru = () => {
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTugas = async () => {
      try {
        const homeworkCol = collection(db, "homework");
        const q = query(
          homeworkCol,
          orderBy("tanggal_dibuat", "desc"), 
          limit(3) 
        );

        const snapshot = await getDocs(q);
        const tugasList: Tugas[] = snapshot.docs.map(doc => ({
          id: doc.id,
          judul: doc.data().judul || "Tanpa Judul",
          tanggal_dibuat: doc.data().tanggal_dibuat?.toDate().toLocaleDateString("id-ID") 
        }));
        
        setTugas(tugasList);
      } catch (error) {
        console.error("Error fetching homework: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTugas();
  }, []);

  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow">Memuat tugas...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Tugas PR Baru Ditambahkan</h2>
      </div>
      
      <div className="space-y-3">
        {tugas.length > 0 ? (
          tugas.map((item) => (
            <div key={item.id} className="p-3 bg-blue-100 rounded-lg">
              <h3 className="font-semibold text-blue-800">{item.judul}</h3>
              {item.tanggal_dibuat && (
                <p className="text-sm text-gray-600">
                  Dibuat: {item.tanggal_dibuat}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">Belum ada tugas baru.</p>
        )}
      </div>
    </div>
  );
};

export default TugasTerbaru;