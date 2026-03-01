module.exports = {
  expo: {
    name: 'LeanLoop',
    slug: 'leanloop',
    version: '1.1.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'leanloop',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      revenueCatAppleApiKey: process.env.REVENUECAT_APPLE_API_KEY || '',
      revenueCatGoogleApiKey: process.env.REVENUECAT_GOOGLE_API_KEY || '',
    },
  },
};
