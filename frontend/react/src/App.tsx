import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Ribbon } from './components/toolbar/Ribbon';
import { DocumentCanvas } from './components/editor/DocumentCanvas';
import { Ruler } from './components/editor/Ruler';
import FocusHUD from './components/editor/FocusHUD';
import { StatusBar } from './components/panels/StatusBar';
import { NavigationPane } from './components/panels/NavigationPane';
import { NavRail } from './components/panels/NavRail';
import { PropertiesPanel } from './components/panels/PropertiesPanel';
import { CommentsPanel } from './components/panels/CommentsPanel';
import { HealthPanel } from './components/panels/HealthPanel';
import { DesignInspectorPanel } from './components/panels/DesignInspectorPanel';
import { FileMenu } from './components/menubar/FileMenu';
import { ContextMenu } from './components/menus/ContextMenu';
import { FindReplaceDialog } from './components/dialogs/FindReplaceDialog';
import { WordCountDialog } from './components/dialogs/WordCountDialog';
import { PageSetupDialog } from './components/dialogs/PageSetupDialog';
import { SymbolPicker } from './components/dialogs/SymbolPicker';
import { AutoCorrectDialog } from './components/dialogs/AutoCorrectDialog';
import { TableGridPicker } from './components/dialogs/TableGridPicker';
import { SettingsDialog } from './components/dialogs/SettingsDialog';
import { CommandPalette } from './components/command/CommandPalette';
import { CleanupDialog } from './components/dialogs/CleanupDialog';
import { DocumentTestDialog } from './components/dialogs/DocumentTestDialog';
import { PasteOptionsDialog } from './components/dialogs/PasteOptionsDialog';
import { CodeBlockDialog } from './components/dialogs/CodeBlockDialog';
import { TimelineDialog, DiffDialog } from './components/dialogs/TimelineDialog';
import { AnalyticsDialog } from './components/dialogs/AnalyticsDialog';
import { GeneratorDialog } from './components/dialogs/GeneratorDialog';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider, useToast } from './components/toast/Toast';
import { DocumentEngineProvider, useDocumentEngine } from './hooks/useDocumentEngine';
import { DocumentBrainProvider } from './features/brain/DocumentBrainProvider';
import { UIProvider, useUI } from './store/uiStore';
import { AuthProvider, useAuth } from './store/authStore';
import { AuthPage } from './components/auth/AuthPage';
import { ProfileDropdown } from './components/auth/ProfileDropdown';
import { ProfilePage } from './components/auth/ProfilePage';
import { AIPanel } from './components/ai/AIPanel';
import { StartPage, TemplateDef } from './components/documents/StartPage';
import { DocumentTabs, DocTab } from './components/documents/DocumentTabs';
import { FloatingToolbar } from './components/editor/FloatingToolbar';
import { TitleBar, SaveStatus } from './components/titlebar/TitleBar';
import { AppPrefs, loadPrefs, loadRecents, removeRecent, savePrefs, upsertRecent, RecentDoc } from './services/storage';
import { PasteCandidate, PasteMode, htmlToCleanBlocks, textToRows } from './features/text/smartPaste';
import { addWordsToday } from './features/history/writingGoal';
import './styles/App.css';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DocumentEngineProvider>
          <DocumentBrainProvider>
            <UIProvider>
              <AuthProvider>
                <AppShell />
              </AuthProvider>
            </UIProvider>
          </DocumentBrainProvider>
        </DocumentEngineProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

/* ============================================================
   Application shell — owns session state (tabs, saves, dialogs)
   ============================================================ */

function generateId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Populate a freshly created document with starter content for a template. */
function applyTemplate(
  engine: ReturnType<typeof useDocumentEngine>,
  template: TemplateDef,
): void {
  template.blocks.forEach((block, i) => {
    if (i > 0) engine.insertParagraph();
    if (block.text) engine.insertText(block.text);
    if (block.style && block.style !== 'Normal') engine.applyStyle(block.style);
  });
}

