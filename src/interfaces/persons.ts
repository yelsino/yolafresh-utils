import { CuentaBancaria, MedioPagoDigital, MetodoPago } from "./finanzas";

export enum CargosPersonal {
  SECRETARIO = 'SECRETARIO',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  REPONEDOR = 'REPONEDOR',
  CAJERO = 'CAJERO'
}

export interface Personal {
    id?: string;
    nombres: string;
    cargo: CargosPersonal
    username: string;
    password: string;
    dni: string;
    celular: string;
    direccion: string;
    registro: Date
  }

  export interface Cliente {
    id?: string;
    nombres: string;
    fechaRegistro: Date
    celular: string;
    correo: string;
    dni: string;
    direccion: string;
    pseudonimo: string;
    creditosPendientes?: number;
  }

  export interface Usuario {
    id: string;
    email: string;
    rol: string;
    nombres: string;
    apellidos?: string;
    telefono?: string;
    correo?: string;
    celular: string;
    foto: string;
    tipoDocumento: string;
    document: string;
    idExterno: string;
  }

  export interface ValuesPersonals {
    personalId: string;
    personalName: string;
    metodoPago: MetodoPago;
    monto: number;
  }


  export interface Proveedor {
    id?: string;
    nombre: string;
    telefonos: string[];
    cuentasBancarias: CuentaBancaria[];
    mediosPagoDigital?: MedioPagoDigital[];
    fechaRegistro: Date
    ubicacion?: string;
    categoria?: string;
  }
