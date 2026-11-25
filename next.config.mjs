/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Safe defaults for every response. (No Content-Security-Policy yet: the page needs inline start-up scripts and the Razorpay
  // checkout script, so a strict policy needs nonces first. Tracked in docs/SECURITY_REVIEW.md.)
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // the QR scanner needs the camera and the ETA button needs the location, both only on this site
        { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      ],
    }];
  },
};
export default nextConfig;
