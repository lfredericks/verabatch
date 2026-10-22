/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The official ingredient name list is read from disk by the name search.
  outputFileTracingIncludes: {
    "/api/ingredients": ["./data/cosing-inci-names.txt"],
  },
};

export default nextConfig;
