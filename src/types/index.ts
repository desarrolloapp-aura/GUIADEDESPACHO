export interface GuideData {
  lugar: string; // Dirección Origen / Lugar Principal
  direccionDestino: string; // Dirección Destino (Secondary)
  tipoVehiculo: string;
  conductor: string;
  nContrato: string;
  numero?: string; // Optional field for Guide Number
  fecha: string;
  patente: string;
  run: string;
  ingreso: boolean; // true = Ingreso, false = Salida
  empresa: string;
  coordinador?: string;
  items: GuideItem[];
}

export interface GuideItem {
  id: string;
  itemStr: string; // "Item" column (manual input as per request "es item...")
  cantidad: string;
  descripcion: string;
  codigo: string; // The "Folio.Item-Referencia" combined field
}

export interface FieldOffset {
  x: number;
  y: number;
  scale?: number; // Optional scale factor (default 1)
}

export type CalibrationConfig = Record<string, FieldOffset>;
