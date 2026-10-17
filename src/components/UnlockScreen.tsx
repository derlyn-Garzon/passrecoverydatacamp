'use client';

import React, { useState } from 'react';
import { useVault } from '@/context/VaultContext';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, Upload, KeyRound, Loader2 } from 'lucide-react';

export const UnlockScreen: React.FC = () => {
  const { unlockVault, importVaultJson, error, clearError, isLoading, vaultExists } = useVault();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    await unlockVault(password);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText || !password) return;
    const success = await importVaultJson(importJsonText, password);
    if (success) {
      setImporting(false);
      setImportJsonText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-nordic-bg p-4 select-none">
      <div className="w-full max-w-md bg-nordic-card border border-nordic-border rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-nordic-accent/10 rounded-2xl flex items-center justify-center mb-4 border border-nordic-accent/20 text-nordic-accent">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-nordic-text">Zero-Knowledge Vault</h1>
          <p className="text-sm text-nordic-muted mt-1">
            Modo Centinela 🛡️ • Cifrado AES-GCM 256 en cliente
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-nordic-danger/10 border border-nordic-danger/30 rounded-xl flex items-start gap-3 text-nordic-danger text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-nordic-muted hover:text-nordic-text text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {!importing ? (
          <form onSubmit={handleUnlock} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-2">
                {vaultExists ? 'Contraseña Maestra' : 'Crear Contraseña Maestra (Nueva Bóveda)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-nordic-muted">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña maestra"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-nordic-bg border border-nordic-border rounded-xl text-nordic-text placeholder:text-nordic-muted focus:outline-none focus:border-nordic-accent focus:ring-1 focus:ring-nordic-accent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-nordic-muted hover:text-nordic-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-nordic-muted mt-2">
                {vaultExists
                  ? '🔒 Su clave nunca sale de este navegador.'
                  : '✨ Ingrese la clave que protegerá su nueva bóveda.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3.5 px-4 bg-nordic-accent hover:bg-nordic-accentHover disabled:opacity-50 disabled:cursor-not-allowed text-nordic-bg font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-nordic-accent/20 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Derivando clave PBKDF2...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  {vaultExists ? 'Desbloquear Bóveda' : 'Inicializar Nueva Bóveda'}
                </>
              )}
            </button>

            <div className="pt-4 border-t border-nordic-border/50 text-center">
              <button
                type="button"
                onClick={() => setImporting(true)}
                className="text-xs text-nordic-accent hover:underline flex items-center justify-center gap-1.5 mx-auto"
              >
                <Upload className="w-4 h-4" /> Importar Bóveda JSON Cifrada
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleImportSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-2">
                Archivo JSON de Bóveda Cifrada
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-nordic-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-nordic-border file:text-nordic-text hover:file:bg-nordic-cardHover cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-2">
                Contenido JSON Cifrado
              </label>
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"salt": "...", "iv": "...", "ciphertext": "..."}'
                rows={4}
                required
                className="w-full p-3 bg-nordic-bg border border-nordic-border rounded-xl text-nordic-text font-mono text-xs placeholder:text-nordic-muted focus:outline-none focus:border-nordic-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-2">
                Contraseña Maestra de la Bóveda Importada
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña de la bóveda importada"
                required
                className="w-full px-4 py-3 bg-nordic-bg border border-nordic-border rounded-xl text-nordic-text text-sm placeholder:text-nordic-muted focus:outline-none focus:border-nordic-accent transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setImporting(false)}
                className="flex-1 py-3 bg-nordic-border hover:bg-nordic-cardHover text-nordic-text text-sm font-semibold rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !importJsonText || !password}
                className="flex-1 py-3 bg-nordic-accent hover:bg-nordic-accentHover disabled:opacity-50 text-nordic-bg text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Descifrar e Importar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
