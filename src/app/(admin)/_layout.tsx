import { Slot } from 'expo-router';

import { ProtectedRoute } from '@/components/auth/auth-routing';

export default function AdminLayout() {
  return (
    <ProtectedRoute role="admin">
      <Slot />
    </ProtectedRoute>
  );
}
