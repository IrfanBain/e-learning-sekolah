"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; 
import Link from 'next/link';
import Image from 'next/image';
import { 
  FiArrowLeft, 
  FiTrash2, 
  FiArchive, 
  FiCornerUpLeft 
} from 'react-icons/fi';

interface InboxMessage {
  id: string;
  sender: {
    name: string;
    avatar: string;
  };
  subject: string;
  snippet: string; 
  body: string;
  timestamp: string;
  isRead: boolean;
}

const dummyMessages: InboxMessage[] = [
  {
    id: "1",
    sender: { name: "Siti Aminah (Wali Kelas)", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3" },
    subject: "Peringatan Absensi",
    snippet: "Selamat pagi, Budi. Saya lihat absensi kamu...",
    body: "Selamat pagi, Budi. \n\nSaya lihat absensi kamu kemarin (Selasa, 21 Okt) Alfa, ada apa ya? Mohon segera konfirmasi ke saya atau bagian tata usaha agar bisa segera ditindaklanjuti.\n\nTerima kasih,\nSiti Aminah, S.Pd.",
    timestamp: "10:30 AM",
    isRead: false,
  },
  {
    id: "2",
    sender: { name: "Admin Sistem", avatar: "/logo.png" },
    subject: "Pembaruan Sistem E-Learning",
    snippet: "Pembaruan sistem akan dilaksanakan pada...",
    body: "Pembaruan sistem akan dilaksanakan pada hari Sabtu pukul 10.00. Sistem mungkin akan nonaktif selama 30 menit. Mohon maaf atas ketidaknyamanannya.",
    timestamp: "Kemarin",
    isRead: true, 
  },
  {
    id: "3",
    sender: { name: "Agus Wijaya (Guru Fisika)", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3" },
    subject: "Tugas Susulan Bab 3",
    snippet: "Bagi yang belum mengumpulkan tugas Bab 3...",
    body: "Bagi yang belum mengumpulkan tugas Bab 3, harap segera dikumpulkan di meja saya paling lambat hari Jumat. Terima kasih.",
    timestamp: "20 Okt 2025",
    isRead: true,
  },
];


export default function MessageDetailPage() {
  const params = useParams();
  const messageId = params.id as string; 

  const [message, setMessage] = useState<InboxMessage | null>(null);

  useEffect(() => {
    if (messageId) {
      const foundMessage = dummyMessages.find(msg => msg.id === messageId);
      setMessage(foundMessage || null);
    }
  }, [messageId]); 

  if (!message) {
    return (
      <div className="p-8 text-center">
        <p>Mencari pesan...</p>
        <Link href="/dashboard/messages" className="text-blue-600 hover:underline">
          Kembali ke Kotak Masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      
      <Link 
        href="/list/messages"
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
      >
        <FiArrowLeft />
        <span>Kembali ke Kotak Masuk</span>
      </Link>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{message.subject}</h2>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Image
              src="/setProfile.png"
              alt={message.sender.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-800">{message.sender.name}</p>
              <p className="text-sm text-gray-500">Kepada: Saya (Budi Santoso)</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2 md:mt-0">{message.timestamp}</p>
        </div>
        
        <div className="p-4 flex gap-2 border-b border-gray-200 bg-gray-50">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              <FiCornerUpLeft className="w-4 h-4" />
              <span>Balas</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <FiArchive className="w-4 h-4" />
              <span>Arsipkan</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
              <FiTrash2 className="w-4 h-4" />
              <span>Hapus</span>
            </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="text-gray-800 leading-relaxed whitespace-pre-line">
            {message.body}
          </div>
        </div>

      </div>
    </div>
  );
}