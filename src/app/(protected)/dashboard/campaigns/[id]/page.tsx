"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, Wallet, Trash2, Loader2, Megaphone } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 주소창의 [id] 값을 가져옵니다.
  const { id } = use(params);
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // DB에서 상세 데이터 불러오기
  useEffect(() => {
    async function fetchDetail() {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        alert("데이터를 불러오지 못했습니다.");
        router.push("/dashboard/campaigns");
      } else {
        setCampaign(data);
      }
      setLoading(false);
    }
    fetchDetail();
  }, [id, router, supabase]);

  // 삭제 기능
  const handleDelete = async () => {
    if (!confirm("정말로 이 캠페인을 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) {
      alert("삭제 중 오류가 발생했습니다.");
    } else {
      alert("삭제되었습니다.");
      router.push("/dashboard/campaigns");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!campaign) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-10 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* 뒤로가기 버튼 */}
        <Link href="/dashboard/campaigns" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 font-medium transition">
          <ArrowLeft className="w-4 h-4" /> 목록으로 돌아가기
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* 헤더 섹션 */}
          <div className="bg-slate-900 p-8 text-white">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="bg-indigo-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Campaign Overview</span>
                <h1 className="text-3xl font-extrabold">{campaign.title}</h1>
              </div>
              <button 
                onClick={handleDelete}
                className="text-slate-400 hover:text-red-400 transition p-2.5 bg-slate-800 rounded-xl"
                title="삭제하기"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-8 space-y-10">
            {/* 주요 정보 요약 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-2 font-bold text-xs">
                  <Calendar className="w-4 h-4 text-indigo-500" /> 모집 기간
                </div>
                <div className="text-slate-900 font-bold text-sm">{campaign.start_date} ~ {campaign.end_date}</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-2 font-bold text-xs">
                  <Users className="w-4 h-4 text-emerald-500" /> 목표 인원
                </div>
                <div className="text-slate-900 font-extrabold text-lg">{campaign.target_count}명</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-2 font-bold text-xs">
                  <Wallet className="w-4 h-4 text-amber-500" /> 사역 예산
                </div>
                <div className="text-slate-900 font-extrabold text-lg">{campaign.budget?.toLocaleString()} THB</div>
              </div>
            </div>

            {/* 상세 설명 섹션 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 border-b pb-3">
                <Megaphone className="w-5 h-5 text-indigo-500" /> 사역 상세 설명
              </h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                {campaign.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}