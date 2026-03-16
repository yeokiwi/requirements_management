import React from 'react';
import AppShell from './components/layout/AppShell';
import Toast from './components/common/Toast';

const App: React.FC = () => {
  return (
    <>
      <AppShell />
      <Toast />
    </>
  );
};

export default App;
