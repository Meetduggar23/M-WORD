#pragma once

#include <string>
#include <vector>
#include <memory>
#include <cstdint>
#include <functional>
#include <chrono>

namespace quill {

// Unique identifier for document elements
using ElementId = uint64_t;

// Generate unique element IDs
ElementId generateId();

// Time point type
using TimePoint = std::chrono::system_clock::time_point;

// Color representation
struct Color {
    uint8_t r = 0;
    uint8_t g = 0;
    uint8_t b = 0;
    uint8_t a = 255;

    Color() = default;
    Color(uint8_t r, uint8_t g, uint8_t b, uint8_t a = 255)
        : r(r), g(g), b(b), a(a) {}
    
    bool operator==(const Color& other) const {
        return r == other.r && g == other.g && b == other.b && a == other.a;
    }
    
    bool operator!=(const Color& other) const {
        return !(*this == other);
    }
};

// 2D Point
struct Point {
    double x = 0.0;
    double y = 0.0;
    
    Point() = default;
    Point(double x, double y) : x(x), y(y) {}
};

// Size (width and height)
struct Size {
    double width = 0.0;
    double height = 0.0;
    
    Size() = default;
    Size(double width, double height) : width(width), height(height) {}
};

// Rectangle
struct Rect {
    double x = 0.0;
    double y = 0.0;
    double width = 0.0;
    double height = 0.0;
    
    Rect() = default;
    Rect(double x, double y, double width, double height)
        : x(x), y(y), width(width), height(height) {}
};

// Text position in document
struct TextPosition {
    ElementId elementId = 0;
    int offset = 0;
    
    TextPosition() = default;
    TextPosition(ElementId id, int offset) : elementId(id), offset(offset) {}
    
    bool operator<(const TextPosition& other) const {
        if (elementId != other.elementId) return elementId < other.elementId;
        return offset < other.offset;
    }
    
    bool operator==(const TextPosition& other) const {
        return elementId == other.elementId && offset == other.offset;
    }
    
    bool operator<=(const TextPosition& other) const {
        return *this < other || *this == other;
    }
};

// Text range
struct TextRange {
    TextPosition start;
    TextPosition end;
    
    TextRange() = default;
    TextRange(TextPosition start, TextPosition end) : start(start), end(end) {}
    
    bool isEmpty() const {
        return start == end;
    }
    
    bool contains(const TextPosition& pos) const {
        return start <= pos && pos <= end;
    }
};

// Error codes
enum class ErrorCode {
    None = 0,
    InvalidDocument,
    InvalidFormat,
    FileNotFound,
    PermissionDenied,
    OutOfMemory,
    InvalidParameter,
    UnsupportedFeature,
    InternalError
};

// Result type for error handling
template<typename T>
class Result {
public:
    Result(T value) : m_value(std::move(value)), m_error(ErrorCode::None) {}
    Result(ErrorCode error) : m_error(error) {}
    
    bool isSuccess() const { return m_error == ErrorCode::None; }
    bool isError() const { return m_error != ErrorCode::None; }
    
    const T& value() const { return m_value; }
    T& value() { return m_value; }
    
    ErrorCode error() const { return m_error; }
    
    T& operator*() { return m_value; }
    const T& operator*() const { return m_value; }
    
    T* operator->() { return &m_value; }
    const T* operator->() const { return &m_value; }

private:
    T m_value{};
    ErrorCode m_error = ErrorCode::None;
};

// Specialization for void
template<>
class Result<void> {
public:
    Result() : m_error(ErrorCode::None) {}
    Result(ErrorCode error) : m_error(error) {}
    
    bool isSuccess() const { return m_error == ErrorCode::None; }
    bool isError() const { return m_error != ErrorCode::None; }
    ErrorCode error() const { return m_error; }

private:
    ErrorCode m_error = ErrorCode::None;
};

} // namespace quill