const AppShell: React.FC = () => {
  const engine = useDocumentEngine();
  const ui = useUI();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const [showAuth, setShowAuth] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);

  /* ---------- Session state ---------- */
  const [tabs, setTabs] = useState<DocTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [prefs, setPrefsState] = useState<AppPrefs>(() => loadPrefs());
  const [recents, setRecents] = useState<RecentDoc[]>(() => loadRecents());
  const [currentPage, setCurrentPage] = useState(1);
  const [pasteCandidate, setPasteCandidate] = useState<PasteCandidate | null>(null);

  /* Focus session tracking */
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionWords, setSessionWords] = useState(0);
  const lastWordCountRef = useRef(0);

  const suppressDirtyRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const saveStatusRef = useRef<SaveStatus>('saved');
  const handleSaveRef = useRef<(() => void) | null>(null);
  saveStatusRef.current = saveStatus;

  /* ---------- Preferences persistence ---------- */
  const updatePrefs = useCallback((next: AppPrefs) => {
    setPrefsState(next);
    savePrefs(next);
  }, []);

  /* ---------- Dirty tracking ---------- */
  useEffect(() => {
    const off = engine.engine.on('document-changed', () => {
      if (!suppressDirtyRef.current) {
        setSaveStatus((s) => (s === 'saving' ? s : 'unsaved'));
      }
      // Writing goal: count only growth
      const words = engine.getWordCount();
      const delta = words - lastWordCountRef.current;
      lastWordCountRef.current = words;
      if (delta > 0) {
        addWordsToday(delta);
        setSessionWords((w) => w + delta);
      }
    });
    return off;
  }, [engine]);

  /* ---------- Focus session timer ---------- */
  useEffect(() => {
    if (!ui.focusMode) return;
    const interval = window.setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(interval);
  }, [ui.focusMode]);

  useEffect(() => {
    if (ui.focusMode) {
      setSessionSeconds(0);
      setSessionWords(0);
      lastWordCountRef.current = engine.getWordCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.focusMode]);

  /* ---------- File menu toggle from title bar ---------- */
  useEffect(() => {
    const onToggleFileMenu = () => setShowFileMenu((o) => !o);
    window.addEventListener('word:toggle-file-menu', onToggleFileMenu);
    return () => window.removeEventListener('word:toggle-file-menu', onToggleFileMenu);
  }, []);

  /* ---------- Smart paste interception ---------- */
  useEffect(() => {
    const onSmartPaste = (e: Event) => {
      const candidate = (e as CustomEvent<PasteCandidate>).detail;
      if (!candidate) return;
      setPasteCandidate(candidate);
      ui.openDialog('pasteOptions');
    };
    window.addEventListener('word:smart-paste', onSmartPaste);
    return () => window.removeEventListener('word:smart-paste', onSmartPaste);
  }, [ui]);

  const applyPasteMode = useCallback((mode: PasteMode) => {
    if (!pasteCandidate) return;
    const candidate = pasteCandidate;
    setPasteCandidate(null);
    ui.closeDialog();

    switch (mode) {
      case 'keep':
      case 'plain':
        engine.insertText(candidate.text);
        break;
      case 'match':
      case 'clean': {
        const blocks = candidate.html
          ? htmlToCleanBlocks(candidate.html)
          : [{ kind: 'paragraph' as const, text: candidate.text }];
        for (const b of blocks) {
          switch (b.kind) {
            case 'heading':
              engine.insertText(b.text);
              engine.applyStyle(`Heading${Math.min(3, b.level ?? 1)}`);
              engine.insertParagraph();
              break;
            case 'bullet':
              engine.insertText(b.text);
              engine.setBulletList();
              engine.insertParagraph();
              break;
            case 'numbered':
              engine.insertText(b.text);
              engine.setNumberedList();
              engine.insertParagraph();
              break;
            case 'table':
              if (b.rows?.length) engine.insertTableWithData(b.rows);
              break;
            default:
              engine.insertText(b.text);
              engine.insertParagraph();
          }
        }
        break;
      }
      case 'table': {
        const { rows } = textToRows(candidate.text);
        engine.insertTableWithData(rows);
        break;
      }
    }
  }, [pasteCandidate, engine, ui]);

  /* ---------- Tab helpers ---------- */
  /** Write the live engine document back into the currently active tab. */
  const stashActive = useCallback((currentTabs: DocTab[], currentId: string | null) => {
    if (!currentId) return currentTabs;
    const snapshot = engine.exportJSON();
    return currentTabs.map((t) =>
      t.id === currentId ? { ...t, snapshot, title: t.title || engine.document?.metadata.title || '' } : t,
    );
  }, [engine]);

  /** Load a tab's document into the engine without marking the app dirty. */
  const loadIntoEngine = useCallback((tab: DocTab) => {
    suppressDirtyRef.current = true;
    try {
      if (tab.snapshot) {
        engine.importJSON(tab.snapshot);
      } else {
        engine.newDocument();
      }
      engine.setDocumentTitle(tab.title || 'Untitled Document');
    } finally {
      // Let queued engine events flush before re-enabling dirty tracking
      window.setTimeout(() => { suppressDirtyRef.current = false; }, 0);
    }
  }, [engine]);

  const openTab = useCallback((tab: DocTab) => {
    setTabs([...stashActive(tabs, activeTabId), tab]);
    loadIntoEngine(tab);
    setActiveTabId(tab.id);
    setSaveStatus('saved');
  }, [tabs, activeTabId, loadIntoEngine, stashActive]);

  const createNewDocument = useCallback((template?: TemplateDef) => {
    const id = generateId();
    const title = template ? template.name : 'Untitled Document';

    suppressDirtyRef.current = true;
    try {
      engine.newDocument();
      engine.setDocumentTitle(title);
      if (template) applyTemplate(engine, template);
    } finally {
      window.setTimeout(() => { suppressDirtyRef.current = false; }, 0);
    }

    setTabs([...stashActive(tabs, activeTabId), { id, title, snapshot: null, dirty: false }]);
    setActiveTabId(id);
    setSaveStatus('saved');
    setShowFileMenu(false);
  }, [tabs, activeTabId, engine, stashActive]);

  const selectTab = useCallback((id: string) => {
    if (id === activeTabId) return;
    const stashed = stashActive(tabs, activeTabId);
    const target = stashed.find((t) => t.id === id);
    if (!target) return;
    loadIntoEngine(target);
    setTabs(stashed);
    setActiveTabId(id);
    setSaveStatus('saved');
  }, [tabs, activeTabId, loadIntoEngine, stashActive]);

  const closeTab = useCallback((id: string) => {
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const next = tabs.filter((t) => t.id !== id);
    if (id === activeTabId) {
      const neighbor = next[Math.min(idx, next.length - 1)];
      if (neighbor) {
        loadIntoEngine(neighbor);
        setActiveTabId(neighbor.id);
      } else {
        setActiveTabId(null);
      }
    }
    setTabs(next);
  }, [tabs, activeTabId, loadIntoEngine]);

  /* ---------- Saving ---------- */
  const handleSave = useCallback(() => {
    if (!activeTabId) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    setSaveStatus('saving');
    const json = engine.exportJSON();
    const title = engine.document?.metadata.title || 'Untitled Document';

    saveTimerRef.current = window.setTimeout(() => {
      setSaveStatus('saved');
      if (prefs.autosave) {
        setRecents(upsertRecent(activeTabId, title, json));
      }
      // Version history: keep a rolling snapshot on each manual save
      if (engine.document) {
        void import('./features/history/snapshots').then(({ addSnapshot }) => {
          addSnapshot(engine.document!.id, { title, data: json, words: engine.getWordCount(), label: 'Save' });
        });
      }
      setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, snapshot: json, dirty: false, title } : t)));
      toast('success', 'Document saved', `“${title}” was saved on this device.`);
    }, 650);
  }, [activeTabId, engine, prefs.autosave, toast]);

  handleSaveRef.current = handleSave;

  /* ---------- Global keyboard shortcuts ----------
     The editor surface handles text-level keys (B/I/U/Z/Y/A/K…) itself and
     calls preventDefault; this handler skips anything already consumed. */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const mod = e.ctrlKey || e.metaKey;

      if (mod) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault();
            ui.openDialog('commandPalette');
            return;
          case 'p':
            e.preventDefault();
            if (e.shiftKey) ui.openDialog('commandPalette');
            else window.print();
            return;
          case 'n':
            e.preventDefault();
            createNewDocument();
            return;
          case 'o':
            e.preventDefault();
            engine.openDocument();
            return;
          case 's':
            e.preventDefault();
            if (e.shiftKey) setShowFileMenu(true);
            else handleSave();
            return;
          case 'f':
            e.preventDefault();
            ui.openDialog('find');
            return;
          case 'h':
            e.preventDefault();
            ui.openDialog('replace');
            return;
        }
      }

      if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
        return;
      }

      if (e.key === 'Escape') {
        if (ui.dialog) {
          ui.closeDialog();
        } else if (showFileMenu) {
          setShowFileMenu(false);
        } else if (ui.focusMode) {
          ui.setFocusMode(false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [createNewDocument, engine, handleSave, showFileMenu, ui]);

  /* ---------- Current page tracking (scroll based) ---------- */
  useEffect(() => {
    const wrapper = document.querySelector('.document-canvas-wrapper');
    if (!wrapper) return;

    const pages = Math.max(1, Math.ceil(engine.getWordCount() / 320));
    const onScroll = () => {
      const el = wrapper as HTMLElement;
      const range = el.scrollHeight - el.clientHeight;
      const frac = range > 0 ? el.scrollTop / range : 0;
      setCurrentPage(Math.min(pages, Math.floor(frac * pages) + 1));
    };
    onScroll();
    wrapper.addEventListener('scroll', onScroll, { passive: true });
    return () => wrapper.removeEventListener('scroll', onScroll);
  }, [engine.document, engine]);

  const pageCount = Math.max(1, Math.ceil(engine.getWordCount() / 320));

  /* ---------- Window title + unsaved guard ---------- */
  useEffect(() => {
    const title = engine.document?.metadata.title;
    document.title = title && activeTabId ? `${title} — WORD` : 'WORD';
  }, [engine.document?.metadata.title, activeTabId]);

  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [saveStatus]);

  /* ---------- Silent autosave into recents ---------- */
  useEffect(() => {
    if (!prefs.autosave) return;
    const interval = window.setInterval(() => {
      if (saveStatusRef.current === 'unsaved' && activeTabId) {
        handleSaveRef.current?.();
      }
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [prefs.autosave, activeTabId]);

  /* ---------- Canvas interactions ---------- */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.document-canvas')) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  }, []);

  /* ---------- Rendering ---------- */
  const showStart = tabs.length === 0 || !activeTabId;

  return (
    <div className="app-container" onContextMenu={handleContextMenu}>
      {!ui.focusMode && !showStart && (
        <DocumentTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onSelect={selectTab}
          onClose={closeTab}
          onNew={() => createNewDocument()}
        />
      )}

      <div style={{ position: 'relative' }}>
        <TitleBar saveStatus={saveStatus} onSave={handleSave} onProfileClick={() => {
          if (user) {
            setShowProfileDropdown((o) => !o);
          } else {
            setShowAuth(true);
          }
        }} />
        {showProfileDropdown && user && (
          <ProfileDropdown
            onOpenProfile={() => { setShowProfilePage(true); setShowProfileDropdown(false); }}
            onOpenSettings={() => { ui.openDialog('settings'); setShowProfileDropdown(false); }}
            onClose={() => setShowProfileDropdown(false)}
          />
        )}
      </div>

      {!showStart && !showFileMenu && (
        <>
          {/* Ribbon */}
          {!ui.focusMode && (
            <Ribbon onOpenFileMenu={() => setShowFileMenu(true)} />
          )}

          {/* Ruler */}
          {!ui.focusMode && ui.showRuler && <Ruler zoom={ui.zoom} />}
        </>
      )}

      {/* Main content area */}
      {showFileMenu ? (
        <div className="main-content">
          <FileMenu
            onClose={() => setShowFileMenu(false)}
            onOpenSettings={() => ui.openDialog('settings')}
            onOpenProfile={() => { setShowProfilePage(true); setShowFileMenu(false); }}
            onLogout={() => { logout(); setShowFileMenu(false); }}
          />
        </div>
      ) : showStart ? (
        <div className="main-content">
          <StartPage
            recents={recents}
            userName={user?.name || ''}
            isAuthenticated={!!user}
            onLogin={() => setShowAuth(true)}
            onOpenTemplate={(tpl) => createNewDocument(tpl)}
            onOpenRecent={(doc) => {
              const tab: DocTab = {
                id: generateId(),
                title: doc.title,
                snapshot: doc.snapshot,
                dirty: false,
              };
              openTab(tab);
              // The reopened doc gets a fresh session id — drop the stale entry
              // so saving later doesn't leave duplicates in the list.
              setRecents(removeRecent(doc.id));
              toast('info', 'Document opened', `“${doc.title}” loaded from recent files.`);
            }}
            onRemoveRecent={(id) => setRecents(removeRecent(id))}
            onOpenFile={() => engine.openDocument()}
            onOpenGenerator={() => ui.openDialog('generator')}
            onOpenSettings={() => ui.openDialogWith('settings', { initialTab: 'shortcuts' })}
            onOpenSettingsPage={() => ui.openDialog('settings')}
            onOpenCommandCenter={() => ui.openDialog('commandPalette')}
          />
        </div>
      ) : (
        <div className={`main-content${ui.focusMode ? ' focus-mode' : ''}`}>
          {/* Left navigation rail */}
          {!ui.focusMode && <NavRail />}

          {/* Navigation Pane */}
          {!ui.focusMode && ui.navigationOpen && (
            <NavigationPane onClose={() => ui.setNavigationOpen(false)} />
          )}

          {/* Document Canvas */}
          <DocumentCanvas zoom={ui.zoom} />

          {/* Right panels — mutually exclusive */}
          {!ui.focusMode && ui.rightPanel === 'properties' && <PropertiesPanel />}
          {!ui.focusMode && ui.rightPanel === 'comments' && <CommentsPanel />}
          {!ui.focusMode && ui.rightPanel === 'ai' && <AIPanel />}
          {!ui.focusMode && ui.rightPanel === 'health' && <HealthPanel />}
          {!ui.focusMode && ui.rightPanel === 'inspector' && <DesignInspectorPanel />}
        </div>
      )}

      {/* Status Bar */}
      {!showStart && !ui.focusMode && (
        <StatusBar saveStatus={saveStatus} currentPage={currentPage} pageCount={pageCount} />
      )}

      {/* Contextual floating toolbar for selections */}
      {!showStart && <FloatingToolbar />}

      {/* Focus-mode HUD + exit affordance */}
      {ui.focusMode && !showStart && (
        <FocusHUD sessionWords={sessionWords} sessionSeconds={sessionSeconds} dailyGoal={prefs.dailyWordGoal} />
      )}
      {ui.focusMode && (
        <button
          className="focus-exit"
          onClick={() => ui.setFocusMode(false)}
          title="Exit Focus Mode (Esc)"
          aria-label="Exit focus mode"
        >
          <X size={13} strokeWidth={2.4} />
          Exit Focus
        </button>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)} />
      )}

      {/* Dialogs */}
      {(ui.dialog === 'find' || ui.dialog === 'replace') && (
        <FindReplaceDialog
          key={ui.dialog}
          mode={ui.dialog}
          onClose={() => ui.closeDialog()}
        />
      )}
      {ui.dialog === 'wordCount' && <WordCountDialog onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'pageSetup' && <PageSetupDialog onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'symbolPicker' && <SymbolPicker onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'autoCorrect' && <AutoCorrectDialog onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'tableGrid' && <TableGridPicker onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'settings' && (
        <SettingsDialog prefs={prefs} onPrefsChange={updatePrefs} onClose={() => ui.closeDialog()} initialTab={(ui.dialogPayload as { initialTab?: string } | null)?.initialTab as 'shortcuts' | undefined} />
      )}

      {/* Intelligent-feature dialogs */}
      {ui.dialog === 'commandPalette' && <CommandPalette onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'cleanup' && <CleanupDialog onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'documentTest' && <DocumentTestDialog onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'pasteOptions' && pasteCandidate && (
        <PasteOptionsDialog
          candidate={pasteCandidate}
          onPick={applyPasteMode}
          onClose={() => {
            setPasteCandidate(null);
            ui.closeDialog();
          }}
        />
      )}
      {ui.dialog === 'codeBlock' && (
        <CodeBlockDialog
          initialTab={(ui.dialogPayload as { tab?: 'code' | 'json' } | null)?.tab ?? 'code'}
          onClose={() => ui.closeDialog()}
        />
      )}
      {ui.dialog === 'timeline' && <TimelineDialog onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'diff' && <DiffDialog onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'analytics' && <AnalyticsDialog onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'generator' && <GeneratorDialog onClose={() => ui.closeDialog()} />}

      {/* Auth page overlay */}
      {showAuth && <AuthPage onBack={() => setShowAuth(false)} />}

      {/* Profile page overlay */}
      {showProfilePage && <ProfilePage onClose={() => setShowProfilePage(false)} />}
    </div>
  );
};

export default App;
