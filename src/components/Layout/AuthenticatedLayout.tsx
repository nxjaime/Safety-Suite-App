import React from 'react';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { OfflineSyncProvider } from '../../contexts/OfflineSyncContext';
import Layout from './Layout';

const AuthenticatedLayout: React.FC = () => (
  <NotificationProvider>
    <OfflineSyncProvider>
      <Layout />
    </OfflineSyncProvider>
  </NotificationProvider>
);

export default AuthenticatedLayout;
