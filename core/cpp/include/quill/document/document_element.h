#pragma once

#include <string>
#include <memory>
#include <vector>
#include "quill/core/types.h"

namespace quill {

// Base class for all document elements
class DocumentElement {
public:
    DocumentElement();
    virtual ~DocumentElement();

    // Non-copyable, movable
    DocumentElement(const DocumentElement&) = delete;
    DocumentElement& operator=(const DocumentElement&) = delete;
    DocumentElement(DocumentElement&&) = default;
    DocumentElement& operator=(DocumentElement&&) = default;

    // Element identification
    ElementId id() const { return m_id; }
    
    // Element type
    enum class Type {
        Section,
        Paragraph,
        Heading,
        Table,
        Image,
        Shape,
        List,
        PageBreak,
        SectionBreak
    };
    
    virtual Type type() const = 0;
    
    // Parent element
    DocumentElement* parent() const { return m_parent; }
    
    // Children
    const std::vector<std::shared_ptr<DocumentElement>>& children() const { return m_children; }
    
    // Add child
    void addChild(std::shared_ptr<DocumentElement> child);
    
    // Remove child
    void removeChild(ElementId id);
    
    // Find child by ID
    std::shared_ptr<DocumentElement> findChild(ElementId id) const;
    
    // Find descendant by ID
    std::shared_ptr<DocumentElement> findDescendant(ElementId id) const;

    // Visibility
    bool isVisible() const { return m_visible; }
    void setVisible(bool visible) { m_visible = visible; }

protected:
    ElementId m_id;
    DocumentElement* m_parent = nullptr;
    std::vector<std::shared_ptr<DocumentElement>> m_children;
    bool m_visible = true;

    void setParent(DocumentElement* parent) { m_parent = parent; }
};

} // namespace quill
