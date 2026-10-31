import { Slot } from 'expo-router';

import { ProtectedRoute } from '@/components/auth/auth-routing';

export default function UserLayout() {
  return (
    <ProtectedRoute role="user">
      <Slot />
    </ProtectedRoute>
  );
}
