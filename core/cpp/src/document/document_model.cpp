#include "quill/document/document_model.h"
#include "quill/document/metadata.h"
#include "quill/document/section.h"
#include "quill/document/comment.h"
#include "quill/document/revision.h"

namespace quill {

DocumentModel::DocumentModel()
    : m_metadata(std::make_unique<Metadata>()) {
}

DocumentModel::~DocumentModel() = default;

const Metadata& DocumentModel::metadata() const {
    return *m_metadata;
}

Metadata& DocumentModel::metadata() {
    return *m_metadata;
}

void DocumentModel::setMetadata(const Metadata& metadata) {
    *m_metadata = metadata;
    notifyChanged();
}

const std::vector<std::shared_ptr<Section>>& DocumentModel::sections() const {
    return m_sections;
}

std::shared_ptr<Section> DocumentModel::addSection() {
    auto section = std::make_shared<Section>();
    m_sections.push_back(section);
    notifyChanged();
    return section;
}

void DocumentModel::removeSection(ElementId id) {
    auto it = std::find_if(m_sections.begin(), m_sections.end(),
        [id](const auto& section) { return section->id() == id; });
    
    if (it != m_sections.end()) {
        m_sections.erase(it);
        notifyChanged();
    }
}

std::shared_ptr<Section> DocumentModel::findSection(ElementId id) const {
    auto it = std::find_if(m_sections.begin(), m_sections.end(),
        [id](const auto& section) { return section->id() == id; });
    
    return (it != m_sections.end()) ? *it : nullptr;
}

const std::vector<std::shared_ptr<Comment>>& DocumentModel::comments() const {
    return m_comments;
}

std::shared_ptr<Comment> DocumentModel::addComment(const TextRange& range, const std::string& author) {
    auto comment = std::make_shared<Comment>(range, author);
    m_comments.push_back(comment);
    notifyChanged();
    return comment;
}

void DocumentModel::removeComment(ElementId id) {
    auto it = std::find_if(m_comments.begin(), m_comments.end(),
        [id](const auto& comment) { return comment->id() == id; });
    
    if (it != m_comments.end()) {
        m_comments.erase(it);
        notifyChanged();
    }
}

std::shared_ptr<Comment> DocumentModel::findComment(ElementId id) const {
    auto it = std::find_if(m_comments.begin(), m_comments.end(),
        [id](const auto& comment) { return comment->id() == id; });
    
    return (it != m_comments.end()) ? *it : nullptr;
}

const std::vector<std::shared_ptr<Revision>>& DocumentModel::revisions() const {
    return m_revisions;
}

std::shared_ptr<Revision> DocumentModel::addRevision(const TextRange& range, const std::string& author) {
    // Determine revision type based on range
    RevisionType type = RevisionType::Insertion; // Default
    
    auto revision = std::make_shared<Revision>(range, author, type);
    m_revisions.push_back(revision);
    notifyChanged();
    return revision;
}

void DocumentModel::removeRevision(ElementId id) {
    auto it = std::find_if(m_revisions.begin(), m_revisions.end(),
        [id](const auto& revision) { return revision->id() == id; });
    
    if (it != m_revisions.end()) {
        m_revisions.erase(it);
        notifyChanged();
    }
}

std::shared_ptr<DocumentElement> DocumentModel::findElement(ElementId id) const {
    for (const auto& section : m_sections) {
        auto found = section->findDescendant(id);
        if (found) return found;
    }
    return nullptr;
}

void DocumentModel::setChangeCallback(ChangeCallback callback) {
    m_changeCallback = std::move(callback);
}

std::vector<uint8_t> DocumentModel::serialize() const {
    // Placeholder for serialization - will be implemented in Phase 1
    return {};
}

bool DocumentModel::deserialize(const std::vector<uint8_t>& data) {
    // Placeholder for deserialization - will be implemented in Phase 1
    return false;
}

void DocumentModel::clear() {
    m_sections.clear();
    m_comments.clear();
    m_revisions.clear();
    m_metadata = std::make_unique<Metadata>();
    notifyChanged();
}

void DocumentModel::notifyChanged() {
    if (m_changeCallback) {
        m_changeCallback();
    }
}

} // namespace quill
