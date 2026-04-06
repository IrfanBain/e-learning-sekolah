"use client"; 

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { FaGear, FaBookOpen, FaChalkboardUser, FaChartLine, FaUser, FaUserLock, FaEye, FaEyeSlash } from 'react-icons/fa6';
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, doc, getDoc, getDocs } from "firebase/firestore";
import { getClientAuth, db } from '@/lib/firebaseConfig';

interface UserData {
  username: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  name: string;
}

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const findEmailByUsername = async (inputUsername: string): Promise<string | null> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", inputUsername));
    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        return userData.email as string;
      }
    } catch (firestoreError) {
      console.error("Error querying Firestore:", firestoreError);
      setError("Gagal menghubungi database.");
    }
    return null;
  };
const getUserDataFromFirestore = async (uid: string): Promise<UserData | null> => {
  const userDocRef = doc(db, "users", uid);
  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    } else {
      console.error("No user data found in Firestore for UID:", uid);
      return null; 
    }
  } catch (firestoreError) {
    console.error("Error getting user data from Firestore:", firestoreError);
    return null;
  }
};

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const emailInternal = await findEmailByUsername(username);
      const auth = getClientAuth();

      if (!emailInternal) {
        setError('NISN/NIP atau Password salah.');
        setLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailInternal, password);

      const user = userCredential.user;
    if (user) {
      const userData = await getUserDataFromFirestore(user.uid);

      if (userData) {
        switch (userData.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'teacher':
            router.push('/teacher'); 
            break;
          case 'student':
            router.push('/student'); 
            break;
          default:
            console.warn("Role tidak dikenal:", userData.role);
            router.push('/'); 
        }
      } else {
         setError("Login berhasil, tapi data profil tidak ditemukan di database.");
      }
    }

    } catch (authError: any) {
    console.error("Error login:", authError);
     if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password' || authError.code === 'auth/user-not-found') {
       setError('NISN/NIP atau Password salah.');
     } else {
       setError('Terjadi kesalahan saat login.');
     }
  } finally {
    setLoading(false);
  }

  };

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      <div
        className="absolute inset-0 z-0 blur-xs scale-105"
        style={{
          backgroundImage: "url(/media.png)",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 z-10 bg-black/30"></div>
      <div className="relative z-20 min-h-screen w-full flex items-center justify-center
                   p-4 sm:p-6 md:p-8 overflow-y-auto">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">

          <div className="w-full max-w-sm mx-auto lg:order-last pt-6 lg:pt-0">

            <div className="backdrop-blur-lg bg-white/90 py-6 px-4 sm:px-6 rounded-2xl shadow-2xl w-full">
              <div className="mx-auto mb-2" style={{ width: '40px', height: '40px' }}>
                <Image
                  src="/logo.png"
                  alt="Logo E-Learning" 
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6 text-center text-gray-800">Login</h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className='relative flex items-center'>
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" 
                    id="username" 
                    placeholder="NISN / NIP" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-md border-gray-300 border text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                 <div className='relative flex items-center'>
                  <FaUserLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2 bg-gray-100 rounded-md border-gray-300 border text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="pt-2">
                    <button
                      type="submit" 
                      disabled={loading} 
                      className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Memproses...' : 'Login'} 
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
              </form>
            </div>
          </div>

          <div className="space-y-6 lg:space-y-8 pr-0 lg:pr-8 pb-10 lg:pb-0">
            <div className="backdrop-blur-lg bg-white/90 p-6 rounded-2xl shadow-2xl w-full">
              <h1 className="text-2xl sm:text-3xl font-bold text-green-600 mb-6">Sistem Pembelajaran Online MTs Al-Khairiyah</h1>
              <div className="space-y-5 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FaGear className="text-lg text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">Pembelajaran Adaptif</h3>
                    <p className="text-gray-700 text-xs">
                      Sistem menyesuaikan Materi dan kecepatan belajar dengan kemampuan unik setiap siswa.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FaChalkboardUser className="text-lg text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">Bimbingan Guru Online</h3>
                    <p className="text-gray-700 text-xs">
                      Sesi tanya jawab, forum diskusi, dan bimbingan langsung dengan pengajar ahli di bidangnya.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FaChartLine className="text-lg text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">Laporan Progres Real-time</h3>
                    <p className="text-gray-700 text-xs">
                      Pantau perkembangan akademik, nilai tugas, dan pencapaian siswa secara transparan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;