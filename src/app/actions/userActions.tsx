
"use server"; 

import * as admin from "firebase-admin";
import { adminAuth, adminDb } from "@/lib/firebaseAdminConfig"; 
import { revalidatePath } from "next/cache"; 

interface UserFormData {
  uid: string; 
  name: string;
  username: string; 
  email: string;
  password?: string;
  role: 'student' | 'teacher' | 'admin';
}

interface ActionResult {
  success: boolean;
  message: string;
}

export async function createUserAction(formData: UserFormData): Promise<ActionResult> {
  const { name, username, email, password, role } = formData;

  try {
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: name,
      disabled: false, 
    });
    
    const uid = userRecord.uid;

    await adminDb.collection("users").doc(uid).set({
      name: name,
      username: username,
      email: email,
      role: role,
      createdAt: new Date().toISOString(), 
    });
    revalidatePath("/admin/users"); 
    
    return { success: true, message: "Pengguna berhasil dibuat." };

  } catch (error: any) {
    console.error("Error creating user:", error);
    
    if (error.code === 'auth/email-already-exists') {
      return { success: false, message: "Email ini sudah terdaftar." };
    }
    if (error.code === 'auth/invalid-password') {
      return { success: false, message: "Password terlalu lemah (minimal 6 karakter)." };
    }
    
    return { success: false, message: "Terjadi kesalahan: " + error.message };
  }
}

export async function updateUserAction(formData: UserFormData): Promise<ActionResult> {
  const { uid, name, username, email, role, password } = formData;

  try {
    const authUpdatePayload: admin.auth.UpdateRequest = {
      email: email,
      displayName: name,
    };
    
    if (password && password.length >= 6) {
      authUpdatePayload.password = password;
    }
    
    await adminAuth.updateUser(uid, authUpdatePayload);

    const dbUpdatePayload = {
      name: name,
      username: username,
      email: email,
      role: role,
    };
    
    await adminDb.collection("users").doc(uid).update(dbUpdatePayload);

    revalidatePath("/admin/users"); 
    
    return { success: true, message: "Pengguna berhasil diupdate." };

  } catch (error: any) {
    console.error("Error updating user:", error);
    
    if (error.code === 'auth/email-already-exists') {
      return { success: false, message: "Email ini sudah terdaftar." };
    }
    
    return { success: false, message: "Terjadi kesalahan: " + error.message };
  }
}

export async function deleteUserAction(uid: string): Promise<ActionResult> {
  
  try {
  
    await adminAuth.deleteUser(uid);

    await adminDb.collection("users").doc(uid).delete();

    revalidatePath("/admin/users"); 

    return { success: true, message: "Pengguna berhasil dihapus." };

  } catch (error: any) {
    console.error("Error deleting user:", error);

    if (error.code === 'auth/user-not-found') {
      return { success: false, message: "Gagal: Pengguna tidak ditemukan di Autentikasi." };
    }
    
    return { success: false, message: "Terjadi kesalahan: " + error.message };
  }
}