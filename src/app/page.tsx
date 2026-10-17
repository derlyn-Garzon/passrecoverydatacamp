'use client';

import React, { useState } from 'react';
import { VaultProvider, useVault } from '@/context/VaultContext';
import { UnlockScreen } from '@/components/UnlockScreen';
import { VaultDashboard } from '@/components/VaultDashboard';
import { AddCredentialModal } from '@/components/AddCredentialModal';

function VaultAppContent() {
  const { isUnlocked } = useVault();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (!isUnlocked) {
    return <UnlockScreen />;
  }

  return (
    <>
      <VaultDashboard onOpenAddModal={() => setIsAddModalOpen(true)} />
      <AddCredentialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
}

export default function Page() {
  return (
    <VaultProvider>
      <VaultAppContent />
    </VaultProvider>
  );
}
