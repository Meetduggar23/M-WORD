#pragma once

#include "document_element.h"
#include "paragraph.h"
#include <vector>

namespace quill {

// Cell alignment
enum class CellAlignment {
    TopLeft,
    TopCenter,
    TopRight,
    MiddleLeft,
    MiddleCenter,
    MiddleRight,
    BottomLeft,
    BottomCenter,
    BottomRight
};

// Table cell
struct TableCell {
    ElementId id;
    int rowSpan = 1;
    int colSpan = 1;
    std::vector<TextRun> content;
    CellAlignment alignment = CellAlignment::TopLeft;
    Color backgroundColor;
    bool hasBorder = true;
    
    TableCell() : id(generateId()) {}
    
    std::string plainText() const;
};

// Table row
struct TableRow {
    ElementId id;
    std::vector<TableCell> cells;
    
    TableRow() : id(generateId()) {}
};

// Table style
struct TableStyle {
    bool headerRow = false;
    bool firstColumn = false;
    bool lastRow = false;
    bool lastColumn = false;
    bool bandedRows = true;
    bool bandedColumns = false;
    Color headerRowColor;
    Color bandedRowColor;
};

// Table borders
struct TableBorders {
    bool outerBorders = true;
    bool innerBorders = true;
    double width = 1.0;
    Color color;
};

// Table element
class Table : public DocumentElement {
public:
    Table(int rows, int cols);
    ~Table() override;

    Type type() const override { return Type::Table; }

    // Table dimensions
    int rowCount() const { return static_cast<int>(m_rows.size()); }
    int columnCount() const;

    // Row operations
    void addRow(int index = -1);
    void removeRow(int index);
    void moveRow(int fromIndex, int toIndex);

    // Column operations
    void addColumn(int index = -1);
    void removeColumn(int index);
    void moveColumn(int fromIndex, int toIndex);

    // Cell access
    TableCell* cell(int row, int col);
    const TableCell* cell(int row, int col) const;
    TableCell* cellById(ElementId id);
    
    // Merge cells
    bool mergeCells(int startRow, int startCol, int endRow, int endCol);
    
    // Split cell
    bool splitCell(int row, int col);

    // Resize
    void setRowHeight(int index, double height);
    void setColumnWidth(int index, double width);
    double rowHeight(int index) const;
    double columnWidth(int index) const;

    // Style
    const TableStyle& style() const { return m_style; }
    void setStyle(const TableStyle& style);

    // Borders
    const TableBorders& borders() const { return m_borders; }
    void setBorders(const TableBorders& borders);

    // Table width
    double totalWidth() const;

private:
    std::vector<TableRow> m_rows;
    std::vector<double> m_columnWidths;
    std::vector<double> m_rowHeights;
    TableStyle m_style;
    TableBorders m_borders;

    void initializeTable(int rows, int cols);
};

} // namespace quill
