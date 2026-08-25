#!/bin/bash

# Quill Document Editor - Development Setup Script

set -e

echo "Setting up Quill Document Editor development environment..."

# Check prerequisites
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "Error: $1 is not installed"
        exit 1
    fi
}

check_command cmake
check_command node
check_command npm
check_command python3

# Setup frontend
echo "Setting up frontend..."
cd frontend/react
npm install
cd ../..

# Setup C++ engine
echo "Setting up C++ engine..."
cd core/cpp
mkdir -p build
cd build
cmake ..
make -j$(nproc)
cd ../../..

# Setup Python AI services (optional)
if command -v pip3 &> /dev/null; then
    echo "Setting up Python AI services..."
    cd ai/python
    pip3 install -r requirements.txt
    cd ../..
fi

echo ""
echo "Setup complete!"
echo ""
echo "To start development:"
echo "  1. Start frontend: cd frontend/react && npm run dev"
echo "  2. Build C++ engine: cd core/cpp/build && make"
echo ""
echo "For more information, see docs/DEVELOPMENT.md"
