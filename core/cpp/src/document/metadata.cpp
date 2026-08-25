#include "quill/document/metadata.h"

namespace quill {

Metadata::Metadata()
    : m_createdAt(std::chrono::system_clock::now())
    , m_modifiedAt(std::chrono::system_clock::now()) {
}

Metadata::~Metadata() = default;

} // namespace quill
