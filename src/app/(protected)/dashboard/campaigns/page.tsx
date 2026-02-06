"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PlusCircle, Megaphone, Clock, Loader2, ChevronRight } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function fetchCampaigns() {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setCampaigns(data);
      setLoading(false);
    }
    fetchCampaigns();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium">
            <ArrowLeft className="w-4 h-4"/> 대시보드 돌아가기
          </Link>
          <Link href="/dashboard/campaigns/new" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-md font-bold">
            <PlusCircle className="w-5 h-5"/> 새 캠페인 등록
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-slate-900">
          <Megaphone className="text-indigo-500 w-8 h-8"/> 캠페인 관리 목록
        </h1>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">캠페인 제목</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">모집 기간</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400">등록된 캠페인이 없습니다.</td></tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-5">
                      {/* 제목을 클릭 가능한 링크로 변경 */}
                      <Link 
                        href={`/dashboard/campaigns/${c.id}`} 
                        className="font-bold text-slate-900 hover:text-indigo-600 transition flex items-center gap-2"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                      {c.start_date} ~ {c.end_date}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Link 
                        href={`/dashboard/campaigns/${c.id}`} 
                        className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition"
                      >
                        상세보기 <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}