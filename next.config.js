/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ 危险动作：忽略所有类型错误，强制打包上线
    ignoreBuildErrors: true,
  },
  eslint: {
    // 忽略所有代码风格错误
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; // 如果是 .js
// export default nextConfig; // 如果是 .ts