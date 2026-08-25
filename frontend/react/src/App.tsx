import { useState, useCallback, useEffect } from 'react';
import { TitleBar } from './components/titlebar/TitleBar';
import { Ribbon } from './components/toolbar/Ribbon';
import { DocumentCanvas } from './components/editor/DocumentCanvas';
import { StatusBar } from './components/panels/StatusBar';
import { NavigationPane } from './components/panels/NavigationPane';
import { PropertiesPanel } from './components/panels/PropertiesPanel';
import { CommentsPanel } from './components/panels/CommentsPanel';
import { FileMenu } from './components/menubar/FileMenu';
import { ContextMenu } from './components/menus/ContextMenu';
import { FindReplaceDialog } from './components/dialogs/FindReplaceDialog';
import { WordCountDialog } from './components/dialogs/WordCountDialog';
import { PageSetupDialog } from './components/dialogs/PageSetupDialog';
import { SymbolPicker } from './components/dialogs/SymbolPicker';
import { AutoCorrectDialog } from './components/dialogs/AutoCorrectDialog';
import { TableGridPicker } from './components/dialogs/TableGridPicker';
import { Ruler } from './components/editor/Ruler';
import { DocumentEngineProvider } from './hooks/useDocumentEngine';
import './styles/App.css';

function App() {
  const [showNavigation, setShowNavigation] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Dialog states
  const [findReplaceMode, setFindReplaceMode] = useState<'find' | 'replace' | null>(null);
  const [showWordCount, setShowWordCount] = useState(false);
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [showAutoCorrect, setShowAutoCorrect] = useState(false);
  const [showTableGrid, setShowTableGrid] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl) {
        switch (e.key.toLowerCase()) {
          case 'f':
            e.preventDefault();
            setFindReplaceMode('find');
            break;
          case 'h':
            e.preventDefault();
            setFindReplaceMode('replace');
            break;
          case 'g':
            e.preventDefault();
            setShowWordCount(true);
            break;
        }
      }
      if (e.key === 'Escape') {
        setFindReplaceMode(null);
        setShowWordCount(false);
        setShowPageSetup(false);
        setShowSymbolPicker(false);
        setShowAutoCorrect(false);
        setShowTableGrid(false);
        setShowFileMenu(false);
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const togglePropertiesPanel = useCallback(() => {
    setShowPropertiesPanel(prev => !prev);
    if (!showPropertiesPanel) setShowCommentsPanel(false);
  }, [showPropertiesPanel]);

  const toggleCommentsPanel = useCallback(() => {
    setShowCommentsPanel(prev => !prev);
    if (!showCommentsPanel) setShowPropertiesPanel(false);
  }, [showCommentsPanel]);

  return (
    <DocumentEngineProvider>
      <div className="app-container" onContextMenu={handleContextMenu}>
        {/* Title Bar */}
        <TitleBar onToggleFileMenu={() => setShowFileMenu(!showFileMenu)} />

        {/* File Menu / Backstage */}
        {showFileMenu && <FileMenu onClose={() => setShowFileMenu(false)} />}

        {/* Ribbon / Toolbar */}
        <Ribbon
          onOpenFindReplace={(mode) => setFindReplaceMode(mode)}
          onOpenWordCount={() => setShowWordCount(true)}
          onOpenPageSetup={() => setShowPageSetup(true)}
          onOpenSymbolPicker={() => setShowSymbolPicker(true)}
          onOpenAutoCorrect={() => setShowAutoCorrect(true)}
          onOpenTableGrid={() => setShowTableGrid(true)}
          onTogglePropertiesPanel={togglePropertiesPanel}
          onToggleCommentsPanel={toggleCommentsPanel}
          propertiesPanelVisible={showPropertiesPanel}
          commentsPanelVisible={showCommentsPanel}
        />

        {/* Ruler */}
        <Ruler zoom={zoom} />

        {/* Main content area */}
        <div className="main-content">
          {/* Navigation Pane */}
          {showNavigation && (
            <NavigationPane onClose={() => setShowNavigation(false)} />
          )}

          {/* Document Canvas */}
          <DocumentCanvas zoom={zoom} />

          {/* Right Panel - Properties or Comments */}
          {showPropertiesPanel && <PropertiesPanel />}
          {showCommentsPanel && <CommentsPanel />}
        </div>

        {/* Status Bar */}
        <StatusBar
          zoom={zoom}
          onZoomChange={setZoom}
          onToggleNavigation={() => setShowNavigation(!showNavigation)}
        />

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            position={contextMenu}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* Dialogs */}
        {findReplaceMode && (
          <FindReplaceDialog
            mode={findReplaceMode}
            onClose={() => setFindReplaceMode(null)}
          />
        )}
        {showWordCount && <WordCountDialog onClose={() => setShowWordCount(false)} />}
        {showPageSetup && <PageSetupDialog onClose={() => setShowPageSetup(false)} />}
        {showSymbolPicker && <SymbolPicker onClose={() => setShowSymbolPicker(false)} />}
        {showAutoCorrect && <AutoCorrectDialog onClose={() => setShowAutoCorrect(false)} />}
        {showTableGrid && <TableGridPicker onClose={() => setShowTableGrid(false)} />}
      </div>
    </DocumentEngineProvider>
  );
}

export default App;
