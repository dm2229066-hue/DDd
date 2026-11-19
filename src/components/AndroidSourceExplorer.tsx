import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, FileCode2, FolderOpen, Search } from 'lucide-react';
import { AndroidFileEntry } from '../types/calculator';

export const AndroidSourceExplorer: React.FC = () => {
  const [files, setFiles] = useState<AndroidFileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingTree, setLoadingTree] = useState<boolean>(true);
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    fetch('/api/android/tree')
      .then((res) => res.json())
      .then((data: { files: AndroidFileEntry[] }) => {
        if (!active) return;
        setFiles(data.files || []);
        const defaultFile =
          data.files.find((f) => f.path.endsWith('CalculatorEngine.kt')) || data.files[0];
        if (defaultFile) {
          setSelectedPath(defaultFile.path);
        }
      })
      .catch(() => {
        if (active) setFiles([]);
      })
      .finally(() => {
        if (active) setLoadingTree(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPath) return;
    let active = true;
    setLoadingFile(true);
    fetch(`/api/android/file?path=${encodeURIComponent(selectedPath)}`)
      .then((res) => res.json())
      .then((data: { content?: string }) => {
        if (active) setFileContent(data.content ?? '');
      })
      .catch(() => {
        if (active) setFileContent('Failed to load source file.');
      })
      .finally(() => {
        if (active) setLoadingFile(false);
      });
    return () => {
      active = false;
    };
  }, [selectedPath]);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.path.toLowerCase().includes(q));
  }, [files, searchQuery]);

  const handleCopy = async () => {
    if (!fileContent) return;
    try {
      await navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <section
      id="android-source"
      className="py-12 border-t border-slate-200 dark:border-slate-800/80"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            03. Native Kotlin Source
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Complete Android Studio Project Explorer
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
            Inspect every Jetpack Compose screen, Kotlin BODMAS engine file, AdMob &amp; UMP
            consent integration, DataStore persistence layer, and Gradle release build script.
          </p>
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
          {files.length} source files ·{' '}
          {(files.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)} KB total
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden min-h-[520px]">
        {/* File Tree Sidebar */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col max-h-[520px]">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter Kotlin, Gradle, XML files..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 thin-scrollbar">
            {loadingTree ? (
              <p className="text-xs text-slate-500 p-3">Loading Android project tree...</p>
            ) : filteredFiles.length === 0 ? (
              <p className="text-xs text-slate-500 p-3">No matching files found.</p>
            ) : (
              filteredFiles.map((file) => {
                const active = file.path === selectedPath;
                const fileName = file.path.split('/').pop() || file.path;
                const folder = file.path.includes('/')
                  ? file.path.slice(0, file.path.lastIndexOf('/'))
                  : 'root';
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedPath(file.path)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-start gap-2.5 ${
                      active
                        ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-75" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{fileName}</div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {folder} · {file.lines} lines
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Source Viewer */}
        <div className="lg:col-span-8 flex flex-col max-h-[520px] bg-slate-950 text-slate-100">
          <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs font-mono text-slate-300 truncate">
                android-app/{selectedPath}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy File
                </>
              )}
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 thin-scrollbar">
            {loadingFile ? (
              <p className="text-xs font-mono text-slate-400">Reading source file...</p>
            ) : (
              <pre className="text-xs font-mono leading-relaxed text-slate-200 whitespace-pre">
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
