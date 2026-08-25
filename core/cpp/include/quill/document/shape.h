#pragma once

#include "document_element.h"
#include "paragraph.h"
#include <string>

namespace quill {

// Shape type
enum class ShapeType {
    Rectangle,
    RoundedRectangle,
    Circle,
    Ellipse,
    Line,
    Arrow,
    Triangle,
    Star,
    Callout,
    Polygon
};

// Shape fill
struct ShapeFill {
    Color color;
    bool hasFill = true;
    double transparency = 0.0;
};

// Shape stroke
struct ShapeStroke {
    Color color;
    double width = 1.0;
    bool hasStroke = true;
};

// Shape shadow
struct ShapeShadow {
    bool hasShadow = false;
    Color color;
    double offsetX = 2.0;
    double offsetY = 2.0;
    double blur = 4.0;
    double transparency = 0.5;
};

// Shape element
class Shape : public DocumentElement {
public:
    Shape(ShapeType type = ShapeType::Rectangle);
    ~Shape() override;

    Type type() const override { return Type::Shape; }

    // Shape type
    ShapeType shapeType() const { return m_shapeType; }
    void setShapeType(ShapeType type) { m_shapeType = type; }

    // Dimensions
    double width() const { return m_width; }
    double height() const { return m_height; }
    void setSize(double width, double height);

    // Position
    double x() const { return m_x; }
    double y() const { return m_y; }
    void setPosition(double x, double y);

    // Rotation
    double rotation() const { return m_rotation; }
    void setRotation(double degrees) { m_rotation = degrees; }

    // Fill
    const ShapeFill& fill() const { return m_fill; }
    void setFill(const ShapeFill& fill) { m_fill = fill; }

    // Stroke
    const ShapeStroke& stroke() const { return m_stroke; }
    void setStroke(const ShapeStroke& stroke) { m_stroke = stroke; }

    // Shadow
    const ShapeShadow& shadow() const { return m_shadow; }
    void setShadow(const ShapeShadow& shadow) { m_shadow = shadow; }

    // Text content
    std::string text() const { return m_text; }
    void setText(const std::string& text) { m_text = text; }
    bool hasText() const { return !m_text.empty(); }

    // Text runs inside shape
    const std::vector<TextRun>& textRuns() const { return m_textRuns; }
    void addTextRun(const TextRun& run);

    // Rounded rectangle corner radius
    double cornerRadius() const { return m_cornerRadius; }
    void setCornerRadius(double radius) { m_cornerRadius = radius; }

    // Line endpoint
    struct LineEndpoint {
        double x = 0.0;
        double y = 0.0;
    };
    
    LineEndpoint lineStart() const { return m_lineStart; }
    LineEndpoint lineEnd() const { return m_lineEnd; }
    void setLineEndpoints(const LineEndpoint& start, const LineEndpoint& end);

    // Arrow
    bool hasArrowStart() const { return m_arrowStart; }
    bool hasArrowEnd() const { return m_arrowEnd; }
    void setArrowStart(bool has) { m_arrowStart = has; }
    void setArrowEnd(bool has) { m_arrowEnd = has; }

private:
    ShapeType m_shapeType;
    double m_x = 0.0;
    double m_y = 0.0;
    double m_width = 100.0;
    double m_height = 100.0;
    double m_rotation = 0.0;
    ShapeFill m_fill;
    ShapeStroke m_stroke;
    ShapeShadow m_shadow;
    std::string m_text;
    std::vector<TextRun> m_textRuns;
    double m_cornerRadius = 0.0;
    LineEndpoint m_lineStart;
    LineEndpoint m_lineEnd;
    bool m_arrowStart = false;
    bool m_arrowEnd = false;
};

} // namespace quill
