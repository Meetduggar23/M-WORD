#pragma once

#include <string>
#include <chrono>
#include <vector>

namespace quill {

// Document metadata
class Metadata {
public:
    Metadata();
    ~Metadata();

    // Basic properties
    const std::string& title() const { return m_title; }
    void setTitle(const std::string& title) { m_title = title; }

    const std::string& author() const { return m_author; }
    void setAuthor(const std::string& author) { m_author = author; }

    const std::string& subject() const { return m_subject; }
    void setSubject(const std::string& subject) { m_subject = subject; }

    const std::string& keywords() const { return m_keywords; }
    void setKeywords(const std::string& keywords) { m_keywords = keywords; }

    const std::string& company() const { return m_company; }
    void setCompany(const std::string& company) { m_company = company; }

    // Language
    const std::string& language() const { return m_language; }
    void setLanguage(const std::string& language) { m_language = language; }

    // Timestamps
    std::chrono::system_clock::time_point createdAt() const { return m_createdAt; }
    void setCreatedAt(std::chrono::system_clock::time_point time) { m_createdAt = time; }

    std::chrono::system_clock::time_point modifiedAt() const { return m_modifiedAt; }
    void setModifiedAt(std::chrono::system_clock::time_point time) { m_modifiedAt = time; }

    // Document version
    int version() const { return m_version; }
    void setVersion(int version) { m_version = version; }

    // Statistics
    int wordCount() const { return m_wordCount; }
    void setWordCount(int count) { m_wordCount = count; }

    int characterCount() const { return m_characterCount; }
    void setCharacterCount(int count) { m_characterCount = count; }

    int pageCount() const { return m_pageCount; }
    void setPageCount(int count) { m_pageCount = count; }

private:
    std::string m_title;
    std::string m_author;
    std::string m_subject;
    std::string m_keywords;
    std::string m_company;
    std::string m_language = "en-US";
    std::chrono::system_clock::time_point m_createdAt;
    std::chrono::system_clock::time_point m_modifiedAt;
    int m_version = 1;
    int m_wordCount = 0;
    int m_characterCount = 0;
    int m_pageCount = 0;
};

} // namespace quill
