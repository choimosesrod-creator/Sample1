"use client";

import Link from "next/link";
import { PlusCircle, LayoutDashboard, Megaphone, LogOut, Settings } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export default function DashboardPage() {
  const { user } = useCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 사이드바 */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col gap-8">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-indigo-400" /> 광고주 대시보드
        </h2>
        <nav className="flex flex-col gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
            <LayoutDashboard className="w-4 h-4" /> 홈
          </Link>
          {/* 캠페인 등록 버튼 활성화: 실제 경로로 연결 */}
          <Link href="/dashboard/campaigns/new" className="flex items-center gap-2 p-3 hover:bg-slate-800 rounded-lg transition">
            <PlusCircle className="w-4 h-4" /> 캠페인 등록
          </Link>
          <Link href="/dashboard/campaigns" className="flex items-center gap-2 p-3 hover:bg-slate-800 rounded-lg transition">
            <Megaphone className="w-4 h-4" /> 캠페인 목록
          </Link>
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">광고주님, 환영합니다!</h1>
            <p className="text-slate-500">{user?.email} 계정으로 접속 중입니다.</p>
          </div>
          <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition font-medium">
            <LogOut className="w-4 h-4" /> 로그아웃
          </button>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {/* 활성화된 대시보드 카드 */}
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 bg-white hover:border-indigo-400 hover:shadow-md transition group">
            <PlusCircle className="w-12 h-12 text-slate-300 group-hover:text-indigo-500 transition" />
            <div className="text-center">
              <h3 className="font-bold text-slate-800">새 캠페인 등록</h3>
              <p className="text-sm text-slate-500">인플루언서 모집을 위한 새 캠페인을 시작하세요.</p>
            </div>
            <Link 
              href="/dashboard/campaigns/new" 
              className="mt-2 px-8 py-2.5 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition shadow-sm"
            >
              캠페인 작성하기
            </Link>
          </div>
          
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 mb-2">캠페인 현황 요약</h3>
              <p className="text-sm text-slate-500 italic">현재 진행 중인 캠페인이 없습니다.</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
              <span className="text-slate-500">진행 중: 0</span>
              <span className="text-slate-500">완료: 0</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}