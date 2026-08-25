#include "quill/document/table.h"
#include <algorithm>

namespace quill {

std::string TableCell::plainText() const {
    std::string result;
    for (const auto& run : content) {
        result += run.text;
    }
    return result;
}

Table::Table(int rows, int cols) {
    initializeTable(rows, cols);
}

Table::~Table() = default;

int Table::columnCount() const {
    if (m_rows.empty()) return 0;
    return static_cast<int>(m_rows[0].cells.size());
}

void Table::addRow(int index) {
    int cols = columnCount();
    if (cols == 0) return;
    
    TableRow row;
    row.cells.resize(cols);
    for (auto& cell : row.cells) {
        cell.id = generateId();
    }
    
    if (index < 0 || index >= static_cast<int>(m_rows.size())) {
        m_rows.push_back(row);
    } else {
        m_rows.insert(m_rows.begin() + index, row);
    }
}

void Table::removeRow(int index) {
    if (index >= 0 && index < static_cast<int>(m_rows.size())) {
        m_rows.erase(m_rows.begin() + index);
    }
}

void Table::moveRow(int fromIndex, int toIndex) {
    if (fromIndex < 0 || fromIndex >= static_cast<int>(m_rows.size())) return;
    if (toIndex < 0 || toIndex >= static_cast<int>(m_rows.size())) return;
    
    TableRow row = std::move(m_rows[fromIndex]);
    m_rows.erase(m_rows.begin() + fromIndex);
    m_rows.insert(m_rows.begin() + toIndex, std::move(row));
}

void Table::addColumn(int index) {
    for (auto& row : m_rows) {
        TableCell cell;
        cell.id = generateId();
        
        if (index < 0 || index >= static_cast<int>(row.cells.size())) {
            row.cells.push_back(cell);
        } else {
            row.cells.insert(row.cells.begin() + index, cell);
        }
    }
    
    // Update column widths
    if (index < 0 || index >= static_cast<int>(m_columnWidths.size())) {
        m_columnWidths.push_back(100.0); // Default width
    } else {
        m_columnWidths.insert(m_columnWidths.begin() + index, 100.0);
    }
}

void Table::removeColumn(int index) {
    for (auto& row : m_rows) {
        if (index >= 0 && index < static_cast<int>(row.cells.size())) {
            row.cells.erase(row.cells.begin() + index);
        }
    }
    
    if (index >= 0 && index < static_cast<int>(m_columnWidths.size())) {
        m_columnWidths.erase(m_columnWidths.begin() + index);
    }
}

void Table::moveColumn(int fromIndex, int toIndex) {
    if (fromIndex < 0 || fromIndex >= columnCount()) return;
    if (toIndex < 0 || toIndex >= columnCount()) return;
    
    for (auto& row : m_rows) {
        if (fromIndex < static_cast<int>(row.cells.size()) && 
            toIndex < static_cast<int>(row.cells.size())) {
            std::swap(row.cells[fromIndex], row.cells[toIndex]);
        }
    }
}

TableCell* Table::cell(int row, int col) {
    if (row < 0 || row >= static_cast<int>(m_rows.size())) return nullptr;
    if (col < 0 || col >= static_cast<int>(m_rows[row].cells.size())) return nullptr;
    return &m_rows[row].cells[col];
}

const TableCell* Table::cell(int row, int col) const {
    if (row < 0 || row >= static_cast<int>(m_rows.size())) return nullptr;
    if (col < 0 || col >= static_cast<int>(m_rows[row].cells.size())) return nullptr;
    return &m_rows[row].cells[col];
}

TableCell* Table::cellById(ElementId id) {
    for (auto& row : m_rows) {
        for (auto& cell : row.cells) {
            if (cell.id == id) return &cell;
        }
    }
    return nullptr;
}

bool Table::mergeCells(int startRow, int startCol, int endRow, int endCol) {
    // Validate bounds
    if (startRow < 0 || startRow >= rowCount()) return false;
    if (startCol < 0 || startCol >= columnCount()) return false;
    if (endRow < 0 || endRow >= rowCount()) return false;
    if (endCol < 0 || endCol >= columnCount()) return false;
    
    if (startRow > endRow || startCol > endCol) return false;
    
    // Get the target cell
    TableCell* target = cell(startRow, startCol);
    if (!target) return false;
    
    // Update spans for all cells in the range
    for (int r = startRow; r <= endRow; ++r) {
        for (int c = startCol; c <= endCol; ++c) {
            if (r == startRow && c == startCol) continue;
            
            TableCell* cellPtr = cell(r, c);
            if (cellPtr) {
                // For non-corner cells, we just mark them as merged
                // In a real implementation, we'd handle the actual merging
                cellPtr->rowSpan = 0; // 0 means merged
                cellPtr->colSpan = 0;
            }
        }
    }
    
    target->rowSpan = endRow - startRow + 1;
    target->colSpan = endCol - startCol + 1;
    
    return true;
}

bool Table::splitCell(int row, int col) {
    TableCell* target = cell(row, col);
    if (!target) return false;
    
    // Only split if cell was merged
    if (target->rowSpan <= 1 && target->colSpan <= 1) return false;
    
    int originalRowSpan = target->rowSpan;
    int originalColSpan = target->colSpan;
    
    target->rowSpan = 1;
    target->colSpan = 1;
    
    // Reset merged cells
    for (int r = row; r < row + originalRowSpan; ++r) {
        for (int c = col; c < col + originalColSpan; ++c) {
            if (r == row && c == col) continue;
            
            TableCell* cellPtr = cell(r, c);
            if (cellPtr) {
                cellPtr->rowSpan = 1;
                cellPtr->colSpan = 1;
            }
        }
    }
    
    return true;
}

void Table::setRowHeight(int index, double height) {
    if (index >= 0 && index < static_cast<int>(m_rowHeights.size())) {
        m_rowHeights[index] = height;
    }
}

void Table::setColumnWidth(int index, double width) {
    if (index >= 0 && index < static_cast<int>(m_columnWidths.size())) {
        m_columnWidths[index] = width;
    }
}

double Table::rowHeight(int index) const {
    if (index >= 0 && index < static_cast<int>(m_rowHeights.size())) {
        return m_rowHeights[index];
    }
    return 20.0; // Default height
}

double Table::columnWidth(int index) const {
    if (index >= 0 && index < static_cast<int>(m_columnWidths.size())) {
        return m_columnWidths[index];
    }
    return 100.0; // Default width
}

double Table::totalWidth() const {
    double total = 0.0;
    for (double width : m_columnWidths) {
        total += width;
    }
    return total;
}

void Table::initializeTable(int rows, int cols) {
    m_rows.resize(rows);
    m_columnWidths.resize(cols, 100.0);
    m_rowHeights.resize(rows, 20.0);
    
    for (auto& row : m_rows) {
        row.cells.resize(cols);
        for (auto& cell : row.cells) {
            cell.id = generateId();
        }
    }
}

} // namespace quill
