/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  
  // Skip static page generation during build
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  webpack: (config, { isServer }) => {
    // 1. Correction Fallback (pour le client) - Déjà présente
    if (!isServer) {
      config.resolve.fallback = {
        encoding: false,
        bufferutil: false,
        'utf-8-validate': false,
      };
    }
    
    // 2. Correction Externals (pour le serveur)
    // Nous ajoutons ces dépendances aux externals uniquement pour le serveur (Node.js) 
    // pour s'assurer qu'elles ne sont PAS traitées par Webpack, mais laissées pour Node.js.
    // Cela peut parfois résoudre les conflits qui se répercutent sur le client.
    if (isServer) {
        config.externals.push(
            'bufferutil',
            'utf-8-validate',
            'encoding'
        );
    }

    return config;
  },
};

module.exports = nextConfig;