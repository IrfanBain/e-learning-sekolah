"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { updateUserAction } from '@/app/actions/userActions';

interface UserData {
  id: string; 
  name: string;
  email: string;
  username: string;
  password?: string;
  role: 'admin' | 'teacher' | 'student';
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void; 
  user: UserData | null; 
}

export default function EditUserModal({ isOpen, onClose, onUserUpdated, user }: EditUserModalProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState(''); 
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setUsername(user.username);
      setEmail(user.email);
      setRole(user.role);
      setPassword(''); 
      setError(null);
    }
  }, [user]); 

  if (!isOpen || !user) {
    return null;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
   const result = await updateUserAction({
      uid: user.id, 
      name,
      username,
      email,
      role,
      password: password || undefined 
    });
    
    setLoading(false);

    if (result.success) {
      toast.success(result.message); 
      onUserUpdated(); 
    } else {
      setError(result.message); 
    }
    
    setLoading(false);
    onUserUpdated(); 
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-xl font-semibold">Edit Pengguna: {user.name}</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600" disabled={loading}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          
          <div>
            <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700">NISN / NIP</label>
            <input
              type="text"
              id="edit-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          
          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="edit-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700">Password Baru (Opsional)</label>
            <input
              type="password"
              id="edit-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Biarkan kosong jika tidak ingin ganti"
              minLength={6}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          
          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">Role</label>
            <select
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'student' | 'teacher' | 'admin')}
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="student">Siswa</option>
              <option value="teacher">Guru</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Update'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}