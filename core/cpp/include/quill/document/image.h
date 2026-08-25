#pragma once

#include "document_element.h"
#include <string>

namespace quill {

// Image format
enum class ImageFormat {
    PNG,
    JPEG,
    WebP,
    SVG,
    GIF
};

// Text wrapping mode
enum class TextWrapping {
    Inline,
    Square,
    Tight,
    Through,
    TopAndBottom,
    BehindText,
    InFrontOfText
};

// Image positioning
struct ImagePosition {
    double x = 0.0;      // Position from left
    double y = 0.0;      // Position from top
    TextWrapping wrapping = TextWrapping::Inline;
    Alignment horizontalAlign = Alignment::Center;
};

// Image source
struct ImageSource {
    std::string filePath;
    std::vector<uint8_t> data;
    ImageFormat format = ImageFormat::PNG;
    
    bool isLoaded() const { return !data.empty() || !filePath.empty(); }
};

// Image element
class Image : public DocumentElement {
public:
    Image(const std::string& filePath);
    Image(const std::vector<uint8_t>& data, ImageFormat format);
    ~Image() override;

    Type type() const override { return Type::Image; }

    // Image source
    const ImageSource& source() const { return m_source; }
    void setSource(const ImageSource& source);

    // Dimensions
    double originalWidth() const { return m_originalWidth; }
    double originalHeight() const { return m_originalHeight; }
    
    double displayWidth() const { return m_displayWidth; }
    double displayHeight() const { return m_displayHeight; }
    
    void setDisplaySize(double width, double height);
    void setDisplayWidth(double width);
    void setDisplayHeight(double height);
    
    // Aspect ratio
    void lockAspectRatio(bool lock);
    bool isAspectRatioLocked() const { return m_aspectRatioLocked; }
    double aspectRatio() const;

    // Rotation
    double rotation() const { return m_rotation; }
    void setRotation(double degrees);

    // Flip
    bool flippedHorizontal() const { return m_flippedH; }
    bool flippedVertical() const { return m_flippedV; }
    void setFlippedHorizontal(bool flipped) { m_flippedH = flipped; }
    void setFlippedVertical(bool flipped) { m_flippedV = flipped; }

    // Position
    const ImagePosition& position() const { return m_position; }
    void setPosition(const ImagePosition& position);

    // Cropping
    struct CropRect {
        double left = 0.0;
        double top = 0.0;
        double right = 0.0;
        double bottom = 0.0;
    };
    
    const CropRect& crop() const { return m_crop; }
    void setCrop(const CropRect& crop);

    // Alt text
    const std::string& altText() const { return m_altText; }
    void setAltText(const std::string& text) { m_altText = text; }

    // Border
    double borderWidth() const { return m_borderWidth; }
    void setBorderWidth(double width) { m_borderWidth = width; }
    
    Color borderColor() const { return m_borderColor; }
    void setBorderColor(const Color& color) { m_borderColor = color; }

private:
    ImageSource m_source;
    double m_originalWidth = 0.0;
    double m_originalHeight = 0.0;
    double m_displayWidth = 0.0;
    double m_displayHeight = 0.0;
    bool m_aspectRatioLocked = true;
    double m_rotation = 0.0;
    bool m_flippedH = false;
    bool m_flippedV = false;
    ImagePosition m_position;
    CropRect m_crop;
    std::string m_altText;
    double m_borderWidth = 0.0;
    Color m_borderColor;

    void calculateOriginalDimensions();
};

} // namespace quill
