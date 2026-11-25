import type { MetadataRoute } from "next";

/** Makes the site installable on a phone's home screen (see also public/sw.js, which only provides an offline page). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SAVE A PLATE",
    short_name: "Save a Plate",
    description: "Rescue surplus food in Bengaluru",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF0D5",
    theme_color: "#CB0001",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
