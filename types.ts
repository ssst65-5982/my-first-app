export interface Student {
  id: number;
  name: string;
}

export interface Seat {
  id: number;
  student: Student | null;
}

export interface AIGroup {
  groupNumber: number;
  students: Student[];
}
