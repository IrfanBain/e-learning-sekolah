"use server";

import * as admin from 'firebase-admin';
import { adminDb } from "@/lib/firebaseAdminConfig";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface SubjectFormData {
  nama_pendek: string;     
  nama_mapel: string;     
  kelompok: string;       
  kkm: number;            
  urutan: number;
  tingkat: string[];
}

export interface SubjectUpdateFormData extends Omit<SubjectFormData, 'nama_pendek'> {  id: string; }

export async function createSubjectAction(formData: SubjectFormData): Promise<ActionResult> {

  const { nama_pendek, nama_mapel, kelompok, kkm, urutan, tingkat } = formData;

  if (!nama_pendek || !nama_mapel || !kelompok || kkm === undefined || kkm === null || urutan === undefined || urutan === null || !tingkat || tingkat.length === 0) {
    return { success: false, message: "Semua field (kecuali deskripsi) wajib diisi." };
  }
  if (isNaN(kkm) || kkm < 0 || kkm > 100) { return { success: false, message: "KKM harus angka 0-100." }; }
  if (isNaN(urutan)) { return { success: false, message: "Urutan harus berupa angka." }; }
  if (!Array.isArray(tingkat) || tingkat.some(t => typeof t !== 'string')) { return { success: false, message: "Tingkat harus berupa kumpulan string." }; }

  const docId = nama_pendek.trim().toUpperCase().replace(/\s+/g, ''); 
  if (!docId) { return { success: false, message: "Nama Pendek tidak valid." }; }

  const subjectDocRef = adminDb.collection("subjects").doc(docId); 

  try {
    const docSnap = await subjectDocRef.get();
    if (docSnap.exists) { throw new Error(`Mata Pelajaran dengan nama pendek '${docId}' sudah ada.`); }

    const subjectData = {
      nama_pendek: docId, 
      nama_mapel: nama_mapel.trim(),
      kelompok: kelompok.trim(),
      kkm: Number(kkm),
      urutan: Number(urutan),
      tingkat: tingkat.sort(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await subjectDocRef.set(subjectData);

    revalidatePath("/list/subjects"); 

    return { success: true, message: `Mata Pelajaran ${nama_mapel} (${docId}) berhasil dibuat.` };

  } catch (error: any) {
    console.error("Error creating subject:", error);
    return { success: false, message: `Gagal membuat Mata Pelajaran: ${error.message}` };
  }
}

export async function updateSubjectAction(formData: SubjectUpdateFormData): Promise<ActionResult> {
  const { id, nama_mapel, kelompok, kkm, urutan, tingkat } = formData;

  if (!id || !String(id).trim()) {
    return { success: false, message: "ID Mata Pelajaran tidak valid." };
  }

  if (!nama_mapel || !kelompok || kkm === undefined || kkm === null || urutan === undefined || urutan === null || !tingkat || tingkat.length === 0) {
    return { success: false, message: "Semua field wajib diisi." };
  }
  if (isNaN(Number(kkm)) || Number(kkm) < 0 || Number(kkm) > 100) {
    return { success: false, message: "KKM harus angka 0-100." };
  }
  if (isNaN(Number(urutan))) {
    return { success: false, message: "Urutan harus berupa angka." };
  }
  if (!Array.isArray(tingkat) || tingkat.some(t => typeof t !== 'string')) {
    return { success: false, message: "Tingkat harus berupa kumpulan string." };
  }

  const docId = String(id).trim().toUpperCase().replace(/\s+/g, '');
  if (!docId) {
    return { success: false, message: "ID Mata Pelajaran tidak valid setelah pemrosesan." };
  }

  const subjectDocRef = adminDb.collection("subjects").doc(docId);

  try {
    const docSnap = await subjectDocRef.get();
    if (!docSnap.exists) {
      return { success: false, message: `Mata Pelajaran dengan ID '${docId}' tidak ditemukan.` };
    }

    const subjectDataToUpdate = {
      nama_mapel: nama_mapel.trim(),
      kelompok: kelompok.trim(),
      kkm: Number(kkm),
      urutan: Number(urutan),
      tingkat: tingkat.sort(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await subjectDocRef.update(subjectDataToUpdate);

    revalidatePath("/list/subjects"); 
    revalidatePath(`/list/subjects/${docId}`); 
    revalidatePath(`/list/subjects/edit/${docId}`); 

    return { success: true, message: `Data Mata Pelajaran ${nama_mapel} (${docId}) berhasil diupdate.` };

  } catch (error: any) {
    console.error("Error updating subject:", error);
    return { success: false, message: `Gagal mengupdate Mata Pelajaran: ${error.message}` };
  }
}

export async function deleteSubjectAction(id: string): Promise<ActionResult> {
   if (!id) {  }
   const subjectDocRef = adminDb.collection("subjects").doc(id);
   try {
     await subjectDocRef.delete();
     revalidatePath("/list/subjects"); 
     return { success: true, message: `Mata Pelajaran (${id}) berhasil dihapus.` };
   } catch (error: any) {
    console.error("Error deleting teacher:", error);
    return { success: false, message: "Terjadi kesalahan: " + error.message };
}
}

