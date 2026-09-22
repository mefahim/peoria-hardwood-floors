/** @type {import('next').NextConfig} */
const nextConfig = {
  // Preserve the project's existing deployment behavior; this change is
  // specifically about removing the native SQLite/GLIBC dependency.
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
