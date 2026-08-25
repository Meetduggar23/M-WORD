#include "quill/document/image.h"
#include <fstream>
#include <algorithm>

namespace quill {

Image::Image(const std::string& filePath)
    : m_source{filePath, {}, ImageFormat::PNG} {
    calculateOriginalDimensions();
    m_displayWidth = m_originalWidth;
    m_displayHeight = m_originalHeight;
}

Image::Image(const std::vector<uint8_t>& data, ImageFormat format)
    : m_source{"", data, format} {
    calculateOriginalDimensions();
    m_displayWidth = m_originalWidth;
    m_displayHeight = m_originalHeight;
}

Image::~Image() = default;

void Image::setSource(const ImageSource& source) {
    m_source = source;
    calculateOriginalDimensions();
}

void Image::setDisplaySize(double width, double height) {
    if (m_aspectRatioLocked && m_originalWidth > 0 && m_originalHeight > 0) {
        double ratio = m_originalWidth / m_originalHeight;
        if (width / height > ratio) {
            width = height * ratio;
        } else {
            height = width / ratio;
        }
    }
    
    m_displayWidth = width;
    m_displayHeight = height;
}

void Image::setDisplayWidth(double width) {
    if (m_aspectRatioLocked && m_originalWidth > 0) {
        double ratio = m_originalHeight / m_originalWidth;
        m_displayHeight = width * ratio;
    }
    m_displayWidth = width;
}

void Image::setDisplayHeight(double height) {
    if (m_aspectRatioLocked && m_originalHeight > 0) {
        double ratio = m_originalWidth / m_originalHeight;
        m_displayWidth = height * ratio;
    }
    m_displayHeight = height;
}

void Image::lockAspectRatio(bool lock) {
    m_aspectRatioLocked = lock;
}

double Image::aspectRatio() const {
    if (m_originalHeight > 0) {
        return m_originalWidth / m_originalHeight;
    }
    return 1.0;
}

void Image::setRotation(double degrees) {
    // Normalize to 0-360
    m_rotation = std::fmod(degrees, 360.0);
    if (m_rotation < 0) m_rotation += 360.0;
}

void Image::setPosition(const ImagePosition& position) {
    m_position = position;
}

void Image::setCrop(const CropRect& crop) {
    m_crop = crop;
}

void Image::calculateOriginalDimensions() {
    // Placeholder - would load image and get dimensions
    // For now, use default dimensions
    m_originalWidth = 400.0;
    m_originalHeight = 300.0;
}

} // namespace quill
