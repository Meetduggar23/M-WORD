cmake_minimum_required(VERSION 3.20)
project(QuillEngine VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Options
option(BUILD_TESTS "Build unit tests" ON)
option(BUILD_SHARED_LIBS "Build shared libraries" ON)
option(ENABLE_WASM "Build for WebAssembly" OFF)

# Set output directories
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# Compiler warnings
if(MSVC)
    add_compile_options(/W4 /WX)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -Werror)
endif()

# Main engine library
add_library(quill_engine
    src/document/document_model.cpp
    src/document/document_element.cpp
    src/document/section.cpp
    src/document/paragraph.cpp
    src/document/table.cpp
    src/document/image.cpp
    src/document/shape.cpp
    src/document/header_footer.cpp
    src/document/comment.cpp
    src/document/revision.cpp
    src/document/metadata.cpp
    src/text/text_engine.cpp
    src/text/text_run.cpp
    src/text/text_selection.cpp
    src/text/character_formatting.cpp
    src/layout/layout_engine.cpp
    src/layout/page_layout.cpp
    src/layout/pagination.cpp
    src/layout/column_layout.cpp
    src/tables/table_engine.cpp
    src/images/image_engine.cpp
    src/shapes/shape_engine.cpp
    src/history/undo_redo.cpp
    src/history/command.cpp
    src/clipboard/clipboard_manager.cpp
    src/serialization/document_serializer.cpp
    src/serialization/document_deserializer.cpp
    src/serialization/native_format.cpp
    src/rendering/renderer.cpp
    src/api/engine_api.cpp
)

target_include_directories(quill_engine PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# If building for WASM
if(ENABLE_WASM)
    find_package(Threads REQUIRED)
    target_link_libraries(quill_engine PUBLIC Threads::Threads)
    
    # Emscripten settings
    set(CMAKE_EXECUTABLE_SUFFIX ".js")
    target_compile_options(quill_engine PUBLIC "-sWASM=1" "-sMODULARIZE=1" "-sEXPORT_NAME=QuillEngine")
    target_link_options(quill_engine PUBLIC "-sWASM=1" "-sMODULARIZE=1" "-sEXPORT_NAME=QuillEngine")
endif()

# Testing
if(BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

# Install rules
install(TARGETS quill_engine
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    RUNTIME DESTINATION bin
)

install(DIRECTORY include/quill DESTINATION include)
