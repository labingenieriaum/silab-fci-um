import { Buffer } from "node:buffer";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";
import * as QRCode from "qrcode";

export type ReportCell = string | number | boolean | Date | null | undefined;

export interface ReportColumn<T> {
  header: string;
  value: (row: T) => ReportCell;
}

export interface PdfDocumentInput {
  title: string;
  subtitle?: string;
  sections: Array<{
    heading?: string;
    lines: string[];
  }>;
}

export interface InventoryPdfRow {
  codigo: string;
  equipo: string;
  categoria: string;
  estado: string;
  disponible: number;
  total: number;
  prestado: number;
  mantenimiento: number;
  baja: number;
  ubicacion: string;
  detalleUbicacion?: string;
}

export interface InventoryPdfInput {
  reportCode: string;
  verificationUrl: string;
  generatedAt: Date;
  generatedBy: string;
  faculty: string;
  scope: string;
  rows: InventoryPdfRow[];
}

export interface TableReportPdfColumn<T> {
  header: string;
  width: number;
  value: (row: T) => ReportCell;
  bold?: boolean;
  maxLines?: number;
}

export interface TableReportPdfSummaryTile {
  label: string;
  value: string | number;
  color: string;
}

export interface TableReportPdfInput<T> {
  reportCode: string;
  verificationUrl: string;
  generatedAt: Date;
  generatedBy: string;
  faculty: string;
  scope: string;
  titleLine1: string;
  titleLine2: string;
  summaryHeading?: string;
  summaryTiles: TableReportPdfSummaryTile[];
  rows: T[];
  columns: TableReportPdfColumn<T>[];
}

interface ReportHeaderInput {
  reportCode: string;
  faculty: string;
  titleLine1: string;
  titleLine2: string;
}

interface ReportMetaInput {
  generatedAt: Date;
  generatedBy: string;
  scope: string;
}

interface PdfPngImage {
  width: number;
  height: number;
  rgb: Buffer;
  alpha?: Buffer;
}

export function createXlsxWorkbook<T>(sheetName: string, rows: T[], columns: ReportColumn<T>[]) {
  const worksheetXml = createWorksheetXml(rows, columns);
  const files = new Map<string, string>();

  files.set(
    "[Content_Types].xml",
    xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`)
  );
  files.set(
    "_rels/.rels",
    xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`)
  );
  files.set(
    "xl/workbook.xml",
    xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName.slice(0, 31) || "Reporte")}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`)
  );
  files.set(
    "xl/_rels/workbook.xml.rels",
    xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`)
  );
  files.set("xl/worksheets/sheet1.xml", worksheetXml);
  files.set(
    "docProps/core.xml",
    xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>SILAB FCI</dc:creator>
  <dc:title>${escapeXml(sheetName)}</dc:title>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`)
  );
  files.set(
    "docProps/app.xml",
    xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>SILAB FCI</Application>
</Properties>`)
  );

  return createZip(files);
}

