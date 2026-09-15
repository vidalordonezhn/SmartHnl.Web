import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NumberToLettersService {
  private Unidades(num: number): string {
    switch (num) {
      case 1: return 'UN';
      case 2: return 'DOS';
      case 3: return 'TRES';
      case 4: return 'CUATRO';
      case 5: return 'CINCO';
      case 6: return 'SEIS';
      case 7: return 'SIETE';
      case 8: return 'OCHO';
      case 9: return 'NUEVE';
      default: return '';
    }
  }

  private Decenas(num: number): string {
    const decena = Math.floor(num / 10);
    const unidad = num - decena * 10;
    switch (decena) {
      case 1:
        switch (unidad) {
          case 0: return 'DIEZ';
          case 1: return 'ONCE';
          case 2: return 'DOCE';
          case 3: return 'TRECE';
          case 4: return 'CATORCE';
          case 5: return 'QUINCE';
          default: return 'DIECI' + this.Unidades(unidad);
        }
      case 2:
        if (unidad === 0) return 'VEINTE';
        return 'VEINTI' + this.Unidades(unidad);
      case 3: return this.DecenasY('TREINTA', unidad);
      case 4: return this.DecenasY('CUARENTA', unidad);
      case 5: return this.DecenasY('CINCUENTA', unidad);
      case 6: return this.DecenasY('SESENTA', unidad);
      case 7: return this.DecenasY('SETENTA', unidad);
      case 8: return this.DecenasY('OCHENTA', unidad);
      case 9: return this.DecenasY('NOVENTA', unidad);
      case 0: return this.Unidades(unidad);
      default: return '';
    }
  }

  private DecenasY(strSin: string, numUnidad: number): string {
    if (numUnidad > 0) return strSin + ' Y ' + this.Unidades(numUnidad);
    return strSin;
  }

  private Centenas(num: number): string {
    const centena = Math.floor(num / 100);
    const decena = num - centena * 100;
    switch (centena) {
      case 1:
        if (decena > 0) return 'CIENTO ' + this.Decenas(decena);
        return 'CIEN';
      case 2: return 'DOSCIENTOS ' + this.Decenas(decena);
      case 3: return 'TRESCIENTOS ' + this.Decenas(decena);
      case 4: return 'CUATROCIENTOS ' + this.Decenas(decena);
      case 5: return 'QUINIENTOS ' + this.Decenas(decena);
      case 6: return 'SEISCIENTOS ' + this.Decenas(decena);
      case 7: return 'SETECIENTOS ' + this.Decenas(decena);
      case 8: return 'OCHOCIENTOS ' + this.Decenas(decena);
      case 9: return 'NOVECIENTOS ' + this.Decenas(decena);
      case 0: return this.Decenas(decena);
      default: return '';
    }
  }

  private Miles(num: number): string {
    const divisor = 1000;
    const cientos = Math.floor(num / divisor);
    const resto = num - cientos * divisor;
    let strMiles = '';
    let strCentenas = '';

    if (cientos > 0) {
      if (cientos === 1) {
        strMiles = 'MIL';
      } else {
        strMiles = this.Centenas(cientos) + ' MIL';
      }
    }

    if (resto > 0) {
      strCentenas = this.Centenas(resto);
    }

    if (strMiles === '') return strCentenas;
    return (strMiles + ' ' + strCentenas).trim();
  }

  private Millones(num: number): string {
    const divisor = 1000000;
    const cientos = Math.floor(num / divisor);
    const resto = num - cientos * divisor;
    let strMillones = '';
    let strMiles = '';

    if (cientos > 0) {
      if (cientos === 1) {
        strMillones = 'UN MILLON';
      } else {
        strMillones = this.Centenas(cientos) + ' MILLONES';
      }
    }

    if (resto > 0) {
      strMiles = this.Miles(resto);
    }

    if (strMillones === '') return strMiles;
    return (strMillones + ' ' + strMiles).trim();
  }

  convertir(monto: number): string {
    const entero = Math.floor(monto);
    const centavos = Math.round((monto - entero) * 100);
    const strCentavos = centavos < 10 ? '0' + centavos : centavos.toString();

    let letras = '';
    if (entero === 0) {
      letras = 'CERO';
    } else {
      letras = this.Millones(entero);
    }

    return `${letras} LEMPIRAS CON ${strCentavos}/100`;
  }
}
