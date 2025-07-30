
import type { Student, Seat } from './types';

export const STUDENTS: Student[] = [
  { id: 1, name: '김민준' }, { id: 2, name: '이서연' }, { id: 3, name: '박도윤' },
  { id: 4, name: '최아윤' }, { id: 5, name: '정시우' }, { id: 6, name: '강지아' },
  { id: 7, name: '조하준' }, { id: 8, name: '윤서아' }, { id: 9, name: '장예준' },
  { id: 10, name: '임하윤' }, { id: 11, name: '한선우' }, { id: 12, name: '오채원' },
  { id: 13, name: '서은우' }, { id: 14, name: '신지유' }, { id: 15, name: '권이준' },
  { id: 16, name: '황나은' }, { id: 17, name: '송지호' }, { id: 18, name: '안아린' },
  { id: 19, name: '홍주원' }, { id: 20, name: '전수아' }, { id: 21, name: '고유준' },
  { id: 22, name: '문소율' }, { id: 23, name: '양지안' }, { id: 24, name: '배서준' }
];

export const CLASS_ROWS = 4;
export const CLASS_COLS = 6;
const totalSeats = CLASS_ROWS * CLASS_COLS;

export const INITIAL_SEATS: Seat[] = Array.from({ length: totalSeats }, (_, i) => ({
  id: i,
  student: i < STUDENTS.length ? STUDENTS[i] : null,
}));
