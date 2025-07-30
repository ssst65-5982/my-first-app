import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Seat, Student, AIGroup } from './types';
import { INITIAL_SEATS, STUDENTS } from './constants';
import SeatingChart from './components/SeatingChart';

// API KEY는 환경 변수에서 자동으로 설정됩니다.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const ShuffleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5v5M4 20L20 4M20 16v5h-5M4 4l5 5" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.5 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

const App: React.FC = () => {
  const [seats, setSeats] = useState<Seat[]>(INITIAL_SEATS);
  const [draggedSeatIndex, setDraggedSeatIndex] = useState<number | null>(null);
  const [dragOverSeatIndex, setDragOverSeatIndex] = useState<number | null>(null);

  // AI Grouping Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numGroups, setNumGroups] = useState('4');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [generatedGroups, setGeneratedGroups] = useState<AIGroup[] | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleDragStart = useCallback((seatIndex: number) => {
    setDraggedSeatIndex(seatIndex);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((seatIndex: number) => {
    if (seatIndex !== draggedSeatIndex) {
      setDragOverSeatIndex(seatIndex);
    }
  }, [draggedSeatIndex]);

  const handleDrop = useCallback((droppedOnIndex: number) => {
    if (draggedSeatIndex === null || draggedSeatIndex === droppedOnIndex) {
      setDraggedSeatIndex(null);
      setDragOverSeatIndex(null);
      return;
    }

    setSeats(prevSeats => {
      const newSeats = [...prevSeats];
      const draggedStudent = newSeats[draggedSeatIndex].student;
      newSeats[draggedSeatIndex].student = newSeats[droppedOnIndex].student;
      newSeats[droppedOnIndex].student = draggedStudent;
      return newSeats;
    });

    setDraggedSeatIndex(null);
    setDragOverSeatIndex(null);
  }, [draggedSeatIndex]);

  const handleDragEnd = useCallback(() => {
    setDraggedSeatIndex(null);
    setDragOverSeatIndex(null);
  }, []);

  const randomizeSeats = () => {
    setSeats(prevSeats => {
      const studentsToPlace = [...STUDENTS];
      const newSeats = prevSeats.map(seat => ({ ...seat, student: null }));

      for (let i = studentsToPlace.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [studentsToPlace[i], studentsToPlace[j]] = [studentsToPlace[j], studentsToPlace[i]];
      }

      for (let i = 0; i < newSeats.length; i++) {
        if (i < studentsToPlace.length) {
          newSeats[i].student = studentsToPlace[i];
        }
      }
      return newSeats;
    });
  };

  const handleGenerateGroups = async () => {
    setIsGenerating(true);
    setGeneratedGroups(null);
    setGenerationError(null);

    const currentStudents = seats.map(s => s.student).filter((s): s is Student => s !== null);
    if(currentStudents.length === 0) {
        setGenerationError("자리에 학생이 없습니다.");
        setIsGenerating(false);
        return;
    }

    const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            groupNumber: { type: Type.NUMBER, description: "그룹 번호" },
            students: {
              type: Type.ARRAY,
              description: "그룹에 속한 학생들",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER, description: "학생 ID" },
                  name: { type: Type.STRING, description: "학생 이름" },
                },
                required: ['id', 'name'],
              },
            },
          },
          required: ['groupNumber', 'students'],
        },
    };

    try {
        const prompt = `
        현재 학생 명단은 다음과 같습니다: ${JSON.stringify(currentStudents)}.
        이 학생들을 ${numGroups}개의 그룹으로 나눠주세요.
        추가 요청사항: ${additionalPrompt || '없음'}.
        결과는 반드시 지정된 JSON 스키마에 따라 반환해주세요.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                systemInstruction: "당신은 교실의 학생들을 그룹으로 나누는 것을 돕는 유용한 AI 조수입니다."
            }
        });
        
        const resultText = response.text.trim();
        const resultJson = JSON.parse(resultText) as AIGroup[];
        setGeneratedGroups(resultJson);

    } catch (error) {
        console.error("AI group generation failed:", error);
        setGenerationError("그룹 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
        setIsGenerating(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-indigo-200 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">
            우리반 자리 바꾸기
          </h1>
          <p className="mt-2 text-slate-600 text-lg">
            이름표를 끌어다 놓아 자리를 바꾸거나 AI로 그룹을 만들 수 있습니다.
          </p>
        </header>

        <main>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <button
              onClick={randomizeSeats}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
            >
              <ShuffleIcon className="w-5 h-5" />
              자리 랜덤 배치
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 transition-all"
            >
              <SparklesIcon className="w-5 h-5" />
              AI로 그룹 만들기
            </button>
          </div>
          <div className="relative p-6 bg-slate-700 rounded-xl shadow-2xl mb-8">
            <div className="w-1/2 mx-auto text-center py-2 bg-slate-800 text-white rounded-t-lg font-semibold">교탁</div>
          </div>

          <SeatingChart
            seats={seats}
            draggedSeatIndex={draggedSeatIndex}
            dragOverSeatIndex={dragOverSeatIndex}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragEnter={handleDragEnter}
          />
        </main>

        <footer className="text-center mt-12 text-slate-500">
          <p>&copy; 2025 송정연. All rights reserved.</p>
        </footer>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800">AI로 그룹 만들기</h2>
                    <p className="text-slate-500 mt-1">AI에게 그룹 구성 방법을 알려주세요.</p>
                </header>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="num-groups" className="block text-sm font-medium text-slate-700 mb-1">그룹 수</label>
                        <input
                            type="number"
                            id="num-groups"
                            value={numGroups}
                            onChange={(e) => setNumGroups(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            min="1"
                        />
                    </div>
                    <div>
                        <label htmlFor="additional-prompt" className="block text-sm font-medium text-slate-700 mb-1">추가 요청사항 (선택)</label>
                        <textarea
                            id="additional-prompt"
                            rows={3}
                            value={additionalPrompt}
                            onChange={(e) => setAdditionalPrompt(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="예: 1번과 5번 학생은 다른 조에 배정해주세요."
                        />
                    </div>

                    {isGenerating && (
                        <div className="flex justify-center items-center gap-3 text-slate-600">
                            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>AI가 그룹을 만들고 있습니다...</span>
                        </div>
                    )}

                    {generationError && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-center">{generationError}</p>}
                    
                    {generatedGroups && (
                        <div className="space-y-4 pt-4">
                            <h3 className="text-xl font-bold text-slate-700">생성된 그룹 결과</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {generatedGroups.map(group => (
                                    <div key={group.groupNumber} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                        <h4 className="font-bold text-indigo-700 border-b pb-2 mb-2">그룹 {group.groupNumber}</h4>
                                        <ul className="space-y-1">
                                            {group.students.map(student => (
                                                <li key={student.id} className="text-slate-600">{student.name} <span className="text-xs text-slate-400">(#{student.id})</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <footer className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all">
                        닫기
                    </button>
                    <button onClick={handleGenerateGroups} disabled={isGenerating} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:bg-indigo-300 disabled:cursor-not-allowed">
                        {isGenerating ? '생성 중...' : '생성하기'}
                    </button>
                </footer>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;