#include "quill/document/document_element.h"

namespace quill {

DocumentElement::DocumentElement()
    : m_id(generateId()) {
}

DocumentElement::~DocumentElement() = default;

void DocumentElement::addChild(std::shared_ptr<DocumentElement> child) {
    if (child) {
        child->setParent(this);
        m_children.push_back(std::move(child));
    }
}

void DocumentElement::removeChild(ElementId id) {
    auto it = std::find_if(m_children.begin(), m_children.end(),
        [id](const auto& child) { return child->id() == id; });
    
    if (it != m_children.end()) {
        (*it)->setParent(nullptr);
        m_children.erase(it);
    }
}

std::shared_ptr<DocumentElement> DocumentElement::findChild(ElementId id) const {
    auto it = std::find_if(m_children.begin(), m_children.end(),
        [id](const auto& child) { return child->id() == id; });
    
    return (it != m_children.end()) ? *it : nullptr;
}

std::shared_ptr<DocumentElement> DocumentElement::findDescendant(ElementId id) const {
    // First check direct children
    auto found = findChild(id);
    if (found) return found;
    
    // Then check descendants recursively
    for (const auto& child : m_children) {
        found = child->findDescendant(id);
        if (found) return found;
    }
    
    return nullptr;
}

} // namespace quill
