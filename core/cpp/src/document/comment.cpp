#include "quill/document/comment.h"

namespace quill {

Comment::Comment(const TextRange& range, const std::string& author)
    : m_range(range)
    , m_author(author)
    , m_timestamp(std::chrono::system_clock::now()) {
}

Comment::~Comment() = default;

CommentReply Comment::addReply(const std::string& author, const std::string& content) {
    CommentReply reply;
    reply.author = author;
    reply.content = content;
    reply.timestamp = std::chrono::system_clock::now();
    
    m_replies.push_back(reply);
    return reply;
}

void Comment::removeReply(ElementId id) {
    auto it = std::find_if(m_replies.begin(), m_replies.end(),
        [id](const auto& reply) { return reply.id == id; });
    
    if (it != m_replies.end()) {
        m_replies.erase(it);
    }
}

void Comment::updateReply(ElementId id, const std::string& content) {
    for (auto& reply : m_replies) {
        if (reply.id == id) {
            reply.content = content;
            return;
        }
    }
}

} // namespace quill
