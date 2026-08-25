#pragma once

#include "document_element.h"
#include "paragraph.h"
#include <memory>

namespace quill {

// Page size
struct PageSize {
    double width = 8.5;   // inches (Letter)
    double height = 11.0; // inches (Letter)
    
    enum class Preset {
        Letter,
        A4,
        Legal,
        Custom
    };
    
    PageSize() = default;
    PageSize(Preset preset);
};

// Page margins
struct PageMargins {
    double top = 1.0;     // inches
    double bottom = 1.0;  // inches
    double left = 1.0;    // inches
    double right = 1.0;   // inches
    double gutter = 0.0;  // inches
    
    PageMargins() = default;
    PageMargins(double top, double bottom, double left, double right);
};

// Page orientation
enum class Orientation {
    Portrait,
    Landscape
};

// Header/Footer content
struct HeaderFooterContent {
    std::vector<TextRun> runs;
    bool isDifferentFirstPage = false;
    bool isDifferentOddEven = false;
};

// Section settings
struct SectionSettings {
    PageSize pageSize;
    PageMargins margins;
    Orientation orientation = Orientation::Portrait;
    int columns = 1;
    bool hasHeader = false;
    bool hasFooter = false;
    HeaderFooterContent header;
    HeaderFooterContent footer;
    int startPageNumber = 1;
};

// Section element - contains blocks and page settings
class Section : public DocumentElement {
public:
    Section();
    ~Section() override;

    Type type() const override { return Type::Section; }

    // Section settings
    const SectionSettings& settings() const { return m_settings; }
    void setSettings(const SectionSettings& settings);

    // Blocks (paragraphs, tables, images, etc.)
    std::shared_ptr<Paragraph> addParagraph();
    std::shared_ptr<Table> addTable(int rows, int cols);
    std::shared_ptr<Image> addImage(const std::string& path);
    std::shared_ptr<Shape> addShape();
    void addPageBreak();

    // Find block by ID
    std::shared_ptr<DocumentElement> findBlock(ElementId id) const;

    // Get all blocks in order
    std::vector<std::shared_ptr<DocumentElement>> blocks() const;

    // Text content
    std::string plainText() const;

    // Header/Footer
    HeaderFooterContent& header() { return m_settings.header; }
    HeaderFooterContent& footer() { return m_settings.footer; }

private:
    SectionSettings m_settings;
};

} // namespace quill
