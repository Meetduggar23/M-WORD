#pragma once

#include "document_element.h"
#include <string>
#include <vector>
#include <chrono>

namespace quill {

// Comment reply
struct CommentReply {
    ElementId id;
    std::string author;
    std::string content;
    std::chrono::system_clock::time_point timestamp;
    bool resolved = false;

    CommentReply() : id(generateId()) {}
};

// Comment element
class Comment : public DocumentElement {
public:
    Comment(const TextRange& range, const std::string& author);
    ~Comment() override;

    Type type() const override { return Type::Paragraph; } // Comments don't have their own type

    // Comment range
    const TextRange& range() const { return m_range; }
    void setRange(const TextRange& range) { m_range = range; }

    // Author
    const std::string& author() const { return m_author; }

    // Content
    const std::string& content() const { return m_content; }
    void setContent(const std::string& content) { m_content = content; }

    // Timestamp
    std::chrono::system_clock::time_point timestamp() const { return m_timestamp; }

    // Resolved status
    bool isResolved() const { return m_resolved; }
    void setResolved(bool resolved) { m_resolved = resolved; }

    // Replies
    const std::vector<CommentReply>& replies() const { return m_replies; }
    CommentReply addReply(const std::string& author, const std::string& content);
    void removeReply(ElementId id);
    void updateReply(ElementId id, const std::string& content);

    // Selection highlight color
    Color highlightColor() const { return m_highlightColor; }
    void setHighlightColor(const Color& color) { m_highlightColor = color; }

private:
    TextRange m_range;
    std::string m_author;
    std::string m_content;
    std::chrono::system_clock::time_point m_timestamp;
    bool m_resolved = false;
    std::vector<CommentReply> m_replies;
    Color m_highlightColor;
};

} // namespace quill
