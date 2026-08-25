#include "quill/document/section.h"
#include "quill/document/table.h"
#include "quill/document/image.h"
#include "quill/document/shape.h"

namespace quill {

PageSize::PageSize(Preset preset) {
    switch (preset) {
        case Preset::Letter:
            width = 8.5;
            height = 11.0;
            break;
        case Preset::A4:
            width = 8.27;  // 210mm
            height = 11.69; // 297mm
            break;
        case Preset::Legal:
            width = 8.5;
            height = 14.0;
            break;
        case Preset::Custom:
            width = 8.5;
            height = 11.0;
            break;
    }
}

PageMargins::PageMargins(double top, double bottom, double left, double right)
    : top(top), bottom(bottom), left(left), right(right) {
}

Section::Section() = default;
Section::~Section() = default;

void Section::setSettings(const SectionSettings& settings) {
    m_settings = settings;
}

std::shared_ptr<Paragraph> Section::addParagraph() {
    auto paragraph = std::make_shared<Paragraph>();
    addChild(paragraph);
    return paragraph;
}

std::shared_ptr<Table> Section::addTable(int rows, int cols) {
    auto table = std::make_shared<Table>(rows, cols);
    addChild(table);
    return table;
}

std::shared_ptr<Image> Section::addImage(const std::string& path) {
    auto image = std::make_shared<Image>(path);
    addChild(image);
    return image;
}

std::shared_ptr<Shape> Section::addShape() {
    auto shape = std::make_shared<Shape>();
    addChild(shape);
    return shape;
}

void Section::addPageBreak() {
    // Create a paragraph with page break
    auto para = addParagraph();
    // Page break will be implemented in Phase 2
}

std::shared_ptr<DocumentElement> Section::findBlock(ElementId id) const {
    return findDescendant(id);
}

std::vector<std::shared_ptr<DocumentElement>> Section::blocks() const {
    return m_children;
}

std::string Section::plainText() const {
    std::string result;
    for (const auto& block : m_children) {
        if (auto para = std::dynamic_pointer_cast<Paragraph>(block)) {
            result += para->plainText() + "\n";
        }
    }
    return result;
}

} // namespace quill
