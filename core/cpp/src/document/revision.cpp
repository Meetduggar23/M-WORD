#include "quill/document/revision.h"

namespace quill {

Revision::Revision(const TextRange& range, const std::string& author, RevisionType type)
    : m_range(range)
    , m_author(author)
    , m_type(type)
    , m_timestamp(std::chrono::system_clock::now()) {
}

Revision::~Revision() = default;

void Revision::addFormatChange(const FormatChange& change) {
    m_formatChanges.push_back(change);
}

} // namespace quill
