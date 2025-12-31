const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for import.meta issue on web - disable lazy loading
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// Force lazy=false for web platform
const originalGetTransformOptions = config.transformer.getTransformOptions;
config.transformer.getTransformOptions = async (...args) => {
  const options = await originalGetTransformOptions?.(...args) || {};
  return {
    ...options,
    transform: {
      ...options.transform,
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  };
};

module.exports = config;
