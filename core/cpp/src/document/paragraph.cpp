#include "quill/document/paragraph.h"

namespace quill {

Paragraph::Paragraph() = default;
Paragraph::~Paragraph() = default;

void Paragraph::addTextRun(const TextRun& run) {
    m_textRuns.push_back(run);
}

void Paragraph::insertTextRun(size_t index, const TextRun& run) {
    if (index <= m_textRuns.size()) {
        m_textRuns.insert(m_textRuns.begin() + index, run);
    }
}

void Paragraph::removeTextRun(size_t index) {
    if (index < m_textRuns.size()) {
        m_textRuns.erase(m_textRuns.begin() + index);
    }
}

TextRun* Paragraph::findTextRun(ElementId id) {
    for (auto& run : m_textRuns) {
        if (run.id == id) return &run;
    }
    return nullptr;
}

std::string Paragraph::plainText() const {
    std::string result;
    for (const auto& run : m_textRuns) {
        result += run.text;
    }
    return result;
}

size_t Paragraph::textLength() const {
    size_t length = 0;
    for (const auto& run : m_textRuns) {
        length += run.text.length();
    }
    return length;
}

void Paragraph::setFormat(const ParagraphFormat& format) {
    m_format = format;
}

void Paragraph::setHeadingLevel(int level) {
    if (level >= 1 && level <= 6) {
        m_headingLevel = level;
        m_isHeading = true;
    }
}

} // namespace quill
