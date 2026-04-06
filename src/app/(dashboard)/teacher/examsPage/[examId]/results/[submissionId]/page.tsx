"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import { db } from '@/lib/firebaseConfig';
import {
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    getDoc,
    Timestamp,
    DocumentReference,
    updateDoc 
} from 'firebase/firestore';
import { 
    Loader2, 
    ArrowLeft, 
    User, 
    Check, 
    X, 
    FileText, 
    AlertTriangle, 
    Medal, 
    MessageSquare,
    Save // <-- BARU
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface ExamData {
    judul: string;
    tipe: "Pilihan Ganda" | "Esai" | "Tugas (Upload File)" | "Esai Uraian" | "PG dan Esai";
}

interface SoalData {
    id: string;
    urutan: number;
    pertanyaan: string;
    tipe_soal: "Pilihan Ganda" | "Esai" | "Esai Uraian";
    poin: number;
    opsi?: { [key: string]: string };
    kunci_jawaban?: string;
    rubrik_penilaian?: string;
    jumlah_input?: number;
}

interface SubmissionData {
    jawaban: string[]; 
    student_ref: DocumentReference;
    latihan_ref: DocumentReference;
    nilai_akhir?: number; 
    nilai_esai?: number;  
    nilai_akhir_scaled?: number;
    skor_per_soal?: EssayScoresState;
    waktu_selesai: Timestamp;
    status: string;
}

interface SummaryStats {
    correct: number;
    incorrect: number;
    essays: number;
    totalScore: number;
    maxScore: number; 
    maxScorePG: number; 
    maxScoreEsai: number; 
    finalScore: number; 
    finalScoreRaw: number; 
    finalScoreScaled: number;
}

interface StudentData {
    nama_lengkap: string;
}

type EssayScoresState = {
    [soalId: string]: number; 
};

const StudentResultPage = () => {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const submissionId = params.submissionId as string;
    const [exam, setExam] = useState<ExamData | null>(null);
    const [submission, setSubmission] = useState<SubmissionData | null>(null);
    const [studentName, setStudentName] = useState<string>("");
    const [soalList, setSoalList] = useState<SoalData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [essayScores, setEssayScores] = useState<EssayScoresState>({});
    const [isSaving, setIsSaving] = useState(false);
    const [manualPgScore, setManualPgScore] = useState<number | string>("");

    const currentTotalEssayScore = useMemo(() => {
        return Object.values(essayScores).reduce((sum, score) => sum + (Number(score) || 0), 0);
    }, [essayScores]);


    const [summary, setSummary] = useState<SummaryStats>({
        correct: 0,
        incorrect: 0,
        essays: 0,
        totalScore: 0,
        maxScore: 0,
        maxScorePG: 0, 
        maxScoreEsai: 0,
        finalScore: 0,
        finalScoreRaw: 0, 
        finalScoreScaled: 0,
    });

    const fetchDetailData = useCallback(async (userUid: string) => {
        if (!submissionId) return;
        setLoading(true);
        setError(null);

        try {
            const subRef = doc(db, "students_answers", submissionId);
            const subSnap = await getDoc(subRef);
            if (!subSnap.exists()) {
                throw new Error("Data jawaban siswa tidak ditemukan.");
            }
            const subData = subSnap.data() as SubmissionData;
            setSubmission(subData);

            const studentPromise = getDoc(subData.student_ref);
            const examPromise = getDoc(subData.latihan_ref);
            const soalQuery = query(
                collection(subData.latihan_ref, "soal"),
                orderBy("urutan", "asc")
            );
            const soalPromise = getDocs(soalQuery);

            const [studentSnap, examSnap, soalSnap] = await Promise.all([
                studentPromise,
                examPromise,
                soalPromise
            ]);

            if (studentSnap.exists()) {
                setStudentName(studentSnap.data()?.nama_lengkap || "Siswa");
            } else {
                setStudentName("Siswa (Telah Dihapus)");
            }

            const examData = examSnap.data() as ExamData;
            if (examSnap.exists()) {
                setExam(examData);
            } else {
                throw new Error("Data latihan tidak ditemukan.");
            }

            const soalData = soalSnap.docs.map(d => ({ ...d.data(), id: d.id } as SoalData));
            setSoalList(soalData);

            let correct = 0;
            let incorrect = 0;
            let totalScorePG = 0;
            let maxScoreOverall = 0;
            let maxScorePG = 0;
            let maxScoreEsai = 0;
            let essaysCount = 0; 

            soalData.forEach((soal, index) => {
                maxScoreOverall += soal.poin; 
                
                if (soal.tipe_soal === "Pilihan Ganda") {
                    maxScorePG += soal.poin;
                    if (soal.kunci_jawaban && subData.jawaban[index] === soal.kunci_jawaban) {
                        correct++;
                        totalScorePG += soal.poin;
                    } else {
                        incorrect++;
                    }
                }
                
                if (soal.tipe_soal === "Esai" || soal.tipe_soal === "Esai Uraian") {
                    maxScoreEsai += soal.poin;
                    essaysCount++;
                }
            });
            
            const finalScoreRaw = totalScorePG + (subData.nilai_esai ?? 0); 
            
            let finalScoreScaled = 0;
            if (maxScoreOverall > 0) {
                finalScoreScaled = (finalScoreRaw / maxScoreOverall) * 100;
                finalScoreScaled = Math.round(finalScoreScaled * 100) / 100;
            }const finalScore = totalScorePG + (subData.nilai_esai ?? 0);
            
                setSummary({ 
                correct, 
                incorrect, 
                essays: essaysCount, 
                totalScore: totalScorePG, 
                maxScore: maxScoreOverall, 
                maxScorePG: maxScorePG,
                maxScoreEsai: maxScoreEsai,
                finalScore: finalScore,
                finalScoreRaw: finalScoreRaw, 
                finalScoreScaled: finalScoreScaled,
            });


            if (subData.skor_per_soal) {
                setEssayScores(subData.skor_per_soal as EssayScoresState);
            }

        } catch (err: any) {
            console.error("Error fetching detail data:", err);
            setError(err.message || "Gagal memuat detail jawaban.");
            if (err.code === 'permission-denied') {
                setError("Izin ditolak. Gagal memuat data latihan atau soal. Pastikan firestore.rules Anda sudah benar.");
                toast.error("Gagal memuat: Izin ditolak.");
            }
        } finally {
            setLoading(false);
        }
    }, [submissionId]); 

    useEffect(() => {
        if (user?.uid && !authLoading) {
            fetchDetailData(user.uid);
        }
        if (!user && !authLoading) {
            setLoading(false);
            setError("Harap login untuk melihat hasil.");
        }
    }, [user, authLoading, fetchDetailData]);

    const handleEssayScoreChange = (soalId: string, value: string, maxPoin: number) => {
        const score = parseInt(value, 10);
        if (score < 0) {
            setEssayScores(prev => ({ ...prev, [soalId]: 0 }));
        } else if (score > maxPoin) {
            setEssayScores(prev => ({ ...prev, [soalId]: maxPoin }));
        } else {
            setEssayScores(prev => ({ ...prev, [soalId]: score }));
        }
    };

    const handleSaveEssayScores = async () => {
        if (!submission) return;
        
        const essayQuestionIds = soalList.filter(s => s.tipe_soal === 'Esai' || s.tipe_soal === 'Esai Uraian').map(s => s.id);
        const scoredQuestionIds = Object.keys(essayScores);
        
        if (essayQuestionIds.length !== scoredQuestionIds.length) {
            toast.error("Harap isi nilai untuk SEMUA soal esai sebelum menyimpan.");
            return;
        }

        setIsSaving(true);
        const loadingToastId = toast.loading("Menyimpan nilai esai...");

        try {
            const totalScoreEsaiManual = currentTotalEssayScore; 
            const scorePGEarned = summary.totalScore;
            const maxTotalRawScore = summary.maxScore;
            const totalScoreRaw = scorePGEarned + totalScoreEsaiManual;
            
            let finalScoreScaled = 0;
            if (maxTotalRawScore > 0) {
                finalScoreScaled = (totalScoreRaw / maxTotalRawScore) * 100;
                finalScoreScaled = Math.round(finalScoreScaled * 100) / 100;
            }

            const subRef = doc(db, "students_answers", submissionId);
            await updateDoc(subRef, {
                nilai_esai: totalScoreEsaiManual, 
                skor_per_soal: essayScores,
                nilai_akhir: scorePGEarned, 
                nilai_akhir_scaled: finalScoreScaled, 
            });

            setSubmission(prev => prev ? { 
                ...prev, 
                nilai_esai: totalScoreEsaiManual, 
                nilai_akhir: totalScoreRaw, 
                nilai_akhir_scaled: finalScoreScaled 
            } : null);
            
            toast.success("Nilai esai berhasil disimpan dan nilai akhir diperbarui!", { id: loadingToastId });
            
        } catch (err: any) {
            console.error("Error saving essay score:", err);
            toast.error(err.message || "Gagal menyimpan nilai.", { id: loadingToastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveManualPgScore = async () => {
    if (!submission || manualPgScore === "") return;
    
    const score = Number(manualPgScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Nilai harus berupa angka antara 0 dan 100.");
      return;
    }

    setIsSaving(true);
    const loadingToastId = toast.loading("Menyimpan nilai manual PG...");

    try {
      const subRef = doc(db, "students_answers", submissionId);
      await updateDoc(subRef, {
        nilai_akhir: score
      });

      setSubmission(prev => prev ? { ...prev, nilai_akhir: score } : null);
      setManualPgScore("");
      
      toast.success("Nilai manual PG berhasil disimpan!", { id: loadingToastId });
      
    } catch (err: any) {
      console.error("Error saving manual PG score:", err);
      toast.error(err.message || "Gagal menyimpan nilai.", { id: loadingToastId });
    } finally {
      setIsSaving(false);
    }
  };


    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-[80vh]">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <span className="ml-4 text-gray-600 text-lg">Memuat hasil Anda...</span>
            </div>
        );
    }

    if (error) {
         return (
             <div className="p-4 sm:p-6 bg-gray-50 min-h-screen font-sans">
                 <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium">
                    <ArrowLeft className="w-5 h-5" />
                    Kembali ke List Hasil
                </button>
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded-md" role="alert">
                    <p className="font-bold">Terjadi Kesalahan</p>
                    <p>{error}</p>
                </div>
            </div>
         )
    }

    if (!submission || !exam) {
        return <div className="p-8 text-center text-gray-500">Data hasil tidak ditemukan.</div>;
    }

    return (
        <div className={`relative p-4 sm:p-6 bg-gray-50 min-h-screen font-sans ${(exam.tipe === 'Esai' || exam.tipe === 'Esai Uraian' || exam.tipe === 'Pilihan Ganda') ? 'pb-48' : ''}`}>
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium">
                <ArrowLeft className="w-5 h-5" />
                Kembali ke List Hasil
            </button>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Detail Jawaban: {exam.judul}</h1>
                <div className="border-t mt-4 pt-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <div className="flex-shrink-0 h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Siswa</p>
                            <p className="text-lg font-semibold text-gray-900">{studentName}</p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                       {exam.tipe === 'PG dan Esai' && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Nilai Akhir</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {summary.finalScoreScaled} <span className="text-2xl font-medium text-gray-400"></span>
                                </p>
                            </div>
                        )}
                        
                        {exam.tipe === 'Pilihan Ganda' && (
                            <>
                                <p className="text-sm text-gray-500">Nilai Akhir (Pilihan Ganda)</p>
                                <p className="text-4xl font-bold text-blue-600">{manualPgScore !== "" ? manualPgScore : (submission.nilai_akhir ?? '-')}</p>
                            </>
                        )}
                        
                        {(exam.tipe === 'Esai' || exam.tipe === "Esai Uraian") && (
                             <>
                                <p className="text-sm text-gray-500">Nilai Akhir (Esai/uraian)</p>
                                <p className="text-4xl font-bold text-blue-600">
                                    {submission.nilai_esai !== null ? submission.nilai_esai : (currentTotalEssayScore || 'Belum Dinilai')}
                                </p>
                            </>
                        )}
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm">
                    {exam.tipe === 'PG dan Esai' && (
                        <>
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-gray-700">{summary.correct} Benar</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
                                <X className="w-4 h-4 text-red-600" />
                                <span className="font-semibold text-gray-700">{summary.incorrect} Salah</span>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
                                <Medal className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-800">
                                    Skor PG: <span className="font-bold">{summary.totalScore} / {summary.maxScorePG}</span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-full border border-yellow-200">
                                <MessageSquare className="w-4 h-4 text-yellow-600" />
                                <span className="text-yellow-800">
                                    Skor Esai: <span className="font-bold">{submission.nilai_esai ?? '-'} / {summary.maxScoreEsai}</span>
                                </span>
                            </div>
                            
                            <div className="flex text-xs items-center text-gray-400 font-medium ml-auto sm:ml-0">
                                (Poin Diperoleh: {summary.finalScoreRaw} / {summary.maxScore})
                            </div>
                        </>
                    )}
                    {exam.tipe === 'Pilihan Ganda' && (
                        <>
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-600 bg-green-100 p-1 rounded-full" />
                                <span className="font-medium">{summary.correct}</span> Benar
                            </div>
                            <div className="flex items-center gap-2">
                                <X className="w-5 h-5 text-red-600 bg-red-100 p-1 rounded-full" />
                                <span className="font-medium">{summary.incorrect}</span> Salah
                            </div>
                            <div className="flex items-center gap-2">
                                <Medal className="w-5 h-5 text-yellow-600 bg-yellow-100 p-1 rounded-full" />
                                Skor PG: <span className="font-medium">{summary.totalScore} / {summary.maxScore} Poin</span>
                            </div>
                        </>
                    )}
                     {(exam.tipe === 'Esai' || exam.tipe === 'Esai Uraian') && (
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600 bg-blue-100 p-1 rounded-full" />
                            <span className="font-medium">{summary.essays}</span> Total Soal Esai
                        </div>
                    )}
                </div>
            </div>

            
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tinjauan Jawaban</h2>
            <div className="space-y-4">
                
            {soalList.map((soal, index) => { 
                
                const studentAnswer = submission.jawaban[index];
                const isCorrect = soal.kunci_jawaban === studentAnswer;
                const pgScore: number = (soal.tipe_soal === 'Pilihan Ganda' && isCorrect) ? soal.poin : 0;
                
                return (
                    <div key={soal.id} className="mb-8 p-4 bg-white shadow rounded-lg border border-gray-200">
                        
                        <div className="pb-3 mb-3 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Soal Nomor {soal.urutan}</h3>
                            <p className="text-sm font-medium text-gray-500 mb-2">Tipe: {soal.tipe_soal} | Poin Maksimal: {soal.poin}</p>
                            <div className="p-3 bg-gray-50 rounded-md">
                                <p className="whitespace-pre-wrap text-gray-900">{soal.pertanyaan}</p>
                            </div>
                        </div>

                        
                        {soal.tipe_soal === 'Pilihan Ganda' && (
                            <div className="space-y-4">
                                <RenderPilihanGanda 
                                    soal={soal} 
                                    studentAnswer={studentAnswer} 
                                    correctAnswer={soal.kunci_jawaban}
                                />
                                <div className="pt-2 border-t">
                                    <p className="block text-sm font-medium text-gray-700">Skor Otomatis (Maks: {soal.poin} Poin)</p>
                                    <div className={`mt-1 p-2 rounded-md font-bold text-lg ${isCorrect ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                        {pgScore} Poin
                                    </div>
                                </div>
                            </div>
                        )}

                        {soal.tipe_soal === 'Esai' && (
                            <RenderEsai 
                                soal={soal} 
                                studentAnswer={studentAnswer} 
                                scoreValue={essayScores[soal.id]}
                                onScoreChange={(value) => handleEssayScoreChange(soal.id, value, soal.poin)}
                                isGraded={submission.nilai_esai !== null}
                            />
                        )}

                        {soal.tipe_soal === 'Esai Uraian' && (
                            <RenderEsaiUraian 
                                soal={soal} 
                                studentAnswer={studentAnswer} 
                                scoreValue={essayScores[soal.id]}
                                onScoreChange={(value) => handleEssayScoreChange(soal.id, value, soal.poin)}
                                isGraded={submission.nilai_esai !== null}
                            />
                        )}
                        
                    </div>
                );
            })}
            </div>

       
            {(exam.tipe === 'Esai' || exam.tipe === 'Esai Uraian' || exam.tipe === 'PG dan Esai') && (
                <div className=" bottom-5 left-7 right-7 bg-white p-4 border-t border-gray-200 shadow-lg rounded-md mt-5">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div>
                            <p className="text-sm text-gray-600">Total Skor Esai (dari inputan)</p>
                            <p className="text-2xl font-bold text-blue-600">{currentTotalEssayScore} Poin</p>
                        </div>
                        {submission.nilai_esai !== null && (
                            <p className="text-sm text-green-600 font-medium">
                                Nilai akhir ({submission.nilai_esai}) sudah tersimpan. <br/> 
                                Menyimpan lagi akan menimpa nilai sebelumnya.
                            </p>
                        )}
                        <button
                            onClick={handleSaveEssayScores}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {submission.nilai_esai !== null ? "Perbarui Nilai Esai" : "Simpan Nilai Esai"}
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

const RenderPilihanGanda = ({ soal, studentAnswer, correctAnswer }: {
    soal: SoalData,
    studentAnswer: string,
    correctAnswer?: string
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {soal.opsi && ['A', 'B', 'C', 'D'].map(key => {
                if (!soal.opsi?.[key]) return null;

                const isCorrect = correctAnswer === key;
                const isStudentAnswer = studentAnswer === key;
                
                let chipStyle = "bg-gray-100 text-gray-800";
                let icon = null;

                if (isCorrect) {
                    chipStyle = "bg-green-100 text-green-800 border-green-300 border-2 font-semibold";
                    icon = <Check className="w-5 h-5 text-green-600 ml-auto" />;
                }
                
                if (isStudentAnswer && !isCorrect) {
                    chipStyle = "bg-red-100 text-red-800 border-red-300 border-2";
                    icon = <X className="w-5 h-5 text-red-600 ml-auto" />;
                }

                return (
                    <div 
                        key={key} 
                        className={`flex items-center gap-3 p-3 rounded-md ${chipStyle} transition-all`}
                    >
                        <span className="font-bold">{key}.</span>
                        <span>{soal.opsi[key]}</span>
                        {icon}
                    </div>
                );
            })}
        </div>
    );
};

const RenderEsai = ({ soal, studentAnswer, scoreValue, onScoreChange, isGraded }: {
    soal: SoalData,
    studentAnswer: string,
    scoreValue: number, 
    onScoreChange: (value: string) => void,
    isGraded: boolean
}) => {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
                <p className="font-semibold text-blue-800 mb-1">Jawaban Siswa:</p>
                <p className="text-blue-900 whitespace-pre-wrap text-sm">
                    {studentAnswer || <span className="italic text-gray-500">-- Tidak dijawab --</span>}
                </p>
            </div>
            
            {soal.rubrik_penilaian && (
                 <div className="p-3 bg-gray-50 border-l-4 border-gray-400 rounded-r-md">
                    <p className="font-semibold text-gray-800 mb-1">Kunci Jawaban/Rubrik Guru:</p>
                    <p className="text-gray-900 whitespace-pre-wrap text-sm">
                        {soal.rubrik_penilaian}
                    </p>
                </div>
            )}

            <div className="pt-2 ">
                <label 
                    htmlFor={`score-${soal.id}`} 
                    className="block text-sm font-medium text-gray-700"
                >
                    Berikan Skor (Maks: {soal.poin} Poin)
                </label>
                <input 
                    type="number"
                    id={`score-${soal.id}`}
                    value={scoreValue === null || isNaN(scoreValue) ? "" : scoreValue} 
                    onChange={(e) => onScoreChange(e.target.value)}
                    min={0}
                    max={soal.poin}
                    className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: 10"
                />
                 {isGraded && (scoreValue === null || scoreValue === undefined) && (
                    <p className="text-xs text-green-600 mt-1">
                        Soal ini sudah pernah dinilai (bagian dari total). <br/>
                        Mengisi ulang akan menimpa nilai sebelumnya saat disimpan.
                    </p>
                 )}
            </div>
        </div>
    )
}

const RenderEsaiUraian = ({ soal, studentAnswer, scoreValue, onScoreChange, isGraded }: {
soal: SoalData,
studentAnswer: string,
 scoreValue: number,
onScoreChange: (value: string) => void,
isGraded: boolean
}) => {
const jumlahInput = soal.jumlah_input || 1;

let savedAnswers: string[] = [];
try {
const parsed = JSON.parse(studentAnswer);
 if (Array.isArray(parsed)) {
savedAnswers = parsed;
 }
 } catch (e) {

 }

const displayAnswers = Array.from({ length: jumlahInput }, (_, index) => {
return savedAnswers[index] || ""; 
});

return (
<div className="space-y-4">
<div className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded-r-md">
<p className="font-semibold text-purple-800 mb-2">Jawaban Siswa:</p>
<div className="space-y-2">
{displayAnswers.map((answer, index) => (
 <div key={index} className="flex items-start gap-3">
<span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-200 text-purple-700 font-semibold text-sm flex-shrink-0 pt-0.5">
{index + 1}
</span>
<p className="text-purple-900 whitespace-pre-wrap text-sm pt-0.5 w-full bg-white/50 p-2 rounded">
{answer || <span className="italic text-gray-500">-- Tidak dijawab --</span>}
</p>
</div>
))}
</div>
</div>

{soal.rubrik_penilaian && (
<div className="p-3 bg-gray-50 border-l-4 border-gray-400 rounded-r-md">
<p className="font-semibold text-gray-800 mb-1">Kunci Jawaban/Rubrik Guru:</p>
<p className="text-gray-900 whitespace-pre-wrap text-sm">
{soal.rubrik_penilaian}
</p>
</div>
 )}

<div className="pt-2 ">
<label 
htmlFor={`score-${soal.id}`} 
className="block text-sm font-medium text-gray-700"
>
Berikan Skor (Maks: {soal.poin} Poin)
 </label>
<input 
type="number"
id={`score-${soal.id}`}
value={scoreValue === null || isNaN(scoreValue) ? "" : scoreValue}
onChange={(e) => onScoreChange(e.target.value)}
min={0}
max={soal.poin}
className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
placeholder="Contoh: 10"
/>
{isGraded && (scoreValue === null || scoreValue === undefined) && (
<p className="text-xs text-green-600 mt-1">
Soal ini sudah pernah dinilai (bagian dari total). <br/>
Mengisi ulang akan menimpa nilai sebelumnya saat disimpan.
</p>
)}
</div>
</div>
)
}

export default StudentResultPage;

