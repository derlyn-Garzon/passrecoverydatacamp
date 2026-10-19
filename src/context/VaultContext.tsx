'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CredentialItem,
  EncryptedVaultPayload,
  encryptVaultData,
  decryptVaultData,
} from '@/lib/crypto';

interface VaultContextType {
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  credentials: CredentialItem[];
  masterPassword: string | null;
  encryptedPayload: EncryptedVaultPayload | null;
  vaultExists: boolean;
  unlockVault: (password: string) => Promise<boolean>;
  lockVault: () => void;
  saveCredentials: (updatedCredentials: CredentialItem[]) => Promise<boolean>;
  exportVaultJson: () => string;
  importVaultJson: (jsonString: string, password: string) => Promise<boolean>;
  clearError: () => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedVaultPayload | null>(null);
  const [vaultExists, setVaultExists] = useState<boolean>(false);

  const fetchVaultState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/vault');
      const data = await res.json();

      if (data.exists && data.data) {
        setVaultExists(true);
        setEncryptedPayload(data.data);
      } else {
        setVaultExists(false);
        setEncryptedPayload(null);
        if (data.error) {
          setError(data.error);
        }
      }
    } catch (err) {
      setError('Error al conectar con el servidor de la bóveda.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaultState();
  }, [fetchVaultState]);

  const unlockVault = async (password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Refresh vault payload from server
      const res = await fetch('/api/vault');
      const data = await res.json();

      if (data.exists && data.data) {
        const decrypted = await decryptVaultData<CredentialItem[]>(data.data, password);
        setCredentials(decrypted);
        setMasterPassword(password);
        setEncryptedPayload(data.data);
        setVaultExists(true);
        setIsUnlocked(true);
        return true;
      } else {
        // Vault does not exist or was empty/corrupted - Initialize new vault
        const initialCredentials: CredentialItem[] = [];
        const newPayload = await encryptVaultData(initialCredentials, password);

        const saveRes = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPayload),
        });

        
        if (!saveRes.ok) {
          const errorData = await saveRes.json().catch(() => ({}));
          throw new Error(errorData.error || `Error al inicializar la bóveda en el servidor (${saveRes.status}).`);
        }

        setCredentials(initialCredentials);
        setMasterPassword(password);
        setEncryptedPayload(newPayload);
        setVaultExists(true);
        setIsUnlocked(true);
        return true;
      }
    } catch (err) {
      setError((err as Error).message || 'Error al desbloquear la bóveda.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const lockVault = () => {
    setCredentials([]);
    setMasterPassword(null);
    setIsUnlocked(false);
  };

  const saveCredentials = async (updatedCredentials: CredentialItem[]): Promise<boolean> => {
    if (!masterPassword) {
      setError('Sesión no autorizada o bóveda bloqueada.');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const newPayload = await encryptVaultData(
        updatedCredentials,
        masterPassword,
        encryptedPayload?.salt
      );

      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Error al guardar la bóveda.');
      }

      setCredentials(updatedCredentials);
      setEncryptedPayload(newPayload);
      return true;
    } catch (err) {
      setError((err as Error).message || 'Error al guardar cambios.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const exportVaultJson = (): string => {
    if (!encryptedPayload) {
      throw new Error('No hay datos de bóveda cifrada disponibles para exportar.');
    }
    return JSON.stringify(encryptedPayload, null, 2);
  };

  const importVaultJson = async (jsonString: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsedPayload = JSON.parse(jsonString) as EncryptedVaultPayload;
      const decrypted = await decryptVaultData<CredentialItem[]>(parsedPayload, password);

      // Save imported encrypted payload to backend
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedPayload),
      });

      if (!res.ok) {
        throw new Error('Error al guardar la bóveda importada en el servidor.');
      }

      setCredentials(decrypted);
      setMasterPassword(password);
      setEncryptedPayload(parsedPayload);
      setVaultExists(true);
      setIsUnlocked(true);
      return true;
    } catch (err) {
      setError('Formato JSON inválido o contraseña incorrecta para los datos importados.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <VaultContext.Provider
      value={{
        isUnlocked,
        isLoading,
        error,
        credentials,
        masterPassword,
        encryptedPayload,
        vaultExists,
        unlockVault,
        lockVault,
        saveCredentials,
        exportVaultJson,
        importVaultJson,
        clearError,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = (): VaultContextType => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
