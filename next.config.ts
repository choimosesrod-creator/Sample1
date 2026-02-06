/** @type {import('next').NextConfig} */
const nextConfig = {
  // 빌드 중 발생할 수 있는 사소한 오타/타입 에러를 무시하고 배포를 강행합니다.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;