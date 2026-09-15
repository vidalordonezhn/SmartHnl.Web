import { Injectable, inject } from '@angular/core';
import { NumberToLettersService } from './number-to-letters.service';
import { Factura } from './api-facturacion.service';
import { Cotizacion } from './api-cotizaciones.service';
import { NotaCredito } from './api-notas-credito.service';
import { Compra } from './api-compras.service';
import { BoletaCompra } from './api-boletas-compra.service';

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  private numberToLetters = inject(NumberToLettersService);

  private openPrintWindow(htmlContent: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      const printScript = printWindow.document.createElement('script');
      printScript.innerHTML = `
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      `;
      printWindow.document.body.appendChild(printScript);
    } else {
      alert('Por favor permita los popups en el navegador para imprimir.');
    }
  }

  // 1. Formato Carta Fiscal SAR (Original + Copia)
  printInvoiceLetter(inv: Factura): void {
    const totalLetras = this.numberToLetters.convertir(inv.totalGeneral);
    const isRecibo = inv.documentType === 'RECIBO_HONORARIOS';
    const title = isRecibo ? 'FACTURA SUCURSAL' : 'FACTURA COMERCIAL FISCAL';

    const itemsHtml = (inv.details || []).map(d => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 8px; text-align: center;">${d.quantity}</td>
        <td style="padding: 6px 8px;">${d.customDescription || d.productName || 'Producto'}</td>
        <td style="padding: 6px 8px; text-align: right;">L. ${d.priceUnit.toFixed(2)}</td>
        <td style="padding: 6px 8px; text-align: right;">L. ${(d.discount || 0).toFixed(2)}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: bold;">L. ${(d.quantity * d.priceUnit - (d.discount || 0)).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Impresión Fiscal SAR - ${inv.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 20px; }
    .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    .title { font-size: 16px; font-weight: 900; color: #1e293b; text-transform: uppercase; }
    table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
    table.items th { background: #f1f5f9; padding: 6px 8px; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 10px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 15px;">
    <h1 style="margin: 0; font-size: 18px; font-weight: 900;">EMPRESA HONDURAS S.A.</h1>
    <p style="margin: 2px 0; color: #475569; font-weight: 600;">RTN: 05019654135885 | Tel: +504 9091-9293</p>
    <p style="margin: 2px 0; color: #64748b;">Boulevard Morazán, Tegucigalpa, Honduras</p>
    <div class="title" style="margin-top: 8px;">${title}</div>
    <div style="font-size: 13px; font-weight: 800; color: #2563eb;">N° ${inv.invoiceNumber}</div>
  </div>

  <div class="box">
    <table style="width: 100%; font-size: 10.5px;">
      <tr>
        <td style="width: 50%;"><strong>CLIENTE:</strong> ${inv.clientName || 'Consumidor Final'}</td>
        <td style="width: 50%;"><strong>FECHA EMISIÓN:</strong> ${inv.date}</td>
      </tr>
      <tr>
        <td><strong>RTN CLIENTE:</strong> ${inv.clientRtn || '00000000000000'}</td>
        <td><strong>TÉRMINO DE PAGO:</strong> ${inv.paymentTerm || inv.paymentType}</td>
      </tr>
    </table>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th style="width: 10%; text-align: center;">Cant.</th>
        <th style="width: 50%;">Descripción</th>
        <th style="width: 15%; text-align: right;">Precio Unit.</th>
        <th style="width: 10%; text-align: right;">Descuento</th>
        <th style="width: 15%; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: flex-start;">
    <div style="width: 55%; font-size: 10px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 5px 0;"><strong>TOTAL EN LETRAS:</strong></p>
      <p style="margin: 0; font-weight: 700; color: #1e293b;">${totalLetras}</p>
      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 9px; color: #64748b;">
        <strong>CAI:</strong> 3AE914-B7C623-SD8B2F-40FD9A-8721BC-4E<br>
        <strong>Rango Autorizado:</strong> 000-001-01-00000001 al 000-001-01-00000100<br>
        <strong>Fecha Límite de Emisión:</strong> 31/12/2026
      </div>
    </div>

    <div style="width: 40%;">
      <table style="width: 100%; font-size: 11px; text-align: right;">
        <tr><td style="padding: 2px 0; color: #64748b;">Subtotal Gravado (15%):</td><td style="font-weight: 600;">L. ${inv.subtotalGravado.toFixed(2)}</td></tr>
        <tr><td style="padding: 2px 0; color: #64748b;">Subtotal Exento (0%):</td><td style="font-weight: 600;">L. ${inv.subtotalExento.toFixed(2)}</td></tr>
        <tr><td style="padding: 2px 0; color: #64748b;">ISV Total (15%):</td><td style="font-weight: 600;">L. ${inv.isvTotal.toFixed(2)}</td></tr>
        <tr style="font-size: 13px; font-weight: 900; border-top: 2px solid #0f172a;">
          <td style="padding: 6px 0;">TOTAL GENERAL:</td>
          <td style="padding: 6px 0; color: #0f172a;">L. ${inv.totalGeneral.toFixed(2)}</td>
        </tr>
      </table>
    </div>
  </div>

  <div style="text-align: center; margin-top: 25px; font-size: 10px; color: #64748b;">
    <strong>ORIGINAL: CLIENTE | COPIA: EMISOR</strong><br>
    ¡GRACIAS POR SU PREFERENCIA!
  </div>
</body>
</html>`;
    this.openPrintWindow(html);
  }

  // 2. Formato Ticket Térmico POS 80mm
  printInvoiceTicket(inv: Factura): void {
    const totalLetras = this.numberToLetters.convertir(inv.totalGeneral);

    const itemsHtml = (inv.details || []).map(d => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px;">
        <span style="width: 60%;">${d.quantity}x ${d.productName || 'Prod'}</span>
        <span style="width: 40%; text-align: right; font-weight: bold;">L. ${(d.quantity * d.priceUnit).toFixed(2)}</span>
      </div>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket POS - ${inv.invoiceNumber}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body { font-family: monospace; font-size: 11px; width: 72mm; margin: 0 auto; padding: 10px 0; color: #000; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="bold" style="font-size: 14px;">EMPRESA HONDURAS S.A.</div>
    <div>RTN: 05019654135885</div>
    <div>Tegucigalpa, Honduras</div>
    <div class="divider"></div>
    <div class="bold" style="font-size: 12px;">FACTURA FISCAL SAR</div>
    <div class="bold">${inv.invoiceNumber}</div>
    <div>Fecha: ${inv.date}</div>
  </div>

  <div class="divider"></div>
  <div><strong>CLIENTE:</strong> ${inv.clientName || 'Consumidor Final'}</div>
  <div><strong>RTN:</strong> ${inv.clientRtn || '00000000000000'}</div>
  <div><strong>PAGO:</strong> ${inv.paymentTerm || inv.paymentType}</div>
  <div class="divider"></div>

  ${itemsHtml}

  <div class="divider"></div>
  <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>L. ${(inv.subtotalGravado + inv.subtotalExento).toFixed(2)}</span></div>
  <div style="display: flex; justify-content: space-between;"><span>ISV 15%:</span><span>L. ${inv.isvTotal.toFixed(2)}</span></div>
  <div class="divider"></div>
  <div style="display: flex; justify-content: space-between; font-size: 13px;" class="bold">
    <span>TOTAL:</span><span>L. ${inv.totalGeneral.toFixed(2)}</span>
  </div>
  <div class="divider"></div>
  <div style="font-size: 9px;"><strong>SON:</strong> ${totalLetras}</div>
  <div class="divider"></div>
  <div style="font-size: 8.5px;" class="text-center">
    CAI: 3AE914-B7C623-SD8B2F-40FD9A-8721BC-4E<br>
    Rango: 000-001-01-00000001 a 000-001-01-00000100<br>
    Límite Emisión: 31/12/2026<br><br>
    <strong>ORIGINAL: CLIENTE</strong><br>
    ¡GRACIAS POR SU COMPRA!
  </div>
</body>
</html>`;
    this.openPrintWindow(html);
  }

  // 3. Formato Cotización
  printCotizacion(cot: Cotizacion): void {
    const totalLetras = this.numberToLetters.convertir(cot.totalGeneral);
    const itemsHtml = (cot.details || []).map(d => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 8px; text-align: center;">${d.quantity}</td>
        <td style="padding: 6px 8px;">${d.customDescription || d.productName || 'Item'}</td>
        <td style="padding: 6px 8px; text-align: right;">L. ${d.priceUnit.toFixed(2)}</td>
        <td style="padding: 6px 8px; text-align: right;">L. ${(d.discount || 0).toFixed(2)}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: bold;">L. ${(d.quantity * d.priceUnit - (d.discount || 0)).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cotización - ${cot.quotationNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #0f172a; padding: 25px; }
    .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
    table.items th { background: #f8fafc; padding: 6px 8px; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 10px; }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 15px;">
    <div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #1e3a8a;">EMPRESA HONDURAS S.A.</h1>
      <p style="margin: 2px 0; color: #64748b;">RTN: 05019654135885 | PBX: +504 2234-5678</p>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 16px; font-weight: 900; color: #3b82f6;">COTIZACIÓN FORMAL</div>
      <div style="font-size: 13px; font-weight: 800;">${cot.quotationNumber}</div>
      <div style="font-size: 10px; color: #64748b;">Fecha: ${cot.date}</div>
    </div>
  </div>

  <div class="box">
    <table style="width: 100%; font-size: 11px;">
      <tr>
        <td style="width: 50%;"><strong>CLIENTE:</strong> ${cot.clientName || cot.customClientName || 'Cliente General'}</td>
        <td style="width: 50%;"><strong>VALIDEZ:</strong> ${cot.validityDays || 15} Días calendario</td>
      </tr>
      <tr>
        <td><strong>RTN:</strong> ${cot.clientRtn || cot.customClientRtn || 'N/D'}</td>
        <td><strong>CONDICIÓN DE PAGO:</strong> ${cot.paymentTerm || cot.paymentType}</td>
      </tr>
    </table>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th style="width: 10%; text-align: center;">Cant.</th>
        <th style="width: 50%;">Descripción</th>
        <th style="width: 15%; text-align: right;">Precio Unit.</th>
        <th style="width: 10%; text-align: right;">Descuento</th>
        <th style="width: 15%; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div style="margin-top: 15px; display: flex; justify-content: space-between;">
    <div style="width: 55%; font-size: 10px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 5px 0;"><strong>TOTAL EN LETRAS:</strong></p>
      <p style="margin: 0; font-weight: 700; color: #1e293b;">${totalLetras}</p>
      <p style="margin: 10px 0 0 0; color: #64748b;"><em>* Precios sujetos a confirmación de inventario y vigencia especificada.</em></p>
    </div>
    <div style="width: 40%;">
      <table style="width: 100%; font-size: 11px; text-align: right;">
        <tr><td style="color: #64748b;">Subtotal:</td><td style="font-weight: 600;">L. ${(cot.subtotalGravado + cot.subtotalExento).toFixed(2)}</td></tr>
        <tr><td style="color: #64748b;">ISV Total (15%):</td><td style="font-weight: 600;">L. ${cot.isvTotal.toFixed(2)}</td></tr>
        <tr style="font-size: 13px; font-weight: 900; border-top: 2px solid #0f172a;">
          <td style="padding: 6px 0;">TOTAL COTIZADO:</td>
          <td style="padding: 6px 0; color: #2563eb;">L. ${cot.totalGeneral.toFixed(2)}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;
    this.openPrintWindow(html);
  }

  // 4. Formato Nota de Crédito SAR
  printNotaCredito(nc: NotaCredito): void {
    const totalLetras = this.numberToLetters.convertir(nc.totalGeneral);
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nota de Crédito SAR - ${nc.creditNoteNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #0f172a; padding: 25px; }
    .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div style="text-align: center; border-bottom: 2px solid #e11d48; padding-bottom: 12px; margin-bottom: 15px;">
    <h1 style="margin: 0; font-size: 18px; font-weight: 900;">EMPRESA HONDURAS S.A.</h1>
    <p style="margin: 2px 0; color: #475569;">RTN: 05019654135885 | Tegucigalpa, Honduras</p>
    <div style="font-size: 15px; font-weight: 900; color: #e11d48; margin-top: 8px;">NOTA DE CRÉDITO FISCAL SAR</div>
    <div style="font-size: 13px; font-weight: 800;">N° ${nc.creditNoteNumber}</div>
  </div>

  <div class="box">
    <table style="width: 100%; font-size: 11px;">
      <tr>
        <td style="width: 50%;"><strong>CLIENTE:</strong> ${nc.clientName || 'Consumidor Final'}</td>
        <td style="width: 50%;"><strong>FECHA:</strong> ${nc.date}</td>
      </tr>
      <tr>
        <td><strong>DOCUMENTO FISCAL MODIFICADO:</strong> Factura ${nc.invoiceNumber}</td>
        <td><strong>MOTIVO / TIPO:</strong> ${nc.noteType}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top: 6px;"><strong>OBSERVACIONES:</strong> ${nc.comments || 'Anulación / Devolución fiscal'}</td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 20px; display: flex; justify-content: space-between;">
    <div style="width: 55%; font-size: 10px; background: #fff1f2; padding: 10px; border-radius: 6px; border: 1px solid #fecdd3;">
      <p style="margin: 0 0 5px 0;"><strong>TOTAL ACREDITADO EN LETRAS:</strong></p>
      <p style="margin: 0; font-weight: 700; color: #9f1239;">${totalLetras}</p>
      <div style="margin-top: 10px; font-size: 9px; color: #64748b;">
        <strong>CAI:</strong> ${nc.caiCode || '3AE914-B7C623-SD8B2F-40FD9A-8721BC-4E'}<br>
        <strong>Régimen de Facturación SAR</strong>
      </div>
    </div>
    <div style="width: 40%;">
      <table style="width: 100%; font-size: 11px; text-align: right;">
        <tr><td style="color: #64748b;">Subtotal Gravado:</td><td style="font-weight: 600;">L. ${nc.subtotalGravado.toFixed(2)}</td></tr>
        <tr><td style="color: #64748b;">ISV 15%:</td><td style="font-weight: 600;">L. ${nc.isvTotal.toFixed(2)}</td></tr>
        <tr style="font-size: 13px; font-weight: 900; border-top: 2px solid #e11d48;">
          <td style="padding: 6px 0; color: #e11d48;">TOTAL ACREDITADO:</td>
          <td style="padding: 6px 0; color: #e11d48;">L. ${nc.totalGeneral.toFixed(2)}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;
    this.openPrintWindow(html);
  }

  // 4.5. Comprobante de Compra a Proveedor
  printCompra(compra: Compra, companySettings?: any): void {
    const companyName = companySettings?.commercialName || companySettings?.name || "SMART HNL POS";
    const rtnStr = companySettings?.rtn || "05019654135885";
    const totalLetras = this.numberToLetters.convertir(compra.totalGeneral || 0);

    const itemsHtml = (compra.details || []).map(d => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; text-align: center;">${d.quantity}</td>
        <td style="padding: 8px; font-weight: bold;">${d.productName || 'Producto'}</td>
        <td style="padding: 8px; text-align: right;">L. ${(d.costUnit || 0).toFixed(2)}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold;">L. ${(d.quantity * d.costUnit).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura de Compra - ${compra.purchaseNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 25px; display: flex; flex-direction: column; align-items: center; }
    .container { max-width: 800px; width: 100%; background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 25px; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
    .company-info h1 { margin: 0; font-size: 16px; font-weight: 900; color: #0f172a; }
    .doc-title { text-align: right; }
    .doc-title h2 { margin: 0; font-size: 14px; font-weight: 800; color: #0f172a; }
    .box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 14px; }
    table.data { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table.data th { background: #334155; color: white; padding: 8px; text-align: left; font-size: 10px; }
    table.data td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <h1>${companyName}</h1>
        <div>RTN: <strong>${rtnStr}</strong></div>
      </div>
      <div class="doc-title">
        <h2>COMPRA A PROVEEDOR</h2>
        <div style="font-size: 12px; font-weight: bold; color: #2563eb; margin-top: 2px;">N° ${compra.purchaseNumber}</div>
        <div style="font-size: 10px; color: #64748b;">Fecha: ${compra.date}</div>
      </div>
    </div>

    <div class="box">
      <table style="width: 100%; font-size: 11px;">
        <tr>
          <td style="width: 50%;"><strong>PROVEEDOR:</strong> ${compra.providerName || 'Proveedor General'}</td>
          <td style="width: 50%;"><strong>CONDICIÓN:</strong> ${compra.paymentType}</td>
        </tr>
        <tr>
          <td><strong>RTN PROVEEDOR:</strong> ${compra.providerRtn || '00000000000000'}</td>
          <td><strong>OBSERVACIONES:</strong> ${compra.comments || 'N/A'}</td>
        </tr>
      </table>
    </div>

    <table class="data">
      <thead>
        <tr>
          <th style="width: 10%; text-align: center;">Cant.</th>
          <th style="width: 50%;">Descripción</th>
          <th style="width: 20%; text-align: right;">Costo Unit.</th>
          <th style="width: 20%; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; font-weight: bold;">
          <td colspan="3" style="text-align: right; padding: 10px;">TOTAL GENERAL:</td>
          <td style="text-align: right; padding: 10px; font-size: 13px; color: #0f172a;">L. ${(compra.totalGeneral || 0).toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <div class="box" style="font-size: 10.5px;">
      <strong>SON:</strong> ${totalLetras}
    </div>
  </div>
</body>
</html>`;
    this.openPrintWindow(html);
  }

  // 5. Formato Boleta de Compra SAR
  printBoletaCompra(boleta: BoletaCompra): void {
    const totalLetras = this.numberToLetters.convertir(boleta.totalGeneral);
    const itemsHtml = (boleta.details || []).map(d => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 8px; text-align: center;">${d.quantity}</td>
        <td style="padding: 6px 8px;">${d.description}</td>
        <td style="padding: 6px 8px; text-align: right;">L. ${d.priceUnit.toFixed(2)}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: bold;">L. ${d.totalItem.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Boleta de Compra SAR - ${boleta.boletaNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #0f172a; padding: 25px; }
    .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
    table.items th { background: #f8fafc; padding: 6px 8px; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 10px; }
  </style>
</head>
<body>
  <div style="text-align: center; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 15px;">
    <h1 style="margin: 0; font-size: 18px; font-weight: 900;">EMPRESA HONDURAS S.A.</h1>
    <p style="margin: 2px 0; color: #475569;">RTN: 05019654135885 | Tegucigalpa, Honduras</p>
    <div style="font-size: 15px; font-weight: 900; color: #059669; margin-top: 8px;">BOLETA DE COMPRA FISCAL SAR</div>
    <div style="font-size: 13px; font-weight: 800;">N° ${boleta.boletaNumber}</div>
  </div>

  <div class="box">
    <table style="width: 100%; font-size: 11px;">
      <tr>
        <td style="width: 50%;"><strong>VENDEDOR / PROVEEDOR:</strong> ${boleta.providerName}</td>
        <td style="width: 50%;"><strong>FECHA:</strong> ${boleta.date}</td>
      </tr>
      <tr>
        <td><strong>RTN / IDENTIDAD:</strong> ${boleta.providerRtn}</td>
        <td><strong>CONDICIÓN:</strong> ${boleta.paymentType}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>DIRECCIÓN / TELÉFONO:</strong> ${boleta.providerAddress || 'N/D'} / ${boleta.providerPhone || 'N/D'}</td>
      </tr>
    </table>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th style="width: 10%; text-align: center;">Cant.</th>
        <th style="width: 55%;">Descripción del Bien / Servicio</th>
        <th style="width: 15%; text-align: right;">Precio Unit.</th>
        <th style="width: 20%; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div style="margin-top: 20px; display: flex; justify-content: space-between;">
    <div style="width: 55%; font-size: 10px; background: #ecfdf5; padding: 10px; border-radius: 6px; border: 1px solid #a7f3d0;">
      <p style="margin: 0 0 5px 0;"><strong>TOTAL EN LETRAS:</strong></p>
      <p style="margin: 0; font-weight: 700; color: #065f46;">${totalLetras}</p>
      <div style="margin-top: 10px; font-size: 9px; color: #64748b;">
        <strong>CAI:</strong> ${boleta.caiCode || '4F8912-C8D734-TF9C3G-51GE0B-9832CD-5F'}<br>
        Documento comprobante fiscal de compra a no obligados a facturar (SAR)
      </div>
    </div>
    <div style="width: 40%;">
      <table style="width: 100%; font-size: 11px; text-align: right;">
        <tr style="font-size: 13px; font-weight: 900; border-top: 2px solid #059669;">
          <td style="padding: 6px 0; color: #059669;">TOTAL GENERAL:</td>
          <td style="padding: 6px 0; color: #059669;">L. ${boleta.totalGeneral.toFixed(2)}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;
    this.openPrintWindow(html);
  }

  // 6. Formato Reporte de Rentabilidad
  printUtilityReport(reporte: any, establishment: string): void {
    const rows = (reporte?.items || []).map((i: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
        <td style="padding: 5px;">${i.invoiceNumber}</td>
        <td style="padding: 5px;">${i.date}</td>
        <td style="padding: 5px;">${i.clientName}</td>
        <td style="padding: 5px; text-align: right;">L. ${i.totalCost.toFixed(2)}</td>
        <td style="padding: 5px; text-align: right;">L. ${i.total.toFixed(2)}</td>
        <td style="padding: 5px; text-align: right; font-weight: bold; color: #16a34a;">L. ${i.netProfit.toFixed(2)}</td>
        <td style="padding: 5px; text-align: right;">${i.marginPercent.toFixed(1)}%</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reporte de Utilidad y Rentabilidad</title>
  <style>
    body { font-family: sans-serif; padding: 20px; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #0f172a; color: white; padding: 7px; text-align: left; font-size: 10px; }
  </style>
</head>
<body>
  <h2>INFORME CONSOLIDADO DE UTILIDAD & MARGEN</h2>
  <p><strong>Ámbito:</strong> ${establishment} | <strong>Generado:</strong> ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr>
        <th>N° Factura</th>
        <th>Fecha</th>
        <th>Cliente</th>
        <th style="text-align: right;">Costo Total</th>
        <th style="text-align: right;">Venta Total</th>
        <th style="text-align: right;">Utilidad Neta</th>
        <th style="text-align: right;">Margen</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr style="background: #f1f5f9; font-weight: bold; font-size: 11px;">
        <td colspan="3" style="padding: 8px;">TOTALES CONSOLIDADOS:</td>
        <td style="padding: 8px; text-align: right;">L. ${reporte?.totalCost?.toFixed(2)}</td>
        <td style="padding: 8px; text-align: right;">L. ${reporte?.totalGeneral?.toFixed(2)}</td>
        <td style="padding: 8px; text-align: right; color: #16a34a;">L. ${reporte?.totalProfit?.toFixed(2)}</td>
        <td style="padding: 8px; text-align: right;">${reporte?.globalMarginPercent?.toFixed(1)}%</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
    this.openPrintWindow(html);
  }

  // 7. Acta Oficial de Ajuste y Retiro de Inventario Físico
  printInventoryAdjustmentActa(log: any, companySettings?: any): void {
    const companyName = companySettings?.commercialName || companySettings?.name || "SMART HNL POS";
    const rtnStr = companySettings?.rtn || "00000000000000";
    const addressStr = companySettings?.address || "Tegucigalpa, Honduras";
    const phoneStr = companySettings?.phone || "0000-0000";

    const isExit = log.type === 'SALIDA';
    const totalValue = (log.quantity || 0) * (log.costUnit || 0);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Acta de Ajuste Físico - N° ${log.reference || 'S/N'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 25px; display: flex; flex-direction: column; align-items: center; }
    .container { max-width: 850px; width: 100%; background: white; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 30px; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
    .company-info { font-size: 11px; color: #475569; line-height: 1.4; }
    .document-title { text-align: right; }
    .document-title h2 { margin: 0; font-size: 15px; color: ${isExit ? '#b91c1c' : '#047857'}; font-weight: 800; text-transform: uppercase; }
    .document-title p { margin: 3px 0 0 0; font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 11px; line-height: 1.5; }
    .card h3 { margin: 0 0 8px 0; font-size: 12px; color: #0f172a; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 20px 0; }
    th { background-color: #334155; color: white; font-weight: 700; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .footer-signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; }
    .sig-block { width: 42%; text-align: center; border-top: 1px solid #0f172a; padding-top: 6px; font-size: 10px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <h1 style="margin: 0; font-size: 16px; font-weight: 900; color: #0f172a;">${companyName}</h1>
        <div>RTN: <strong>${rtnStr}</strong></div>
        <div>Dirección: ${addressStr}</div>
        <div>Teléfono: ${phoneStr}</div>
      </div>
      <div class="document-title">
        <h2>${isExit ? 'ACTA DE RETIRO / MERMA FÍSICA' : 'ACTA DE INGRESO / AJUSTE FÍSICO'}</h2>
        <p>Referencia Oficial: <strong>${log.reference || 'S/R'}</strong></p>
        <p>Fecha Registro: ${log.date || new Date().toLocaleString()}</p>
      </div>
    </div>

    <div class="card">
      <h3>1. DATOS DE AUDITORÍA Y JUSTIFICACIÓN</h3>
      <p><strong>Tipo de Ajuste:</strong> <span style="font-weight: 800; color: ${isExit ? '#b91c1c' : '#047857'}">${log.type}</span></p>
      <p><strong>Motivo / Justificación:</strong> ${log.notes || log.reason || 'Ajuste manual de existencias físicas en bodega.'}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Código / Descripción del Producto</th>
          <th style="text-align: right;">Cantidad</th>
          <th style="text-align: right;">Costo Unit. (L.)</th>
          <th style="text-align: right;">Total Valorizado (L.)</th>
          <th style="text-align: right;">Stock Resultante</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: bold;">${log.productName || 'Producto ID: ' + log.productId}</td>
          <td style="text-align: right; font-weight: 800; color: ${isExit ? '#b91c1c' : '#047857'}">${isExit ? '-' : '+'}${log.quantity}</td>
          <td style="text-align: right;">L. ${(log.costUnit || 0).toFixed(2)}</td>
          <td style="text-align: right; font-weight: bold;">L. ${totalValue.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 800;">${log.stockAfter !== undefined ? log.stockAfter : 'N/D'}</td>
        </tr>
      </tbody>
    </table>

    <div class="card" style="margin-top: 15px;">
      <p style="margin: 0; font-size: 10px; color: #64748b;">
        * Este documento certifica la variación oficial de existencias físicas para fines contables y de auditoría interna de almacén.
      </p>
    </div>

    <div class="footer-signatures">
      <div class="sig-block">
        Responsable de Bodega / Entrega
      </div>
      <div class="sig-block">
        Auditoría / Autorizado Por
      </div>
    </div>
  </div>
</body>
</html>`;
    this.openPrintWindow(html);
  }

  // 8. Recibo de Caja / Comprobante de Abono de Cliente (CXC)
  printReciboAbonoCliente(data: {
    receiptNumber?: string;
    clientName: string;
    clientRtn?: string;
    invoiceNumber: string;
    amount: number;
    previousBalance: number;
    newBalance: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
    date?: string;
  }, companySettings?: any): void {
    const companyName = companySettings?.commercialName || companySettings?.name || "SMART HNL POS";
    const rtnStr = companySettings?.rtn || "05019654135885";
    const addressStr = companySettings?.address || "Tegucigalpa, Honduras";
    const phoneStr = companySettings?.phone || "0000-0000";
    const totalLetras = this.numberToLetters.convertir(data.amount);
    const dateStr = data.date || new Date().toLocaleString('es-HN');
    const recNum = data.receiptNumber || `REC-${Date.now().toString().slice(-6)}`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Recibo de Cobranza - ${recNum}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 25px; display: flex; flex-direction: column; align-items: center; }
    .container { max-width: 800px; width: 100%; background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 25px; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px; }
    .company-info h1 { margin: 0; font-size: 16px; font-weight: 900; color: #1e3a8a; }
    .doc-title { text-align: right; }
    .doc-title h2 { margin: 0; font-size: 14px; font-weight: 800; color: #2563eb; }
    .box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 14px; }
    table.data { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table.data th { background: #1e293b; color: white; padding: 8px; text-align: left; font-size: 10px; }
    table.data td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 15px; }
    .sig-line { width: 40%; text-align: center; border-top: 1px solid #334155; padding-top: 5px; font-weight: bold; font-size: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <h1>${companyName}</h1>
        <div>RTN: <strong>${rtnStr}</strong> | Tel: ${phoneStr}</div>
        <div>${addressStr}</div>
      </div>
      <div class="doc-title">
        <h2>RECIBO DE CAJA / ABONO</h2>
        <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 2px;">N° ${recNum}</div>
        <div style="font-size: 10px; color: #64748b;">Fecha: ${dateStr}</div>
      </div>
    </div>

    <div class="box">
      <table style="width: 100%; font-size: 11px;">
        <tr>
          <td style="width: 50%;"><strong>RECIBIDO DE:</strong> ${data.clientName}</td>
          <td style="width: 50%;"><strong>FACTURA APLICADA:</strong> ${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td><strong>RTN / ID:</strong> ${data.clientRtn || '00000000000000'}</td>
          <td><strong>FORMA DE PAGO:</strong> ${data.paymentMethod} ${data.reference ? ' - Ref: ' + data.reference : ''}</td>
        </tr>
      </table>
    </div>

    <table class="data">
      <thead>
        <tr>
          <th>Concepto / Detalle</th>
          <th style="text-align: right;">Saldo Anterior</th>
          <th style="text-align: right;">Monto Abonado</th>
          <th style="text-align: right;">Saldo Restante</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Abono a Factura Crédito N° ${data.invoiceNumber}<br><span style="font-size: 10px; color: #64748b;">${data.notes || 'Pago parcial / liquidación de cuenta por cobrar'}</span></td>
          <td style="text-align: right; color: #64748b;">L. ${data.previousBalance.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 900; color: #16a34a; font-size: 12px;">L. ${data.amount.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 900; color: ${data.newBalance === 0 ? '#16a34a' : '#b91c1c'};">L. ${data.newBalance.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="box" style="font-size: 10.5px;">
      <strong>SON:</strong> ${totalLetras}
    </div>

    <div class="signatures">
      <div class="sig-line">Entregué Conforme (Cliente)</div>
      <div class="sig-line">Recibí Conforme (Caja / Cobranza)</div>
    </div>
  </div>
</body>
</html>`;
    this.openPrintWindow(html);
  }

  // 9. Comprobante de Egreso / Voucher de Pago a Proveedor (CXP)
  printComprobantePagoProveedor(data: {
    voucherNumber?: string;
    providerName: string;
    providerRtn?: string;
    purchaseNumber: string;
    amount: number;
    previousBalance: number;
    newBalance: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
    date?: string;
  }, companySettings?: any): void {
    const companyName = companySettings?.commercialName || companySettings?.name || "SMART HNL POS";
    const rtnStr = companySettings?.rtn || "05019654135885";
    const addressStr = companySettings?.address || "Tegucigalpa, Honduras";
    const phoneStr = companySettings?.phone || "0000-0000";
    const totalLetras = this.numberToLetters.convertir(data.amount);
    const dateStr = data.date || new Date().toLocaleString('es-HN');
    const vNum = data.voucherNumber || `EGR-${Date.now().toString().slice(-6)}`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Egreso - ${vNum}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 25px; display: flex; flex-direction: column; align-items: center; }
    .container { max-width: 800px; width: 100%; background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 25px; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
    .company-info h1 { margin: 0; font-size: 16px; font-weight: 900; color: #0f172a; }
    .doc-title { text-align: right; }
    .doc-title h2 { margin: 0; font-size: 14px; font-weight: 800; color: #b91c1c; }
    .box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 14px; }
    table.data { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table.data th { background: #334155; color: white; padding: 8px; text-align: left; font-size: 10px; }
    table.data td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 15px; }
    .sig-line { width: 40%; text-align: center; border-top: 1px solid #334155; padding-top: 5px; font-weight: bold; font-size: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <h1>${companyName}</h1>
        <div>RTN: <strong>${rtnStr}</strong> | Tel: ${phoneStr}</div>
        <div>${addressStr}</div>
      </div>
      <div class="doc-title">
        <h2>COMPROBANTE DE EGRESO / PAGO A PROVEEDOR</h2>
        <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 2px;">N° ${vNum}</div>
        <div style="font-size: 10px; color: #64748b;">Fecha: ${dateStr}</div>
      </div>
    </div>

    <div class="box">
      <table style="width: 100%; font-size: 11px;">
        <tr>
          <td style="width: 50%;"><strong>PAGADO A:</strong> ${data.providerName}</td>
          <td style="width: 50%;"><strong>FACTURA / COMPRA N°:</strong> ${data.purchaseNumber}</td>
        </tr>
        <tr>
          <td><strong>RTN PROVEEDOR:</strong> ${data.providerRtn || '00000000000000'}</td>
          <td><strong>MÉTODO DE PAGO:</strong> ${data.paymentMethod} ${data.reference ? ' - Ref/Cheque: ' + data.reference : ''}</td>
        </tr>
      </table>
    </div>

    <table class="data">
      <thead>
        <tr>
          <th>Concepto / Detalle de Pago</th>
          <th style="text-align: right;">Deuda Anterior</th>
          <th style="text-align: right;">Monto Pagado</th>
          <th style="text-align: right;">Saldo Pendiente</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Pago de Factura a Proveedor N° ${data.purchaseNumber}<br><span style="font-size: 10px; color: #64748b;">${data.notes || 'Liquidación de pasivo comercial con proveedor'}</span></td>
          <td style="text-align: right; color: #64748b;">L. ${data.previousBalance.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 900; color: #b91c1c; font-size: 12px;">L. ${data.amount.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 900; color: ${data.newBalance === 0 ? '#16a34a' : '#b91c1c'};">L. ${data.newBalance.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="box" style="font-size: 10.5px;">
      <strong>SON:</strong> ${totalLetras}
    </div>

    <div class="signatures">
      <div class="sig-line">Aprobado / Gerencia Financiera</div>
      <div class="sig-line">Recibí Conforme (Proveedor / Beneficiario)</div>
    </div>
  </div>
</body>
</html>`;
    this.openPrintWindow(html);
  }
}


