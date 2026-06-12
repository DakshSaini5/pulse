import React from 'react';
import { Capacitor } from '@capacitor/core';
import WebApp from './web/WebApp';
import MobileApp from './mobile/MobileApp';

export const App: React.FC = () => {
  // Vite compiles this statically, enabling dead-code elimination if we use mode/env
  const isMobileBuild = import.meta.env.VITE_APP_TARGET === 'mobile' || Capacitor.isNativePlatform();

  if (isMobileBuild) {
    return <MobileApp />;
  }

  return <WebApp />;
};

export default App;
