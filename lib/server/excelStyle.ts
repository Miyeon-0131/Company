import ExcelJS from "exceljs";

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFB0BEC5" } },
  left: { style: "thin", color: { argb: "FFB0BEC5" } },
  bottom: { style: "thin", color: { argb: "FFB0BEC5" } },
  right: { style: "thin", color: { argb: "FFB0BEC5" } },
};

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE3F2FD" },
};

/** 估算列宽：中文算 2 单位，英文算 1 */
function cellWidth(text: string): number {
  let w = 0;
  for (const ch of String(text ?? "")) {
    w += ch.charCodeAt(0) > 127 ? 2 : 1;
  }
  return w;
}

function styleSheet(ws: ExcelJS.Worksheet, colCount: number, rowCount: number) {
  // 表头行
  const header = ws.getRow(1);
  header.height = 28;
  header.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: "FF1565C0" } };
    cell.fill = HEADER_FILL;
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = THIN_BORDER;
  });

  // 数据行：自动行高 + 换行
  for (let r = 2; r <= rowCount; r++) {
    const row = ws.getRow(r);
    let maxLines = 1;
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      if (col > colCount) return;
      const text = String(cell.value ?? "");
      const colW = ws.getColumn(col).width ?? 14;
      const charsPerLine = Math.max(8, Math.floor(colW * 1.2));
      maxLines = Math.max(maxLines, Math.ceil(cellWidth(text) / charsPerLine));
      cell.alignment = {
        vertical: "top",
        horizontal: "left",
        wrapText: true,
      };
      cell.border = THIN_BORDER;
      cell.font = { size: 10 };
    });
    row.height = Math.min(120, Math.max(22, maxLines * 16 + 8));
  }

  // 外边框加粗
  if (rowCount > 0 && colCount > 0) {
    const outer: Partial<ExcelJS.Border> = {
      style: "medium",
      color: { argb: "FF546E7A" },
    };
    for (let c = 1; c <= colCount; c++) {
      ws.getCell(1, c).border = {
        ...THIN_BORDER,
        top: outer,
        ...(c === 1 ? { left: outer } : {}),
        ...(c === colCount ? { right: outer } : {}),
      };
      ws.getCell(rowCount, c).border = {
        ...ws.getCell(rowCount, c).border,
        bottom: outer,
        ...(c === 1 ? { left: outer } : {}),
        ...(c === colCount ? { right: outer } : {}),
      };
    }
    for (let r = 2; r < rowCount; r++) {
      ws.getCell(r, 1).border = {
        ...ws.getCell(r, 1).border,
        left: outer,
      };
      ws.getCell(r, colCount).border = {
        ...ws.getCell(r, colCount).border,
        right: outer,
      };
    }
  }
}

/** 把 JSON 行数据写成带边框、自动列宽、换行的美观表格 */
export function addStyledSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  rows: Record<string, unknown>[]
) {
  const safeName = sheetName.slice(0, 31).replace(/[\\/*?:[\]]/g, "_");
  const ws = wb.addWorksheet(safeName);
  if (!rows.length) return ws;

  const headers = Object.keys(rows[0]!);
  ws.addRow(headers);
  rows.forEach((row) => {
    ws.addRow(headers.map((h) => row[h] ?? ""));
  });

  // 按内容计算列宽，保证文字能放下
  headers.forEach((h, i) => {
    let maxW = cellWidth(h);
    rows.forEach((row) => {
      maxW = Math.max(maxW, cellWidth(String(row[h] ?? "")));
    });
    ws.getColumn(i + 1).width = Math.min(52, Math.max(14, maxW + 4));
  });

  styleSheet(ws, headers.length, rows.length + 1);
  return ws;
}

export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const raw = await wb.xlsx.writeBuffer();
  return Buffer.from(raw);
}
