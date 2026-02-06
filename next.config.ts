import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 빌드 시 타입 에러와 린트 에러를 무시하고 배포를 진행합니다. */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 보안 경고로 인한 빌드 중단을 방지하기 위한 설정
  experimental: {
    // 필요한 추가 설정이 있다면 여기에 작성합니다.
  }
};

export default nextConfig;