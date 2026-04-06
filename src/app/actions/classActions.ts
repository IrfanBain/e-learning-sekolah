"use server";

import * as admin from 'firebase-admin';
import { adminDb } from "@/lib/firebaseAdminConfig"; 
import { revalidatePath } from "next/cache";


export interface ClassFormData {
  nama_kelas: string;       
  tingkat: number;          
  tahun_ajaran: string;     
  wali_kelas_uid: string;   
}

export type ActionResult = {
  success: boolean;
  message: string;
};


export interface ClassUpdateFormData extends Omit<ClassFormData, 'nama_kelas'> { 
  id: string; 
}


export async function createClassAction(formData: ClassFormData): Promise<ActionResult> {

  const { nama_kelas, tingkat, tahun_ajaran, wali_kelas_uid } = formData;

 
  if (!nama_kelas || !tingkat || !tahun_ajaran || !wali_kelas_uid) {
    return { success: false, message: "Semua field wajib diisi." };
  }

  const docId = nama_kelas.trim().toUpperCase().replace(/\s+/g, '-'); 
  if (!docId) {
    return { success: false, message: "Nama Kelas tidak valid untuk dijadikan ID." };
  }

  const classDocRef = adminDb.collection("classes").doc(docId); 
  const teacherDocRef = adminDb.collection("teachers").doc(wali_kelas_uid);

  try {
    const batch = adminDb.batch();

    
    const classSnap = await classDocRef.get();
    if (classSnap.exists) { throw new Error(`Kelas dengan ID '${docId}' sudah ada.`); }
    const teacherSnap = await teacherDocRef.get();
    if (!teacherSnap.exists) { throw new Error(`Guru dengan ID '${wali_kelas_uid}' tidak ditemukan.`); }

    
    const teacherData = teacherSnap.data();
    if (teacherData && teacherData.wali_kelas_ref) {
      console.warn(`Guru ${wali_kelas_uid} sudah menjadi wali kelas ${teacherData.wali_kelas_ref}, akan ditimpa.`);
    }

    
    const classData = {
      nama_kelas: nama_kelas.trim(),
      tingkat: Number(tingkat),
      tahun_ajaran,
      wali_kelas_ref: teacherDocRef, 
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    
    batch.set(classDocRef, classData);

    
    batch.update(teacherDocRef, { wali_kelas_ref: docId }); 
    
    await batch.commit(); 

    revalidatePath("/list/classes"); 
    revalidatePath("/list/teachers"); 
    revalidatePath(`/list/teachers/${wali_kelas_uid}`); 

    return { success: true, message: `Kelas ${nama_kelas} berhasil dibuat dan ${teacherSnap.data()?.nama_lengkap || wali_kelas_uid} ditetapkan sebagai wali kelas.` };

  } catch (error: any) {
    console.error("Error creating class:", error);
    return { success: false, message: `Gagal membuat kelas: ${error.message}` };
  }
}

export async function updateClassAction(formData: ClassUpdateFormData): Promise<ActionResult> {
   const { id, tingkat, tahun_ajaran, wali_kelas_uid } = formData; 

  if (!id) { return { success: false, message: "ID Kelas tidak ditemukan." }; }
  if (!tingkat || !tahun_ajaran || !wali_kelas_uid) { return { success: false, message: "Tingkat, Tahun Ajaran, dan Wali Kelas wajib diisi." }; }

  const classDocRef = adminDb.collection("classes").doc(id);
  const newTeacherDocRef = adminDb.collection("teachers").doc(wali_kelas_uid); 

  try {
    const batch = adminDb.batch();
    const currentClassSnap = await classDocRef.get();
    if (!currentClassSnap.exists) {
        throw new Error(`Kelas dengan ID '${id}' tidak ditemukan.`);
    }
    const currentClassData = currentClassSnap.data();
    const oldWaliKelasRef = currentClassData?.wali_kelas_ref as admin.firestore.DocumentReference | null | undefined;
    const oldWaliKelasUid = oldWaliKelasRef?.id; 

    const newTeacherSnap = await newTeacherDocRef.get();
    if (!newTeacherSnap.exists) {
        throw new Error(`Guru baru dengan ID '${wali_kelas_uid}' tidak ditemukan.`);
    }

    const classDataToUpdate = {
      tingkat: Number(tingkat),
      tahun_ajaran,
      wali_kelas_ref: newTeacherDocRef, 
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

   
    batch.update(classDocRef, classDataToUpdate);

    
    if (oldWaliKelasUid !== wali_kelas_uid) {
        console.log(`Wali kelas berubah dari ${oldWaliKelasUid || 'Tidak Ada'} ke ${wali_kelas_uid}`);

        if (oldWaliKelasRef) {
            const oldTeacherSnap = await oldWaliKelasRef.get();

            if (oldTeacherSnap.exists) {
                batch.update(oldWaliKelasRef, { wali_kelas_ref: null }); 
                console.log(`Updating old teacher ${oldWaliKelasUid}: set wali_kelas_ref to null`);
            } else {
                console.warn(`Dokumen guru lama ${oldWaliKelasRef.id} tidak ditemukan. Cleanup dilewati.`);
            }
        }

        batch.update(newTeacherDocRef, { wali_kelas_ref: id }); 
        console.log(`Updating new teacher ${wali_kelas_uid}: set wali_kelas_ref to ${id}`);
        

    } else {
        console.log(`Wali kelas tidak berubah (tetap ${wali_kelas_uid})`);
    }

    await batch.commit();

    revalidatePath("/classes"); 
    revalidatePath(`/classes/${id}`); 
    revalidatePath(`/classes/${id}/edit`); 
    revalidatePath("/teachers"); 
    if (oldWaliKelasUid && oldWaliKelasUid !== wali_kelas_uid) {
        revalidatePath(`/teachers/${oldWaliKelasUid}`);
    }
    revalidatePath(`/teachers/${wali_kelas_uid}`); 

    return { success: true, message: `Data kelas ${id} berhasil diupdate.` };

   } catch (error: any) {
     console.error("Error updating class:", error);
     
    if (error.code === 5) { 
         return { success: false, message: `Error: Dokumen tidak ditemukan saat update. (Ref: ${error.message})` };
    }
     return { success: false, message: `Gagal mengupdate kelas: ${error.message}` };
   }
}

export async function deleteClassAction(id: string): Promise<ActionResult> {
   if (!id) { return { success: false, message: "ID Kelas tidak ditemukan." }; }

   const classDocRef = adminDb.collection("classes").doc(id);

   try {
     const batch = adminDb.batch();

     const currentClassSnap = await classDocRef.get();
     if (!currentClassSnap.exists) {
         console.warn(`Class ${id} not found during delete, assuming already deleted.`);
         revalidatePath("/classes");
         return { success: true, message: `Kelas ${id} sudah dihapus.` };
     }
     const currentClassData = currentClassSnap.data();
     const oldWaliKelasRef = currentClassData?.wali_kelas_ref as admin.firestore.DocumentReference | null | undefined;
     const oldWaliKelasUid = oldWaliKelasRef?.id;

     
     batch.delete(classDocRef);

     if (oldWaliKelasRef) {

        const oldTeacherSnap = await oldWaliKelasRef.get();
        if (oldTeacherSnap.exists) {

            batch.update(oldWaliKelasRef, { wali_kelas_ref: null });
            console.log(`Updating old teacher ${oldWaliKelasUid} during class delete: set wali_kelas_ref to null`);
        } else {
             console.warn(`Dokumen guru lama ${oldWaliKelasRef.id} tidak ditemukan. Cleanup dilewati.`);
        }
     }

     await batch.commit();

     revalidatePath("/classes");
     if (oldWaliKelasUid) {
         revalidatePath("/teachers"); 
         revalidatePath(`/teachers/${oldWaliKelasUid}`); 
     }

     return { success: true, message: `Kelas ${id} berhasil dihapus.` };

   } catch (error: any) {
     console.error("Error deleting class:", error);
     return { success: false, message: `Gagal menghapus kelas: ${error.message}` };
   }
}
