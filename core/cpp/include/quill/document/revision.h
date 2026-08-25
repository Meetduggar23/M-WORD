#pragma once

#include "document_element.h"
#include <string>
#include <vector>
#include <chrono>

namespace quill {

// Revision type
enum class RevisionType {
    Insertion,
    Deletion,
    FormatChange
};

// Format change details
struct FormatChange {
    // Will be expanded in Phase 2
    std::string description;
};

// Revision element - for track changes
class Revision : public DocumentElement {
public:
    Revision(const TextRange& range, const std::string& author, RevisionType type);
    ~Revision() override;

    Type type() const override { return Type::Paragraph; }

    // Revision type
    RevisionType revisionType() const { return m_type; }

    // Range
    const TextRange& range() const { return m_range; }

    // Author
    const std::string& author() const { return m_author; }

    // Timestamp
    std::chrono::system_clock::time_point timestamp() const { return m_timestamp; }

    // Content (for insertions, the text that was inserted)
    const std::string& content() const { return m_content; }
    void setContent(const std::string& content) { m_content = content; }

    // Accepted/Rejected status
    enum class Status {
        Pending,
        Accepted,
        Rejected
    };
    
    Status status() const { return m_status; }
    void setStatus(Status status) { m_status = status; }

    // Format changes
    const std::vector<FormatChange>& formatChanges() const { return m_formatChanges; }
    void addFormatChange(const FormatChange& change);

    // Display color based on author
    Color displayColor() const { return m_displayColor; }
    void setDisplayColor(const Color& color) { m_displayColor = color; }

private:
    TextRange m_range;
    std::string m_author;
    RevisionType m_type;
    std::chrono::system_clock::time_point m_timestamp;
    std::string m_content;
    Status m_status = Status::Pending;
    std::vector<FormatChange> m_formatChanges;
    Color m_displayColor;
};

} // namespace quill
