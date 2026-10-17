'use client';

import React, { useState } from 'react';
import { useVault } from '@/context/VaultContext';
import { CredentialItem, generatePassword } from '@/lib/crypto';
import {
  X,
  Key,
  Building2,
  FolderGit2,
  User,
  Globe,
  FileText,
  Wand2,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface AddCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCredentialModal: React.FC<AddCredentialModalProps> = ({ isOpen, onClose }) => {
  const { credentials, saveCredentials, isLoading } = useVault();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [project, setProject] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const newPassword = generatePassword({ length: 20 });
    setPassword(newPassword);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !company.trim() || !project.trim() || !username.trim() || !password) {
      setFormError('Por favor, complete todos los campos obligatorios (*).');
      return;
    }

    const now = new Date().toISOString();
    const newItem: CredentialItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cred-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: title.trim(),
      company: company.trim(),
      project: project.trim(),
      username: username.trim(),
      password,
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const updatedCredentials = [...credentials, newItem];
    const success = await saveCredentials(updatedCredentials);

    if (success) {
      // Reset form fields
      setTitle('');
      setCompany('');
      setProject('');
      setUsername('');
      setPassword('');
      setUrl('');
      setNotes('');
      setFormError(null);
      onClose();
    } else {
      setFormError('Error al guardar la credencial cifrada.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-nordic-card border border-nordic-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-nordic-border flex items-center justify-between bg-nordic-bg/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-nordic-accent/10 border border-nordic-accent/30 text-nordic-accent flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-nordic-text">Agregar Nueva Credencial</h2>
              <p className="text-[11px] text-nordic-muted">
                Zero-Knowledge • Cifrado en cliente antes de guardar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-nordic-muted hover:text-nordic-text hover:bg-nordic-border/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {formError && (
            <div className="p-3.5 bg-nordic-danger/10 border border-nordic-danger/30 rounded-xl flex items-center gap-2.5 text-nordic-danger text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-1.5">
              Título de la Credencial <span className="text-nordic-accent">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-nordic-muted">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Servidor AWS, Base de Datos Prod"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-nordic-bg border border-nordic-border rounded-xl text-nordic-text text-sm placeholder:text-nordic-muted focus:outline-none focus:border-nordic-accent transition-all"
              />
            </div>
          </div>

          {/* Company & Project Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-1.5">
                Empresa <span className="text-nordic-accent">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-nordic-muted">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ej. Acme Corp"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-nordic-bg border border-nordic-border rounded-xl text-nordic-text text-sm placeholder:text-nordic-muted focus:outline-none focus:border-nordic-accent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-1.5">
                Proyecto <span className="text-nordic-accent">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-nordic-muted">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Ej. Sistema de Pagos"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-nordic-bg border border-nordic-border rounded-xl text-nordic-text text-sm placeholder:text-nordic-muted focus:outline-none focus:border-nordic-accent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-1.5">
              Usuario / Correo <span className="text-nordic-accent">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-nordic-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="usuario@empresa.com"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-nordic-bg border border-nordic-border rounded-xl text-nordic-text text-sm placeholder:text-nordic-muted focus:outline-none focus:border-nordic-accent transition-all"
              />
            </div>
          </div>

          {/* Password with Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider">
                Contraseña <span className="text-nordic-accent">*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs text-nordic-accent hover:text-nordic-accentLight flex items-center gap-1 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" /> Generar Segura
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese o genere la contraseña"
                required
                className="w-full pl-3 pr-10 py-2.5 bg-nordic-bg border border-nordic-border rounded-xl text-nordic-text text-sm font-mono placeholder:font-sans placeholder:text-nordic-muted focus:outline-none focus:border-nordic-accent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-nordic-muted hover:text-nordic-text transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-1.5">
              URL / Dirección Web
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-nordic-muted">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://console.aws.amazon.com"
                className="w-full pl-9 pr-3 py-2.5 bg-nordic-bg border border-nordic-border rounded-xl text-nordic-text text-sm placeholder:text-nordic-muted focus:outline-none focus:border-nordic-accent transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-1.5">
              Notas Adicionales
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none text-nordic-muted">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales o instrucciones de acceso..."
                rows={2}
                className="w-full pl-9 pr-3 py-2 bg-nordic-bg border border-nordic-border rounded-xl text-nordic-text text-sm placeholder:text-nordic-muted focus:outline-none focus:border-nordic-accent transition-all resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-nordic-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-nordic-border hover:bg-nordic-border/70 text-nordic-text text-sm font-medium rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-nordic-accent hover:bg-nordic-accentHover disabled:opacity-50 text-nordic-bg text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-nordic-accent/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cifrando y Guardando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Guardar Cifrado
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
