"use server";

import * as admin from 'firebase-admin';
import { adminDb } from "@/lib/firebaseAdminConfig"; 
import { revalidatePath } from "next/cache";

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface ScheduleFormData {
  hari: string;           
  jam_mulai: string;      
  jam_selesai: string;    
  kelas_id: string;       
  mapel_id: string;       
  guru_id: string;        
  tahun_ajaran: string; 
  jumlah_jam_pelajaran: number;
  ruangan?: string;   
}

export interface ScheduleUpdateFormData extends ScheduleFormData {
  id: string; 
}

export async function createScheduleAction(formData: ScheduleFormData): Promise<ActionResult> {

  const {
    hari, jam_mulai, jam_selesai, kelas_id, mapel_id, guru_id,
    tahun_ajaran, jumlah_jam_pelajaran, ruangan
  } = formData;

 
  if (!hari || !jam_mulai || !jam_selesai || !kelas_id || !mapel_id || !guru_id || !tahun_ajaran || jumlah_jam_pelajaran === undefined || jumlah_jam_pelajaran === null) {
    return { success: false, message: "Semua field (kecuali ruangan) wajib diisi." };
  }
  
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(jam_mulai) || !timeRegex.test(jam_selesai)) {
      return { success: false, message: "Format jam mulai/selesai harus HH:MM (contoh: 07:00)." };
  }
  
  if (jam_selesai <= jam_mulai) {
      return { success: false, message: "Jam selesai harus setelah jam mulai." };
  }
   
  if (isNaN(jumlah_jam_pelajaran) || jumlah_jam_pelajaran <= 0) {
      return { success: false, message: "Jumlah Jam Pelajaran harus angka positif." };
  }
   
   if (!/^\d{4}\/\d{4}$/.test(tahun_ajaran)) {
       return { success: false, message: "Format Tahun Ajaran harus YYYY/YYYY." };
   }


  try {
   
    const classRef = adminDb.collection("classes").doc(kelas_id);
    const subjectRef = adminDb.collection("subjects").doc(mapel_id);
    const teacherRef = adminDb.collection("teachers").doc(guru_id);
    
    const classSnap = await classRef.get();
    const subjectSnap = await subjectRef.get();
    const teacherSnap = await teacherRef.get();
    if (!classSnap.exists) throw new Error(`Kelas dengan ID '${kelas_id}' tidak ditemukan.`);
    if (!subjectSnap.exists) throw new Error(`Mata Pelajaran dengan ID '${mapel_id}' tidak ditemukan.`);
    if (!teacherSnap.exists) throw new Error(`Guru dengan ID '${guru_id}' tidak ditemukan.`);
    
    const conflictQuery = adminDb.collection("schedules")
                            .where('kelas_ref', '==', classRef)
                            .where('hari', '==', hari)
                            .where('jam_mulai', '==', jam_mulai);
    const conflictSnap = await conflictQuery.get();
    if (!conflictSnap.empty) {
       
        const conflictingDoc = conflictSnap.docs[0];
        const conflictMapelRef = conflictingDoc.data().mapel_ref as admin.firestore.DocumentReference;
        throw new Error(`Sudah ada jadwal lain (${conflictMapelRef.id}) di kelas ini pada hari dan jam mulai yang sama.`);
    }

    const scheduleData = {
      hari,
      jam_mulai,
      jam_selesai,
      kelas_ref: classRef,    
      mapel_ref: subjectRef,   
      guru_ref: teacherRef,    
      tahun_ajaran,
      jumlah_jam_pelajaran: Number(jumlah_jam_pelajaran), 
      ruangan: ruangan?.trim() || null, 
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    
    await adminDb.collection("schedules").add(scheduleData); 

    revalidatePath("/list/schedules"); 

    return { success: true, message: `Jadwal berhasil ditambahkan.` };

  } catch (error: any) {
    console.error("Error creating schedule:", error);
   
    if (error.message.includes('tidak ditemukan')) {
        return { success: false, message: `Gagal: ${error.message}` };
    }
    if (error.message.includes('Sudah ada jadwal lain')) {
         return { success: false, message: `Gagal: ${error.message}` };
    }
    return { success: false, message: `Gagal menambahkan jadwal: Terjadi kesalahan server.` };
  }
}

export async function updateScheduleAction(formData: ScheduleUpdateFormData): Promise<ActionResult> {
   const {
    id, hari, jam_mulai, jam_selesai, kelas_id, mapel_id, guru_id,
    tahun_ajaran, jumlah_jam_pelajaran, ruangan
   } = formData;

   if (!id) { return { success: false, message: "ID Jadwal tidak ditemukan." }; }
  
    if (!hari || !jam_mulai || !jam_selesai || !kelas_id || !mapel_id || !guru_id || !tahun_ajaran || jumlah_jam_pelajaran === undefined || jumlah_jam_pelajaran === null) { }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(jam_mulai) || !timeRegex.test(jam_selesai)) { }
    if (jam_selesai <= jam_mulai) { }
    if (isNaN(jumlah_jam_pelajaran) || jumlah_jam_pelajaran <= 0) { }
    if (!/^\d{4}\/\d{4}$/.test(tahun_ajaran)) { }


   const scheduleDocRef = adminDb.collection("schedules").doc(id);

   try {
     
     const classRef = adminDb.collection("classes").doc(kelas_id);
     const subjectRef = adminDb.collection("subjects").doc(mapel_id);
     const teacherRef = adminDb.collection("teachers").doc(guru_id);

     const scheduleDataToUpdate = {
        hari,
        jam_mulai,
        jam_selesai,
        kelas_ref: classRef,
        mapel_ref: subjectRef,
        guru_ref: teacherRef,
        tahun_ajaran,
        jumlah_jam_pelajaran: Number(jumlah_jam_pelajaran),
        ruangan: ruangan?.trim() || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
     };

     await scheduleDocRef.update(scheduleDataToUpdate);

     revalidatePath("/list/schedules"); 
     revalidatePath(`/list/schedules/${id}`); 
     revalidatePath(`/list/schedules/${id}/edit`); 

     return { success: true, message: `Jadwal ${id} berhasil diupdate.` };

   } catch (error: any) {
     console.error("Error updating schedule:", error);
     return { success: false, message: `Gagal mengupdate jadwal: ${error.message}` };
   }
}

export async function deleteScheduleAction(id: string): Promise<ActionResult> {
   if (!id) { return { success: false, message: "ID Jadwal tidak ditemukan." }; }
   const scheduleDocRef = adminDb.collection("schedules").doc(id);
   try {
     await scheduleDocRef.delete();
     revalidatePath("/list/schedules"); 
     return { success: true, message: `Jadwal ${id} berhasil dihapus.` };
   } catch (error: any) {
     console.error("Error deleting schedule:", error);
     return { success: false, message: `Gagal menghapus jadwal: ${error.message}` };
   }
}

