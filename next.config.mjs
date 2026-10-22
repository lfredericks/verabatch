/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The official ingredient name list is read from disk by the name search.
  outputFileTracingIncludes: {
    "/api/ingredients": ["./data/cosing-inci-names.txt"],
    // The two label fonts, read from disk when a label PDF is made.
    "/app/products/[id]/label": ["./lib/labelFonts/*.ttf"],
    "/app/products/[id]/label/pdf": ["./lib/labelFonts/*.ttf"],
  },
};

export default nextConfig;
