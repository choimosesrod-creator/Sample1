"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // DB에 데이터 삽입
    const { error } = await supabase.from("campaigns").insert({
      title: formData.get("title"),
      description: formData.get("description"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
      target_count: Number(formData.get("target_count")),
      budget: Number(formData.get("budget")),
    });

    if (error) {
      alert("등록 중 오류가 발생했습니다: " + error.message);
    } else {
      alert("캠페인이 성공적으로 등록되었습니다!");
      router.push("/dashboard/campaigns"); // 목록으로 이동
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">새 캠페인 등록</h1>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">캠페인 제목</label>
            <input name="title" type="text" className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900" required />
          </div>

          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">모집 시작일</label>
              <input name="start_date" type="date" className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">모집 종료일</label>
              <input name="end_date" type="date" className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">사역 상세 설명</label>
            <textarea name="description" rows={5} className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900" required></textarea>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">목표 인원</label>
              <input name="target_count" type="number" className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">예산 (THB)</label>
              <input name="budget" type="number" className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            캠페인 등록하기
          </button>
        </form>
      </div>
    </div>
  );
}