export function createPdfDocument(input: PdfDocumentInput) {
  const pages = paginatePdfLines(input);
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  for (const page of pages) {
    const content = createPdfPageContent(page);
    const pageId = objects.length + 1;
    const contentId = pageId + 1;
    pageObjectIds.push(pageId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    objects.push(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  return createPdfBuffer(objects);
}

export function createInventoryReportPdf(input: InventoryPdfInput) {
  const rowsPerFirstPage = 8;
  const rowsPerNextPage = 18;
  const pages: InventoryPdfRow[][] = [];
  pages.push(input.rows.slice(0, rowsPerFirstPage));
  for (let index = rowsPerFirstPage; index < input.rows.length; index += rowsPerNextPage) {
    pages.push(input.rows.slice(index, index + rowsPerNextPage));
  }
  if (!pages.length) {
    pages.push([]);
  }

  const objects: string[] = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
  const pageObjectIds: number[] = [];
  const summary = summarizeInventoryRows(input.rows);
  const logoImage = loadReportLogo();
  let logoObjectId: number | undefined;

  if (logoImage) {
    logoObjectId = objects.length + 1;
    const maskObjectId = logoImage.alpha ? objects.length + 2 : undefined;
    objects.push(createPdfImageObject(logoImage, maskObjectId));
    if (logoImage.alpha) {
      objects.push(createPdfAlphaMaskObject(logoImage));
    }
  }

  pages.forEach((rows, pageIndex) => {
    const content = createInventoryPageContent({
      input,
      summary,
      rows,
      pageIndex,
      pageCount: pages.length,
      totalRows: input.rows.length,
      logoAvailable: Boolean(logoObjectId)
    });
    const pageId = objects.length + 1;
    const contentId = pageId + 1;
    const xObjectResources = logoObjectId ? ` /XObject << /Logo ${logoObjectId} 0 R >>` : "";
    pageObjectIds.push(pageId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${xObjectResources} >> /Contents ${contentId} 0 R >>`
    );
    objects.push(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;
  return createPdfBuffer(objects);
}

export function createTableReportPdf<T>(input: TableReportPdfInput<T>) {
  const rowsPerFirstPage = 11;
  const rowsPerNextPage = 19;
  const pages: T[][] = [];
  pages.push(input.rows.slice(0, rowsPerFirstPage));
  for (let index = rowsPerFirstPage; index < input.rows.length; index += rowsPerNextPage) {
    pages.push(input.rows.slice(index, index + rowsPerNextPage));
  }
  if (!pages.length) {
    pages.push([]);
  }

  const objects: string[] = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
  const pageObjectIds: number[] = [];
  const logoImage = loadReportLogo();
  let logoObjectId: number | undefined;

  if (logoImage) {
    logoObjectId = objects.length + 1;
    const maskObjectId = logoImage.alpha ? objects.length + 2 : undefined;
    objects.push(createPdfImageObject(logoImage, maskObjectId));
    if (logoImage.alpha) {
      objects.push(createPdfAlphaMaskObject(logoImage));
    }
  }

  pages.forEach((rows, pageIndex) => {
    const content = createTableReportPageContent({
      input,
      rows,
      pageIndex,
      pageCount: pages.length,
      totalRows: input.rows.length,
      logoAvailable: Boolean(logoObjectId)
    });
    const pageId = objects.length + 1;
    const contentId = pageId + 1;
    const xObjectResources = logoObjectId ? ` /XObject << /Logo ${logoObjectId} 0 R >>` : "";
    pageObjectIds.push(pageId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${xObjectResources} >> /Contents ${contentId} 0 R >>`
    );
    objects.push(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;
  return createPdfBuffer(objects);
}

function summarizeInventoryRows(rows: InventoryPdfRow[]) {
  return rows.reduce(
    (acc, row) => {
      acc.total += row.total;
      acc.disponible += row.disponible;
      acc.prestado += row.prestado;
      acc.mantenimiento += row.mantenimiento;
      acc.baja += row.baja;
      return acc;
    },
    {
      total: 0,
      disponible: 0,
      prestado: 0,
      mantenimiento: 0,
      baja: 0
    }
  );
}

function createInventoryPageContent(args: {
  input: InventoryPdfInput;
  summary: ReturnType<typeof summarizeInventoryRows>;
  rows: InventoryPdfRow[];
  pageIndex: number;
  pageCount: number;
  totalRows: number;
  logoAvailable: boolean;
}) {
  const commands: string[] = [];
  const { input, summary, rows, pageIndex, pageCount, totalRows, logoAvailable } = args;
  const firstPage = pageIndex === 0;
  const tableStartY = firstPage ? 440 : 720;

  drawReportHeader(
    commands,
    {
      reportCode: input.reportCode,
      faculty: input.faculty,
      titleLine1: "Inventario",
      titleLine2: "de equipos"
    },
    pageIndex + 1,
    pageCount,
    firstPage,
    logoAvailable
  );
  if (firstPage) {
    drawInventoryMeta(commands, input, totalRows);
    drawInventorySummary(commands, summary);
  }
  drawInventoryTable(commands, rows, tableStartY);
  drawInventoryFooter(commands, input.reportCode, input.verificationUrl, pageIndex + 1, pageCount);

  return commands.join("\n");
}

function createTableReportPageContent<T>(args: {
  input: TableReportPdfInput<T>;
  rows: T[];
  pageIndex: number;
  pageCount: number;
  totalRows: number;
  logoAvailable: boolean;
}) {
  const commands: string[] = [];
  const { input, rows, pageIndex, pageCount, totalRows, logoAvailable } = args;
  const firstPage = pageIndex === 0;
  const tableStartY = firstPage ? 498 : 720;

  drawReportHeader(commands, input, pageIndex + 1, pageCount, firstPage, logoAvailable);
  if (firstPage) {
    drawReportMeta(commands, input, totalRows);
    drawReportSummaryTiles(commands, input.summaryHeading ?? "Resumen ejecutivo", input.summaryTiles);
  }
  drawGenericReportTable(commands, rows, input.columns, tableStartY);
  drawInventoryFooter(commands, input.reportCode, input.verificationUrl, pageIndex + 1, pageCount);

  return commands.join("\n");
}

function drawReportHeader(
  commands: string[],
  input: ReportHeaderInput,
  page: number,
  pageCount: number,
  expanded: boolean,
  logoAvailable: boolean
) {
  const headerY = expanded ? 692 : 748;
  const headerHeight = expanded ? 150 : 94;
  rect(commands, 0, headerY, 595, headerHeight, "#0c3b22");
  rect(commands, 386, headerY, 209, headerHeight, "#155c37");
  rect(commands, 520, headerY, 75, headerHeight, "#1f6b42");
  drawHeaderCircuitPattern(commands, headerY, headerHeight);
  rect(commands, 0, headerY, 595, 3, "#5d8a4a");
  rect(commands, 0, headerY + headerHeight - 3, 595, 3, "#123f27");

  drawReportLogo(commands, 48, headerY + headerHeight - 77, 52, logoAvailable);
  text(commands, "SILAB", 116, headerY + headerHeight - 38, 17, true, "#ffffff", 70);
  text(commands, "FCI", 181, headerY + headerHeight - 38, 17, true, "#9bc95c", 42);
  text(commands, "Sistema de Inventario y Laboratorios", 116, headerY + headerHeight - 58, 8, false, "#dcefe3", 236);

  text(commands, "REPORTE", 408, headerY + headerHeight - 31, 8, true, "#b7d0bf", 140);
  text(commands, input.titleLine1, 408, headerY + headerHeight - 54, 20, true, "#ffffff", 150);
  text(commands, input.titleLine2, 408, headerY + headerHeight - 77, 20, true, "#ffffff", 150);
  rect(commands, 408, headerY + headerHeight - 105, 152, 22, "#b2cf73");
  text(commands, input.reportCode, 420, headerY + headerHeight - 98, 8.8, true, "#16331e", 130);

  if (expanded) {
    line(commands, 40, headerY + 39, 555, headerY + 39, "#5d8a4a", 0.9);
    rect(commands, 40, headerY + 14, 4, 18, "#9bc95c");
    textLines(commands, input.faculty, 52, headerY + 25, 10, true, "#ffffff", 440, 11, 2);
    text(commands, "Universidad de Manizales", 52, headerY + 9, 8, false, "#cfe4d7", 220);
  } else {
    text(commands, `Pagina ${page} de ${pageCount}`, 408, headerY + 18, 8, false, "#cfe4d7", 140);
  }
}

function drawReportLogo(commands: string[], x: number, y: number, size: number, logoAvailable: boolean) {
  rect(commands, x, y, size, size, "#ffffff");
  rect(commands, x + 1.5, y + 1.5, size - 3, size - 3, "#ffffff", "#dcefe3", 0.5);
  if (!logoAvailable) {
    drawReportLogoMark(commands, x, y, size);
    return;
  }

  const imageHeight = size - 7;
  const imageWidth = imageHeight * 0.656;
  drawImage(commands, "Logo", x + (size - imageWidth) / 2, y + 3.5, imageWidth, imageHeight);
}

function drawHeaderCircuitPattern(commands: string[], y: number, height: number) {
  for (let dotX = 26; dotX <= 570; dotX += 26) {
    for (let dotY = y + 18; dotY <= y + height - 18; dotY += 26) {
      circle(commands, dotX, dotY, 0.45, "#2f613d");
    }
  }

  const top = y + height;
  line(commands, 50, top - 18, 174, top - 18, "#4f7d48", 0.8);
  line(commands, 174, top - 18, 174, top - 70, "#4f7d48", 0.8);
  line(commands, 174, top - 70, 306, top - 70, "#4f7d48", 0.8);
  line(commands, 322, top - 8, 322, top - 94, "#4f7d48", 0.8);
  line(commands, 322, top - 94, 454, top - 94, "#4f7d48", 0.8);
  line(commands, 454, top - 94, 454, top - 36, "#4f7d48", 0.8);
  line(commands, 506, top - 20, 506, top - 74, "#6a934d", 0.8);
  line(commands, 506, top - 74, 558, top - 74, "#6a934d", 0.8);
  circle(commands, 50, top - 18, 3.6, "#7da858");
  circle(commands, 306, top - 70, 3.6, "#7da858");
  circle(commands, 454, top - 94, 3.6, "#7da858");
  circle(commands, 558, top - 74, 3.6, "#9bc95c");
}

function drawReportLogoMark(commands: string[], x: number, y: number, size: number) {
  rect(commands, x, y, size, size, "#ffffff");
  rect(commands, x + 1.5, y + 1.5, size - 3, size - 3, "#ffffff", "#dcefe3", 0.5);
  line(commands, x + 17, y + 35, x + 17, y + 16, "#0c3b22", 3);
  line(commands, x + 34, y + 35, x + 34, y + 16, "#0c3b22", 3);
  line(commands, x + 17, y + 16, x + 25.5, y + 10, "#0c3b22", 3);
  line(commands, x + 34, y + 16, x + 25.5, y + 10, "#0c3b22", 3);
  line(commands, x + 11, y + 33, x + 25, y + 13, "#9bc95c", 1.5);
  line(commands, x + 41, y + 33, x + 27, y + 13, "#9bc95c", 1.5);
  rect(commands, x + 13, y + 5, 5, 3, "#cfe4d7", "#9bc95c", 0.3);
  rect(commands, x + 23, y + 5, 5, 3, "#cfe4d7", "#9bc95c", 0.3);
  rect(commands, x + 33, y + 5, 5, 3, "#cfe4d7", "#9bc95c", 0.3);
  circle(commands, x + 25.5, y + 41, 1.6, "#9bc95c");
}

function drawInventoryMeta(commands: string[], input: ReportMetaInput, totalRows: number) {
  drawReportMeta(commands, input, totalRows);
}

function drawReportMeta(commands: string[], input: ReportMetaInput, totalRows: number) {
  const x = 40;
  const y = 642;
  const width = 515;
  const cellWidth = width / 4;
  rect(commands, x, y, width, 48, "#e3e8e5");
  for (let index = 0; index < 4; index += 1) {
    rect(commands, x + index * cellWidth + 0.5, y + 0.5, cellWidth - 1, 47, "#ffffff");
  }

  const cells = [
    ["Generado el", formatDate(input.generatedAt)],
    ["Generado por", input.generatedBy],
    ["Alcance", input.scope],
    ["Registros", `${totalRows} referencias`]
  ];

  cells.forEach(([label, value], index) => {
    const cellX = x + index * cellWidth + 10;
    text(commands, label.toUpperCase(), cellX, y + 30, 6.5, true, "#75857e");
    textLines(commands, value, cellX, y + 17, 8, true, "#10201a", cellWidth - 20, 10, 2);
  });
}

function drawReportSummaryTiles(
  commands: string[],
  heading: string,
  tiles: TableReportPdfSummaryTile[]
) {
  text(commands, heading, 50, 603, 12, true, "#10201a");
  rect(commands, 40, 597, 4, 16, "#155c37");
  const safeTiles = tiles.slice(0, 5);
  const tileWidth = safeTiles.length <= 4 ? 120 : 94;
  const gap = safeTiles.length <= 4 ? 10 : 11;
  safeTiles.forEach((tile, index) => {
    const x = 40 + index * (tileWidth + gap);
    rect(commands, x, 538, tileWidth, 46, "#ffffff", "#e3e8e5", 0.6);
    rect(commands, x, 538, 3, 46, tile.color);
    text(commands, String(tile.value), x + 12, 562, 18, true, tile.color, tileWidth - 20);
    textLines(commands, tile.label, x + 12, 548, 7, true, "#41524b", tileWidth - 18, 8, 2);
  });
}

function drawGenericReportTable<T>(
  commands: string[],
  rows: T[],
  columns: TableReportPdfColumn<T>[],
  startY: number
) {
  const x = 40;
  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const rowHeight = 31;
  rect(commands, x, startY, totalWidth, 23, "#f4f7f5");
  let cursorX = x;
  columns.forEach((column) => {
    text(commands, column.header.toUpperCase(), cursorX + 4, startY + 8, 6.8, true, "#75857e", column.width - 8);
    cursorX += column.width;
  });
  line(commands, x, startY, x + totalWidth, startY, "#d3dbd7", 0.8);

  if (!rows.length) {
    text(commands, "Sin registros para mostrar", x + 4, startY - 28, 8, false, "#75857e", 220);
    return;
  }

  rows.forEach((row, index) => {
    const y = startY - 22 - index * rowHeight;
    if (index % 2 === 1) {
      rect(commands, x, y - 8, totalWidth, rowHeight - 1, "#fafcfb");
    }
    line(commands, x, y - 9, x + totalWidth, y - 9, "#e3e8e5", 0.45);
    let cellX = x;
    columns.forEach((column) => {
      const rawValue = column.value(row);
      const value = rawValue instanceof Date ? formatDate(rawValue) : rawValue == null ? "" : String(rawValue);
      textLines(
        commands,
        value,
        cellX + 4,
        y + 7,
        7,
        Boolean(column.bold),
        "#10201a",
        column.width - 8,
        8.5,
        column.maxLines ?? 2
      );
      cellX += column.width;
    });
  });
}

function drawInventorySummary(
  commands: string[],
  summary: ReturnType<typeof summarizeInventoryRows>
) {
  text(commands, "Resumen ejecutivo", 50, 603, 12, true, "#10201a");
  rect(commands, 40, 597, 4, 16, "#155c37");
  const tiles = [
    ["Unidades totales", summary.total, "#10201a"],
    ["Disponibles", summary.disponible, "#1c7344"],
    ["Prestadas", summary.prestado, "#2563eb"],
    ["En mantenimiento", summary.mantenimiento, "#b9740a"],
    ["Danadas / baja", summary.baja, "#dc2626"]
  ] as const;
  tiles.forEach(([label, value, color], index) => {
    const x = 40 + index * 105;
    rect(commands, x, 538, 94, 46, "#ffffff", "#e3e8e5", 0.6);
    rect(commands, x, 538, 3, 46, color);
    text(commands, String(value), x + 12, 562, 20, true, color);
    textLines(commands, label, x + 12, 548, 7, true, "#41524b", 76, 8, 2);
  });

  const trackX = 40;
  const trackY = 508;
  const trackWidth = 515;
  rect(commands, trackX, trackY, trackWidth, 9, "#eef2ef");
  let cursor = trackX;
  const segments = [
    [summary.disponible, "#1c7344"],
    [summary.prestado, "#2563eb"],
    [summary.mantenimiento, "#b9740a"],
    [summary.baja, "#dc2626"]
  ] as const;
  for (const [value, color] of segments) {
    const width = summary.total ? (value / summary.total) * trackWidth : 0;
    if (width > 0) {
      rect(commands, cursor, trackY, width, 9, color);
      cursor += width;
    }
  }
  text(commands, `Disponibles ${percent(summary.disponible, summary.total)}   Prestadas ${percent(summary.prestado, summary.total)}   Mantenimiento ${percent(summary.mantenimiento, summary.total)}   Baja ${percent(summary.baja, summary.total)}`, 40, 486, 7.5, false, "#41524b", 500);
}

function drawInventoryTable(commands: string[], rows: InventoryPdfRow[], startY: number) {
  const x = 40;
  const widths = [58, 132, 76, 72, 66, 111];
  const headers = ["Codigo", "Equipo", "Categoria", "Estado", "Disp.", "Ubicacion"];
  rect(commands, x, startY, 515, 23, "#f4f7f5");
  let cursorX = x;
  headers.forEach((header, index) => {
    text(commands, header.toUpperCase(), cursorX + 4, startY + 8, 6.8, true, "#75857e");
    cursorX += widths[index];
  });
  line(commands, x, startY, x + 515, startY, "#d3dbd7", 0.8);

  rows.forEach((row, index) => {
    const y = startY - 22 - index * 35;
    if (index % 2 === 1) {
      rect(commands, x, y - 9, 515, 33, "#fafcfb");
    }
    line(commands, x, y - 10, x + 515, y - 10, "#e3e8e5", 0.45);
    text(commands, row.codigo, x + 4, y + 7, 7.5, true, "#10201a", 50);
    textLines(commands, row.equipo, x + 62, y + 10, 7.5, true, "#10201a", 122, 9, 2);
    text(commands, row.detalleUbicacion ?? "", x + 62, y - 7, 6, false, "#75857e", 122);
    text(commands, row.categoria, x + 192, y + 5, 7, false, "#41524b", 70);
    drawStatusBadge(commands, row.estado, x + 270, y + 1);
    drawAvailability(commands, row, x + 342, y + 4);
    textLines(commands, row.ubicacion, x + 410, y + 10, 7, true, "#10201a", 104, 8.5, 3);
    text(commands, row.detalleUbicacion ?? "", x + 410, y - 15, 6, false, "#75857e", 104);
  });
}

function drawStatusBadge(commands: string[], status: string, x: number, y: number) {
  const normalized = status.toUpperCase();
  const [label, color, background] = normalized.includes("DISPONIBLE")
    ? ["Disponible", "#1c7344", "#e4f3ea"]
    : normalized.includes("PRESTADO")
      ? ["Prestado", "#2563eb", "#e6eefc"]
      : normalized.includes("MANTENIMIENTO")
        ? ["Mantenimiento", "#b9740a", "#fbf0d9"]
        : normalized.includes("DANADO") || normalized.includes("BAJA") || normalized.includes("PERDIDO")
          ? ["No disponible", "#dc2626", "#fce7e7"]
          : ["Inactivo", "#64748b", "#eef1f5"];
  rect(commands, x, y, 64, 14, background);
  circle(commands, x + 7, y + 7, 2.2, color);
  text(commands, label, x + 13, y + 4.2, 6.2, true, color, 48);
}

function drawAvailability(commands: string[], row: InventoryPdfRow, x: number, y: number) {
  const pct = row.total ? Math.max(0, Math.min(1, row.disponible / row.total)) : 0;
  const color = pct > 0.5 ? "#1c7344" : pct > 0 ? "#b9740a" : "#dc2626";
  rect(commands, x, y + 4, 35, 5, "#eef2ef");
  rect(commands, x, y + 4, 35 * pct, 5, color);
  text(commands, `${row.disponible}/${row.total}`, x + 40, y + 2.5, 7, true, "#41524b");
}

function drawInventoryFooter(
  commands: string[],
  reportCode: string,
  verificationUrl: string,
  page: number,
  pageCount: number
) {
  line(commands, 40, 42, 555, 42, "#e3e8e5", 0.6);
  text(commands, "Documento de uso interno - SIILAB FCI - Universidad de Manizales", 40, 24, 7, false, "#75857e", 285);
  text(commands, `${reportCode} - Pagina ${page} de ${pageCount}`, 305, 24, 7, true, "#41524b", 145);
  text(commands, "Verificar", 458, 33, 6.5, true, "#41524b", 45);
  drawQr(commands, verificationUrl, 506, 10, 36);
}

function createWorksheetXml<T>(rows: T[], columns: ReportColumn<T>[]) {
  const header = columns
    .map((column, index) => createCell(1, index + 1, column.header))
    .join("");
  const body = rows
    .map((row, rowIndex) => {
      const excelRow = rowIndex + 2;
      const cells = columns
        .map((column, columnIndex) => createCell(excelRow, columnIndex + 1, column.value(row)))
        .join("");
      return `<row r="${excelRow}">${cells}</row>`;
    })
    .join("");

  return xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">${header}</row>
    ${body}
  </sheetData>
</worksheet>`);
}

function createCell(row: number, column: number, value: ReportCell) {
  const reference = `${columnName(column)}${row}`;
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${reference}"><v>${value}</v></c>`;
  }
  if (typeof value === "boolean") {
    return `<c r="${reference}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }
  const text = value instanceof Date ? value.toISOString() : value == null ? "" : String(value);
  return `<c r="${reference}" t="inlineStr"><is><t>${escapeXml(text)}</t></is></c>`;
}

function columnName(index: number) {
  let dividend = index;
  let name = "";
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return name;
}

function createZip(files: Map<string, string>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const [name, content] of files) {
    const nameBuffer = Buffer.from(name, "utf8");
    const data = Buffer.from(content, "utf8");
    const crc = crc32(data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuffer, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function paginatePdfLines(input: PdfDocumentInput) {
  const lines: string[] = [input.title, input.subtitle ?? "", `Generado: ${formatDate(new Date())}`, ""];
  for (const section of input.sections) {
    if (section.heading) {
      lines.push(section.heading);
    }
    lines.push(...section.lines, "");
  }

  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += 46) {
    pages.push(lines.slice(index, index + 46));
  }
  return pages.length ? pages : [["Sin datos"]];
}

function createPdfPageContent(lines: string[]) {
  const escaped = lines.map((line) => `(${escapePdfText(line.slice(0, 110))}) Tj`).join(" T*\n");
  return `BT
/F1 10 Tf
50 800 Td
14 TL
${escaped}
ET`;
}

function loadReportLogo() {
  const candidates = [
    join(process.cwd(), "frontend", "public", "assets", "logo-mark.png"),
    join(process.cwd(), "..", "frontend", "public", "assets", "logo-mark.png"),
    join(__dirname, "..", "..", "..", "frontend", "public", "assets", "logo-mark.png")
  ];
  const logoPath = candidates.find((candidate) => existsSync(candidate));
  if (!logoPath) {
    return null;
  }

  try {
    return parsePng(readFileSync(logoPath));
  } catch {
    return null;
  }
}

function createPdfImageObject(image: PdfPngImage, maskObjectId?: number) {
  const stream = deflateSync(image.rgb).toString("latin1");
  return `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode${maskObjectId ? ` /SMask ${maskObjectId} 0 R` : ""} /Length ${Buffer.byteLength(stream, "latin1")} >>
stream
${stream}
endstream`;
}

function createPdfAlphaMaskObject(image: PdfPngImage) {
  const stream = deflateSync(image.alpha ?? Buffer.alloc(image.width * image.height, 255)).toString("latin1");
  return `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${Buffer.byteLength(stream, "latin1")} >>
stream
${stream}
endstream`;
}

function parsePng(buffer: Buffer): PdfPngImage {
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error("Invalid PNG signature");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idatChunks: Buffer[] = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error("Unsupported PNG format");
  }

  const bytesPerPixel = 4;
  const rowLength = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const rgba = Buffer.alloc(width * height * bytesPerPixel);
  let sourceOffset = 0;
  let targetOffset = 0;
  let previous = Buffer.alloc(rowLength);

  for (let row = 0; row < height; row += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const current = Buffer.alloc(rowLength);

    for (let index = 0; index < rowLength; index += 1) {
      const raw = inflated[sourceOffset + index];
      const left = index >= bytesPerPixel ? current[index - bytesPerPixel] : 0;
      const up = previous[index] ?? 0;
      const upLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;

      if (filter === 0) {
        current[index] = raw;
      } else if (filter === 1) {
        current[index] = (raw + left) & 0xff;
      } else if (filter === 2) {
        current[index] = (raw + up) & 0xff;
      } else if (filter === 3) {
        current[index] = (raw + Math.floor((left + up) / 2)) & 0xff;
      } else if (filter === 4) {
        current[index] = (raw + paethPredictor(left, up, upLeft)) & 0xff;
      } else {
        throw new Error("Unsupported PNG filter");
      }
    }

    current.copy(rgba, targetOffset);
    sourceOffset += rowLength;
    targetOffset += rowLength;
    previous = current;
  }

  const rgb = Buffer.alloc(width * height * 3);
  const alpha = Buffer.alloc(width * height);
  let hasTransparency = false;

  for (let source = 0, rgbOffset = 0, alphaOffset = 0; source < rgba.length; source += 4) {
    rgb[rgbOffset] = rgba[source];
    rgb[rgbOffset + 1] = rgba[source + 1];
    rgb[rgbOffset + 2] = rgba[source + 2];
    alpha[alphaOffset] = rgba[source + 3];
    hasTransparency = hasTransparency || rgba[source + 3] < 255;
    rgbOffset += 3;
    alphaOffset += 1;
  }

  return {
    width,
    height,
    rgb,
    alpha: hasTransparency ? alpha : undefined
  };
}

function paethPredictor(left: number, up: number, upLeft: number) {
  const estimate = left + up - upLeft;
  const distanceLeft = Math.abs(estimate - left);
  const distanceUp = Math.abs(estimate - up);
  const distanceUpLeft = Math.abs(estimate - upLeft);
  if (distanceLeft <= distanceUp && distanceLeft <= distanceUpLeft) {
    return left;
  }
  if (distanceUp <= distanceUpLeft) {
    return up;
  }
  return upLeft;
}

function createPdfBuffer(objects: string[]) {
  const header = "%PDF-1.4\n";
  const parts: string[] = [header];
  const offsets: number[] = [0];
  let cursor = Buffer.byteLength(header, "latin1");

  objects.forEach((object, index) => {
    offsets.push(cursor);
    const part = `${index + 1} 0 obj\n${object}\nendobj\n`;
    parts.push(part);
    cursor += Buffer.byteLength(part, "latin1");
  });

  const xrefOffset = cursor;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    `startxref\n${xrefOffset}`,
    "%%EOF"
  ].join("\n");

  parts.push(xref);
  return Buffer.from(parts.join(""), "latin1");
}

function rect(
  commands: string[],
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke?: string,
  strokeWidth = 1
) {
  commands.push(`${rgb(fill)} rg`);
  commands.push(`${fixed(x)} ${fixed(y)} ${fixed(width)} ${fixed(height)} re f`);
  if (stroke) {
    commands.push(`${rgb(stroke)} RG`);
    commands.push(`${fixed(strokeWidth)} w`);
    commands.push(`${fixed(x)} ${fixed(y)} ${fixed(width)} ${fixed(height)} re S`);
  }
}

function line(
  commands: string[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
) {
  commands.push(`${rgb(color)} RG`);
  commands.push(`${fixed(width)} w`);
  commands.push(`${fixed(x1)} ${fixed(y1)} m ${fixed(x2)} ${fixed(y2)} l S`);
}

function circle(commands: string[], x: number, y: number, radius: number, fill: string) {
  const c = radius * 0.5522847498;
  commands.push(`${rgb(fill)} rg`);
  commands.push(`${fixed(x)} ${fixed(y + radius)} m`);
  commands.push(`${fixed(x + c)} ${fixed(y + radius)} ${fixed(x + radius)} ${fixed(y + c)} ${fixed(x + radius)} ${fixed(y)} c`);
  commands.push(`${fixed(x + radius)} ${fixed(y - c)} ${fixed(x + c)} ${fixed(y - radius)} ${fixed(x)} ${fixed(y - radius)} c`);
  commands.push(`${fixed(x - c)} ${fixed(y - radius)} ${fixed(x - radius)} ${fixed(y - c)} ${fixed(x - radius)} ${fixed(y)} c`);
  commands.push(`${fixed(x - radius)} ${fixed(y + c)} ${fixed(x - c)} ${fixed(y + radius)} ${fixed(x)} ${fixed(y + radius)} c f`);
}

function drawImage(commands: string[], name: string, x: number, y: number, width: number, height: number) {
  commands.push("q");
  commands.push(`${fixed(width)} 0 0 ${fixed(height)} ${fixed(x)} ${fixed(y)} cm`);
  commands.push(`/${name} Do`);
  commands.push("Q");
}

function text(
  commands: string[],
  value: string,
  x: number,
  y: number,
  size: number,
  bold: boolean,
  color: string,
  maxWidth?: number
) {
  const output = maxWidth ? fitText(value, maxWidth, size) : value;
  commands.push(`${rgb(color)} rg`);
  commands.push("BT");
  commands.push(`/${bold ? "F2" : "F1"} ${fixed(size)} Tf`);
  commands.push(`${fixed(x)} ${fixed(y)} Td`);
  commands.push(`(${escapePdfText(output)}) Tj`);
  commands.push("ET");
}

function textLines(
  commands: string[],
  value: string,
  x: number,
  y: number,
  size: number,
  bold: boolean,
  color: string,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const lines = wrapText(value, maxWidth, size, maxLines);
  lines.forEach((line, index) => {
    text(commands, line, x, y - index * lineHeight, size, bold, color);
  });
}

function drawQr(commands: string[], value: string, x: number, y: number, size: number) {
  const qr = QRCode.create(value, {
    errorCorrectionLevel: "M"
  });
  const modules = qr.modules;
  const cell = size / modules.size;
  rect(commands, x - 2, y - 2, size + 4, size + 4, "#ffffff", "#d3dbd7", 0.4);
  for (let row = 0; row < modules.size; row += 1) {
    for (let column = 0; column < modules.size; column += 1) {
      if (modules.get(column, row)) {
        rect(
          commands,
          x + column * cell,
          y + size - (row + 1) * cell,
          cell + 0.03,
          cell + 0.03,
          "#10201a"
        );
      }
    }
  }
}

function rgb(hex: string) {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return `${fixed(red)} ${fixed(green)} ${fixed(blue)}`;
}

function fixed(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function fitText(value: string, maxWidth: number, size: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const maxChars = Math.max(3, Math.floor(maxWidth / (size * 0.5)));
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function wrapText(value: string, maxWidth: number, size: number, maxLines: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const maxChars = Math.max(4, Math.floor(maxWidth / (size * 0.5)));
  const tokens = normalized
    .replace(/\s*\/\s*/g, " / ")
    .split(" ")
    .filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const token of tokens) {
    const next = current ? `${current} ${token}` : token;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
      current = token;
    } else {
      lines.push(token.slice(0, maxChars));
      current = token.slice(maxChars);
    }

    if (lines.length === maxLines) {
      return lines;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines;
}

function percent(value: number, total: number) {
  if (!total) {
    return "0%";
  }
  return `${((value / total) * 100).toFixed(1)}%`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function xml(value: string) {
  return value.trim();
}
