const exams = [
  {
    id: 'grade1-semester2-midterm',
    title: '1학년 2학기 중간고사',
    note: '학교 시험 범위 안내문 기준 · 과학, 영어, 수학, 국어',
    questionLabel: '시험 범위 기반 예상문제',
    subjects: {
      과학: {
        ...midtermStudy.과학,
        practiceBank: makeMidtermBank('과학'),
        notes: midtermNotes.과학,
        summaries: [
          ['Ⅳ. 물질의 상태변화', '교과서 110~152쪽'],
          ['Ⅴ. 힘의 작용', '교과서 154~192쪽']
        ]
      },
      영어: {
        ...midtermStudy.영어,
        practiceBank: makeMidtermBank('영어'),
        notes: midtermNotes.영어,
        summaries: [
          ['Lesson 4. The Joy of Traveling', '교과서 63~75쪽'],
          ['Lesson 5. Think like Sherlock Holmes!', '교과서 76~91쪽'],
          ['Lesson 6. Good for the Earth, Good for Us', '교과서 92~107쪽'],
          ['학습지', '4~6과 학습지 전체']
        ]
      },
      수학: {
        ...midtermStudy.수학,
        practiceBank: makeMidtermBank('수학'),
        notes: midtermNotes.수학,
        summaries: [
          ['정비례부터 다각형의 내각과 외각의 크기의 합까지', 'Ⅳ. 좌표평면과 그래프 3. 정비례 ~ Ⅵ. 평면도형의 성질 3. 다각형의 내각과 외각의 크기의 합'],
          ['교과서 쪽수', '122~195쪽, 205~207쪽']
        ]
      },
      국어: {
        ...midtermStudy.국어,
        practiceBank: makeMidtermBank('국어'),
        notes: midtermNotes.국어,
        summaries: [
          ['1. 갈등에서 소통으로', '(1) 갈등으로 읽는 문학 · 교과서 10~45쪽'],
          ['2. 숨은 뜻을 찾아라', '(1) 추론하며 이해하기, (2) 매체를 통한 소통 · 교과서 64~95쪽'],
          ['학습지', '1~2단원 시험 범위에 해당하는 모든 학습지']
        ]
      }
    }
  },
  finalExam
];
