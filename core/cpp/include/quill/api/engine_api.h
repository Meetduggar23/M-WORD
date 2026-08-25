#pragma once

#include <string>
#include <memory>
#include <functional>
#include <vector>
#include "quill/core/types.h"
#include "quill/document/document_model.h"

namespace quill {

// Forward declarations
class DocumentModel;

// Engine API - main interface for the document engine
class EngineAPI {
public:
    EngineAPI();
    ~EngineAPI();

    // Non-copyable
    EngineAPI(const EngineAPI&) = delete;
    EngineAPI& operator=(const EngineAPI&) = delete;

    // Initialize engine
    bool initialize();
    void shutdown();

    // Document operations
    std::shared_ptr<DocumentModel> createDocument();
    std::shared_ptr<DocumentModel> openDocument(const std::string& path);
    bool saveDocument(DocumentModel& doc, const std::string& path);
    bool saveDocumentAs(DocumentModel& doc, const std::string& path);

    // Text operations
    bool insertText(DocumentModel& doc, const TextPosition& pos, const std::string& text);
    bool deleteText(DocumentModel& doc, const TextRange& range);
    bool replaceText(DocumentModel& doc, const TextRange& range, const std::string& newText);

    // Formatting (Phase 2)
    // bool applyFormatting(DocumentModel& doc, const TextRange& range, const CharacterFormatting& fmt);

    // Selection operations
    TextRange getSelection(DocumentModel& doc) const;
    void setSelection(DocumentModel& doc, const TextRange& range);

    // Table operations (Phase 3)
    ElementId insertTable(DocumentModel& doc, int rows, int cols);
    bool addTableRow(DocumentModel& doc, ElementId tableId);
    bool removeTableRow(DocumentModel& doc, ElementId tableId, int row);
    bool addTableColumn(DocumentModel& doc, ElementId tableId);
    bool removeTableColumn(DocumentModel& doc, ElementId tableId, int col);
    bool mergeTableCells(DocumentModel& doc, ElementId tableId, int startRow, int startCol, int endRow, int endCol);
    bool splitTableCell(DocumentModel& doc, ElementId tableId, int row, int col);

    // Image operations (Phase 3)
    ElementId insertImage(DocumentModel& doc, const std::string& path);
    bool resizeImage(DocumentModel& doc, ElementId imageId, double width, double height);
    bool moveImage(DocumentModel& doc, ElementId imageId, double x, double y);
    bool setImageTextWrapping(DocumentModel& doc, ElementId imageId, TextWrapping wrapping);

    // Undo/Redo
    bool canUndo(DocumentModel& doc) const;
    bool canRedo(DocumentModel& doc) const;
    bool undo(DocumentModel& doc);
    bool redo(DocumentModel& doc);

    // Find and Replace
    struct SearchResult {
        TextRange range;
        std::string context;
    };
    
    std::vector<SearchResult> findText(DocumentModel& doc, const std::string& query, bool caseSensitive = false, bool wholeWord = false);
    int replaceAll(DocumentModel& doc, const std::string& find, const std::string& replace, bool caseSensitive = false, bool wholeWord = false);

    // Comments (Phase 4)
    ElementId addComment(DocumentModel& doc, const TextRange& range, const std::string& author, const std::string& text);
    bool resolveComment(DocumentModel& doc, ElementId commentId);
    bool deleteComment(DocumentModel& doc, ElementId commentId);

    // Track Changes (Phase 4)
    bool enableTrackChanges(DocumentModel& doc, bool enable);
    bool isTrackChangesEnabled(DocumentModel& doc) const;
    bool acceptRevision(DocumentModel& doc, ElementId revisionId);
    bool rejectRevision(DocumentModel& doc, ElementId revisionId);
    int acceptAllRevisions(DocumentModel& doc);
    int rejectAllRevisions(DocumentModel& doc);

    // Export
    bool exportPDF(DocumentModel& doc, const std::string& path);
    bool exportHTML(DocumentModel& doc, const std::string& path);
    bool exportDOCX(DocumentModel& doc, const std::string& path);
    bool exportTXT(DocumentModel& doc, const std::string& path);

    // Import
    bool importDOCX(const std::string& path, DocumentModel& doc);
    bool importHTML(const std::string& path, DocumentModel& doc);
    bool importTXT(const std::string& path, DocumentModel& doc);

    // Statistics
    int getWordCount(DocumentModel& doc) const;
    int getCharacterCount(DocumentModel& doc) const;
    int getPageCount(DocumentModel& doc) const;

    // Page layout
    void calculatePageLayout(DocumentModel& doc);

    // Event callbacks
    using DocumentChangedCallback = std::function<void(DocumentModel&)>;
    using SelectionChangedCallback = std::function<void(const TextRange&)>;
    
    void setDocumentChangedCallback(DocumentChangedCallback callback);
    void setSelectionChangedCallback(SelectionChangedCallback callback);

    // Version
    static const char* version();

private:
    class Impl;
    std::unique_ptr<Impl> m_impl;
};

} // namespace quill
