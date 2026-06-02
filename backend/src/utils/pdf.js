'use strict';
const PDFDocument = require('pdfkit');

const ACCENT = '#F59E0B';
const DARK = '#1A1F2B';
const MUTED = '#64748B';

/**
 * Bangun dokumen PDF laporan dan stream langsung ke response Express.
 *
 * @param {object} res       Express response
 * @param {string} filename  Nama file unduhan
 * @param {object} opts
 * @param {string} opts.title     Judul utama
 * @param {string} opts.subtitle  Subjudul (mis. periode)
 * @param {Array}  opts.summary   Array of [label, value] untuk kotak ringkasan
 * @param {Array}  opts.sections  Array of { heading, columns:[{label,width,align}], rows:[[...]] }
 */
function sendReportPDF(res, filename, opts) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  // ── Header ──
  doc.fillColor(DARK).fontSize(22).font('Helvetica-Bold').text('SwiftCase', { continued: true });
  doc.fillColor(ACCENT).text(' POS');
  doc.moveDown(0.2);
  doc.fillColor(DARK).fontSize(15).font('Helvetica-Bold').text(opts.title || 'Laporan');
  if (opts.subtitle) {
    doc.fillColor(MUTED).fontSize(10).font('Helvetica').text(opts.subtitle);
  }
  doc.fillColor(MUTED).fontSize(9).text('Dicetak: ' + new Date().toLocaleString('id-ID'));
  doc.moveDown(0.5);
  hr(doc);
  doc.moveDown(0.5);

  // ── Ringkasan (key-value) ──
  if (opts.summary && opts.summary.length) {
    doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text('Ringkasan');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    opts.summary.forEach(([label, value]) => {
      const y = doc.y;
      doc.fillColor(MUTED).text(String(label), 40, y, { width: 250 });
      doc.fillColor(DARK).font('Helvetica-Bold').text(String(value), 300, y, { width: 255, align: 'right' });
      doc.font('Helvetica');
    });
    doc.moveDown(0.8);
  }

  // ── Tabel-tabel ──
  (opts.sections || []).forEach((section) => {
    if (doc.y > 720) doc.addPage();
    doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text(section.heading);
    doc.moveDown(0.3);
    drawTable(doc, section.columns, section.rows);
    doc.moveDown(0.8);
  });

  // ── Footer ──
  doc.fontSize(8).fillColor(MUTED).text(
    'SwiftCase POS — dokumen ini dibuat otomatis oleh sistem.',
    40, 800, { align: 'center', width: 515 }
  );

  doc.end();
}

function hr(doc) {
  doc.strokeColor('#E2E8F0').lineWidth(1)
    .moveTo(40, doc.y).lineTo(555, doc.y).stroke();
}

function drawTable(doc, columns, rows) {
  const startX = 40;
  const rowHeight = 20;
  let y = doc.y;

  // Header baris
  doc.rect(startX, y, 515, rowHeight).fill(DARK);
  let x = startX;
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
  columns.forEach((c) => {
    doc.text(c.label, x + 6, y + 6, { width: c.width - 12, align: c.align || 'left' });
    x += c.width;
  });
  y += rowHeight;

  // Baris data
  doc.font('Helvetica').fontSize(9);
  rows.forEach((row, i) => {
    if (y > 770) {
      doc.addPage();
      y = 40;
    }
    if (i % 2 === 0) doc.rect(startX, y, 515, rowHeight).fill('#F8FAFC');
    x = startX;
    doc.fillColor(DARK);
    columns.forEach((c, ci) => {
      doc.text(String(row[ci] != null ? row[ci] : ''), x + 6, y + 6, {
        width: c.width - 12, align: c.align || 'left', ellipsis: true,
      });
      x += c.width;
    });
    y += rowHeight;
  });
  doc.y = y;
}

module.exports = { sendReportPDF };
