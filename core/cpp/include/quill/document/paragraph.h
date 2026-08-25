#pragma once

#include "document_element.h"
#include <string>
#include <vector>

namespace quill {

// Text run - a span of text with consistent formatting
struct TextRun {
    ElementId id;
    std::string text;
    // Formatting will be added in Phase 2
    
    TextRun() : id(generateId()) {}
    TextRun(const std::string& text) : id(generateId()), text(text) {}
};

// Paragraph alignment
enum class Alignment {
    Left,
    Center,
    Right,
    Justify
};

// Paragraph formatting
struct ParagraphFormat {
    Alignment alignment = Alignment::Left;
    double leftIndent = 0.0;
    double rightIndent = 0.0;
    double firstLineIndent = 0.0;
    double lineSpacing = 1.0;
    double spaceBefore = 0.0;
    double spaceAfter = 0.0;
    // More formatting will be added in Phase 2
};

// Paragraph element
class Paragraph : public DocumentElement {
public:
    Paragraph();
    ~Paragraph() override;

    Type type() const override { return Type::Paragraph; }

    // Text runs
    const std::vector<TextRun>& textRuns() const { return m_textRuns; }
    void addTextRun(const TextRun& run);
    void insertTextRun(size_t index, const TextRun& run);
    void removeTextRun(size_t index);
    TextRun* findTextRun(ElementId id);

    // Plain text content
    std::string plainText() const;
    size_t textLength() const;

    // Paragraph format
    const ParagraphFormat& format() const { return m_format; }
    void setFormat(const ParagraphFormat& format);

    // Is heading?
    bool isHeading() const { return m_isHeading; }
    void setIsHeading(bool isHeading) { m_isHeading = isHeading; }

    // Heading level (1-6)
    int headingLevel() const { return m_headingLevel; }
    void setHeadingLevel(int level);

private:
    std::vector<TextRun> m_textRuns;
    ParagraphFormat m_format;
    bool m_isHeading = false;
    int m_headingLevel = 1;
};

} // namespace quill
