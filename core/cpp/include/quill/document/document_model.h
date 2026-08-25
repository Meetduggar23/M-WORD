#pragma once

#include <memory>
#include <vector>
#include <string>
#include <map>
#include <functional>
#include "quill/core/types.h"

namespace quill {

// Forward declarations
class Section;
class Paragraph;
class Table;
class Image;
class Shape;
class Comment;
class Revision;
class Metadata;

// Document model - the core of the document
class DocumentModel {
public:
    DocumentModel();
    ~DocumentModel();

    // Non-copyable, movable
    DocumentModel(const DocumentModel&) = delete;
    DocumentModel& operator=(const DocumentModel&) = delete;
    DocumentModel(DocumentModel&&) = default;
    DocumentModel& operator=(DocumentModel&&) = default;

    // Metadata
    const Metadata& metadata() const;
    Metadata& metadata();
    void setMetadata(const Metadata& metadata);

    // Sections
    const std::vector<std::shared_ptr<Section>>& sections() const;
    std::shared_ptr<Section> addSection();
    void removeSection(ElementId id);
    std::shared_ptr<Section> findSection(ElementId id) const;

    // Comments
    const std::vector<std::shared_ptr<Comment>>& comments() const;
    std::shared_ptr<Comment> addComment(const TextRange& range, const std::string& author);
    void removeComment(ElementId id);
    std::shared_ptr<Comment> findComment(ElementId id) const;

    // Revisions (for track changes)
    const std::vector<std::shared_ptr<Revision>>& revisions() const;
    std::shared_ptr<Revision> addRevision(const TextRange& range, const std::string& author);
    void removeRevision(ElementId id);

    // Element lookup
    std::shared_ptr<DocumentElement> findElement(ElementId id) const;

    // Event callbacks
    using ChangeCallback = std::function<void()>;
    void setChangeCallback(ChangeCallback callback);

    // Serialization
    std::vector<uint8_t> serialize() const;
    bool deserialize(const std::vector<uint8_t>& data);

    // Clear document
    void clear();

private:
    std::unique_ptr<Metadata> m_metadata;
    std::vector<std::shared_ptr<Section>> m_sections;
    std::vector<std::shared_ptr<Comment>> m_comments;
    std::vector<std::shared_ptr<Revision>> m_revisions;
    ChangeCallback m_changeCallback;

    void notifyChanged();
};

} // namespace quill
