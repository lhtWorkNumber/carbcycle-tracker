import nextPwa from "next-pwa";

import runtimeCaching from "./pwa-runtime-caching.mjs";

const withPwa = nextPwa({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  reloadOnOnline: false,
  dynamicStartUrl: false,
  customWorkerDir: "worker",
  runtimeCaching,
  fallbacks: {
    document: "/_offline"
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  output: "standalone"
};

export default withPwa(nextConfig);
