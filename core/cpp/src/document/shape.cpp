#include "quill/document/shape.h"

namespace quill {

Shape::Shape(ShapeType type)
    : m_shapeType(type) {
}

Shape::~Shape() = default;

void Shape::setSize(double width, double height) {
    m_width = width;
    m_height = height;
}

void Shape::setPosition(double x, double y) {
    m_x = x;
    m_y = y;
}

void Shape::addTextRun(const TextRun& run) {
    m_textRuns.push_back(run);
}

void Shape::setLineEndpoints(const LineEndpoint& start, const LineEndpoint& end) {
    m_lineStart = start;
    m_lineEnd = end;
}

} // namespace quill
