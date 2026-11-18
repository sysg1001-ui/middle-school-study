const exams = [
  {
    id: 'grade1-semester2-midterm',
    title: '1학년 2학기 중간고사',
    note: '학교 시험 범위 안내문 기준 · 과학, 영어, 수학, 국어',
    questionLabel: '시험 범위 기반 예상문제',
    subjects: {
      과학: {
        ...midtermStudy.과학,
        practiceSets: makeMidtermSets('과학'),
        notes: midtermNotes.과학,
        summaries: [
          ['Ⅳ. 물질의 상태변화', '교과서 110~152쪽'],
          ['Ⅴ. 힘의 작용', '교과서 154~192쪽']
        ]
      },
      영어: {
        ...midtermStudy.영어,
        practiceSets: makeMidtermSets('영어'),
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
        practiceSets: makeMidtermSets('수학'),
        notes: midtermNotes.수학,
        summaries: [
          ['정비례부터 다각형의 내각과 외각의 크기의 합까지', 'Ⅳ. 좌표평면과 그래프 3. 정비례 ~ Ⅵ. 평면도형의 성질 3. 다각형의 내각과 외각의 크기의 합'],
          ['교과서 쪽수', '122~195쪽, 205~207쪽']
        ]
      },
      국어: {
        ...midtermStudy.국어,
        practiceSets: makeMidtermSets('국어'),
        notes: midtermNotes.국어,
        summaries: [
          ['1. 갈등에서 소통으로', '(1) 갈등으로 읽는 문학 · 교과서 10~45쪽'],
          ['2. 숨은 뜻을 찾아라', '(1) 추론하며 이해하기, (2) 매체를 통한 소통 · 교과서 64~95쪽'],
          ['학습지', '1~2단원 시험 범위에 해당하는 모든 학습지']
        ]
      }
    }
  },
  {
    id: 'sample',
    title: '예시 시험',
    note: '화면 체험용 자료',
    questionLabel: '예시 연습문제',
    subjects: {
      수학: {
        summaries: [
          ['정수와 유리수', '부호가 다른 두 수를 더할 때는 절댓값의 차를 구하고, 절댓값이 큰 수의 부호를 붙인다. 절댓값이 같으면 합은 0이다.'],
          ['일차방정식', '등식의 두 변에 같은 수를 더하거나 빼도 등식은 성립한다. 두 변을 0이 아닌 같은 수로 나눌 수도 있다.']
        ],
        questions: [
          { id: 'm1', prompt: '(-7) + 4의 값은?', choices: ['-11', '-3', '3', '11'], answer: 1, explanation: '절댓값의 차는 7 − 4 = 3이고, 절댓값이 더 큰 −7의 부호를 붙이면 −3이다.' },
          { id: 'm2', prompt: '3x + 5 = 17의 해는?', choices: ['3', '4', '6', '12'], answer: 1, explanation: '두 변에서 5를 빼면 3x = 12다. 두 변을 3으로 나누면 x = 4다.' }
        ]
      },
      영어: {
        summaries: [
          ['일반동사의 현재형', '주어가 3인칭 단수이면 일반동사에 보통 -s를 붙인다. watch처럼 -ch로 끝나는 동사에는 -es를 붙인다.'],
          ['일반동사의 의문문', '문장 앞에 Do 또는 Does를 쓴다. Does를 쓰면 뒤의 일반동사는 원형으로 쓴다.']
        ],
        questions: [
          { id: 'e1', prompt: 'She ___ TV after dinner. 빈칸에 들어갈 말은?', choices: ['watch', 'watches', 'watching', 'to watch'], answer: 1, explanation: '주어 She는 3인칭 단수다. watch는 -ch로 끝나므로 -es를 붙여 watches가 된다.' },
          { id: 'e2', prompt: '알맞은 의문문을 고르세요.', choices: ['Does he play soccer?', 'Does he plays soccer?', 'Do he play soccer?', 'Do he plays soccer?'], answer: 0, explanation: 'he에는 Does를 쓰고, 뒤의 일반동사는 원형 play를 쓴다.' }
        ]
      },
      과학: {
        summaries: [
          ['상태 변화', '고체가 액체로 바뀌는 현상은 융해, 액체가 기체로 바뀌는 현상은 기화, 기체가 액체로 바뀌는 현상은 액화다.'],
          ['밀도', '밀도는 단위 부피당 질량이다. 질량을 부피로 나누어 구하며, g/cm³ 등의 단위를 쓴다.']
        ],
        questions: [
          { id: 's1', prompt: '차가운 컵 바깥에 물방울이 맺힐 때 일어나는 상태 변화는?', choices: ['융해', '응고', '기화', '액화'], answer: 3, explanation: '공기 중 수증기가 차가운 컵 표면에서 식어 액체인 물로 바뀌므로 액화다.' },
          { id: 's2', prompt: '질량이 30 g이고 부피가 10 cm³인 물체의 밀도는?', choices: ['0.3 g/cm³', '3 g/cm³', '20 g/cm³', '300 g/cm³'], answer: 1, explanation: '밀도는 질량을 부피로 나눈 값이므로 30 ÷ 10 = 3 g/cm³다.' }
        ]
      }
    }
  }
];
