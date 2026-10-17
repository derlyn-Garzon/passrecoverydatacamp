'use client';

import React, { useState, useMemo } from 'react';
import { useVault } from '@/context/VaultContext';
import { CredentialItem } from '@/lib/crypto';
import {
  ShieldCheck,
  Lock,
  Plus,
  Search,
  Download,
  Upload,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Globe,
  Building2,
  FolderGit2,
  Key,
  ExternalLink,
  Shield,
  FileText
} from 'lucide-react';

interface VaultDashboardProps {
  onOpenAddModal: () => void;
}

export const VaultDashboard: React.FC<VaultDashboardProps> = ({ onOpenAddModal }) => {
  const {
    credentials,
    lockVault,
    saveCredentials,
    exportVaultJson,
    importVaultJson,
    error,
    clearError,
  } = useVault();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Extract unique companies and projects
  const companies = useMemo(() => {
    const set = new Set<string>();
    credentials.forEach((c) => {
      if (c.company) set.add(c.company);
    });
    return Array.from(set).sort();
  }, [credentials]);

  const projects = useMemo(() => {
    const set = new Set<string>();
    credentials.forEach((c) => {
      if (c.project) set.add(c.project);
    });
    return Array.from(set).sort();
  }, [credentials]);

  // Filtered credentials list
  const filteredCredentials = useMemo(() => {
    return credentials.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.url && item.url.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCompany =
        selectedCompany === 'ALL' || item.company.toLowerCase() === selectedCompany.toLowerCase();

      const matchesProject =
        selectedProject === 'ALL' || item.project.toLowerCase() === selectedProject.toLowerCase();

      return matchesSearch && matchesCompany && matchesProject;
    });
  }, [credentials, searchQuery, selectedCompany, selectedProject]);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`¿Está seguro de eliminar la credencial "${title}"? esta acción no se puede deshacer.`)) {
      const updated = credentials.filter((item) => item.id !== id);
      await saveCredentials(updated);
    }
  };

  const handleExport = () => {
    try {
      const json = exportVaultJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-nordic-bg text-nordic-text">
      {/* Header Bar */}
      <header className="border-b border-nordic-border bg-nordic-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-nordic-accent/10 border border-nordic-accent/30 text-nordic-accent rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                Bóveda Zero-Knowledge
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-nordic-accent/10 border border-nordic-accent/30 text-nordic-accent">
                  🛡️ Modo Centinela
                </span>
              </h1>
              <p className="text-xs text-nordic-muted">
                {credentials.length} credencial{credentials.length !== 1 ? 'es' : ''} cifrada{credentials.length !== 1 ? 's' : ''} en cliente
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="py-2 px-4 bg-nordic-accent hover:bg-nordic-accentHover text-nordic-bg font-semibold text-sm rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-nordic-accent/20"
            >
              <Plus className="w-4 h-4" /> Agregar Credencial
            </button>

            <button
              onClick={handleExport}
              title="Exportar Bóveda Cifrada"
              className="p-2 bg-nordic-border/50 hover:bg-nordic-border text-nordic-text text-sm rounded-xl flex items-center gap-2 transition-all border border-nordic-border"
            >
              <Download className="w-4 h-4" /> Exportar
            </button>

            <button
              onClick={lockVault}
              title="Bloquear Bóveda"
              className="py-2 px-3 bg-nordic-danger/10 hover:bg-nordic-danger/20 text-nordic-danger border border-nordic-danger/30 text-sm rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Lock className="w-4 h-4" /> Bloquear
            </button>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="p-4 bg-nordic-danger/10 border border-nordic-danger/30 rounded-xl flex items-center justify-between text-nordic-danger text-sm">
            <span>{error}</span>
            <button onClick={clearError} className="hover:underline text-xs">Descartar</button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-nordic-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, usuario, empresa, proyecto..."
              className="w-full pl-10 pr-4 py-2.5 bg-nordic-card border border-nordic-border rounded-xl text-sm placeholder:text-nordic-muted focus:outline-none focus:border-nordic-accent transition-all"
            />
          </div>

          <div>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-nordic-card border border-nordic-border rounded-xl text-sm text-nordic-text focus:outline-none focus:border-nordic-accent transition-all"
            >
              <option value="ALL">🏢 Todas las Empresas</option>
              {companies.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-nordic-card border border-nordic-border rounded-xl text-sm text-nordic-text focus:outline-none focus:border-nordic-accent transition-all"
            >
              <option value="ALL">📁 Todos los Proyectos</option>
              {projects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Credentials Grid */}
        {filteredCredentials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCredentials.map((item) => {
              const isPasswordVisible = !!visiblePasswords[item.id];
              return (
                <div
                  key={item.id}
                  className="bg-nordic-card border border-nordic-border hover:border-nordic-border/80 rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between group hover:shadow-nordic-accent/5"
                >
                  <div>
                    {/* Header: Title & Delete */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-base text-nordic-text group-hover:text-nordic-accentLight transition-colors flex items-center gap-2">
                          <Key className="w-4 h-4 text-nordic-accent" />
                          {item.title}
                        </h3>
                        {item.url && (
                          <a
                            href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-nordic-muted hover:text-nordic-accent flex items-center gap-1 mt-1 transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[200px]">{item.url}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        title="Eliminar credencial"
                        className="p-1.5 text-nordic-muted hover:text-nordic-danger hover:bg-nordic-danger/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Badges: Company & Project */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {item.company && (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-nordic-bg border border-nordic-border text-nordic-muted flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-nordic-accent" />
                          {item.company}
                        </span>
                      )}
                      {item.project && (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-nordic-bg border border-nordic-border text-nordic-muted flex items-center gap-1">
                          <FolderGit2 className="w-3.5 h-3.5 text-nordic-accentLight" />
                          {item.project}
                        </span>
                      )}
                    </div>

                    {/* Username Field */}
                    <div className="mb-3 bg-nordic-bg/60 p-2.5 rounded-xl border border-nordic-border/50">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-nordic-muted mb-1">
                        Usuario / Correo
                      </div>
                      <div className="flex items-center justify-between text-sm font-mono">
                        <span className="truncate text-nordic-text">{item.username}</span>
                        <button
                          onClick={() => copyToClipboard(item.username, `user-${item.id}`)}
                          className="p-1 text-nordic-muted hover:text-nordic-accent transition-colors"
                          title="Copiar usuario"
                        >
                          {copiedField === `user-${item.id}` ? (
                            <Check className="w-4 h-4 text-nordic-accent" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="mb-3 bg-nordic-bg/60 p-2.5 rounded-xl border border-nordic-border/50">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-nordic-muted mb-1">
                        Contraseña
                      </div>
                      <div className="flex items-center justify-between text-sm font-mono">
                        <span className="truncate tracking-widest">
                          {isPasswordVisible ? item.password : '••••••••••••••••'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => togglePasswordVisibility(item.id)}
                            className="p-1 text-nordic-muted hover:text-nordic-text transition-colors"
                            title={isPasswordVisible ? 'Ocultar' : 'Mostrar'}
                          >
                            {isPasswordVisible ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(item.password, `pwd-${item.id}`)}
                            className="p-1 text-nordic-muted hover:text-nordic-accent transition-colors"
                            title="Copiar contraseña"
                          >
                            {copiedField === `pwd-${item.id}` ? (
                              <Check className="w-4 h-4 text-nordic-accent" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Notes if any */}
                    {item.notes && (
                      <div className="mb-2 text-xs text-nordic-muted bg-nordic-bg/30 p-2 rounded-lg border border-nordic-border/30 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{item.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-nordic-border/40 text-[10px] text-nordic-muted flex items-center justify-between mt-2">
                    <span>
                      Modificado: {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-nordic-accent">
                      <Shield className="w-3 h-3" /> Encrypted
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-nordic-card/40 border border-nordic-border rounded-2xl p-8">
            <div className="w-16 h-16 bg-nordic-accent/10 border border-nordic-accent/20 text-nordic-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-nordic-text mb-2">
              {credentials.length === 0
                ? 'No hay credenciales registradas'
                : 'No se encontraron resultados'}
            </h3>
            <p className="text-sm text-nordic-muted max-w-md mx-auto mb-6">
              {credentials.length === 0
                ? 'Comience a agregar credenciales de forma segura. Todos los datos serán cifrados en su navegador antes de ser guardados.'
                : 'Intente modificar sus filtros de búsqueda o seleccionar otra empresa/proyecto.'}
            </p>
            {credentials.length === 0 && (
              <button
                onClick={onOpenAddModal}
                className="py-3 px-6 bg-nordic-accent hover:bg-nordic-accentHover text-nordic-bg font-semibold text-sm rounded-xl inline-flex items-center gap-2 transition-all shadow-lg shadow-nordic-accent/20"
              >
                <Plus className="w-5 h-5" /> Agregar Mi Primera Credencial
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
