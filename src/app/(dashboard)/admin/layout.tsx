"use client";

import React from 'react';
import { useAuth } from '@/context/authContext'; 
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  if (loading) {
    return (
      <div className=" flex justify-center items-center h-screen">
        <div>Memeriksa otorisasi.....</div>
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null; 
  }

  if (user.role !== 'admin') {
    console.warn("Akses ditolak: Pengguna bukan admin.");
    router.replace('/'); 
    return null; 
  }
  
  return <>{children}</>;
}