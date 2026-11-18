const midtermStudy = {
  과학: {
    questions: [
      {
        id: 's-01', prompt: '기체였던 수증기가 창문에 액체 물방울로 맺혔다. 상태 변화와 열에너지 출입이 알맞게 짝지어진 것은?',
        choices: ['응고 — 흡수', '액화 — 방출', '기화 — 방출', '융해 — 흡수'], answer: 1,
        explanation: '기체가 액체로 바뀌는 현상은 액화다. 액화하는 물질은 주변으로 열에너지를 내보낸다.'
      },
      {
        id: 's-02', prompt: '밀폐된 용기 속의 얼음이 모두 녹았다. 녹기 전후에 반드시 같은 것은?',
        choices: ['물질이 차지하는 부피', '입자의 배열', '입자 사이의 거리', '물질의 질량'], answer: 3,
        explanation: '용기 밖으로 물질이 드나들지 않으므로 질량이 보존된다. 얼음과 물은 입자의 배열과 간격이 다를 수 있다.'
      },
      {
        id: 's-03', prompt: '일정한 압력에서 순수한 물이 끓는 동안 열을 계속 공급했다. 이때 나타나는 현상은?',
        choices: ['온도가 일정하고 물이 수증기로 바뀐다.', '온도가 계속 높아지고 상태는 그대로다.', '온도가 내려가고 수증기가 물로 바뀐다.', '온도와 상태가 모두 그대로다.'], answer: 0,
        explanation: '끓는 동안 공급된 열에너지는 액체가 기체로 바뀌는 데 쓰인다. 순수한 물의 온도는 일정한 압력에서 끓는점으로 유지된다.'
      },
      {
        id: 's-04', prompt: '증발과 끓음의 차이를 바르게 설명한 것은?',
        choices: ['증발은 액체 내부에서만 일어난다.', '끓음은 액체 표면에서만 일어난다.', '증발은 표면에서, 끓음은 액체 내부에서도 일어난다.', '증발은 반드시 끓는점에 도달해야 일어난다.'], answer: 2,
        explanation: '물이 끓지 않아도 액체 표면에서 증발은 일어난다. 끓을 때는 액체 내부에 기포가 생긴다.'
      },
      {
        id: 's-05', prompt: '한 상자에 오른쪽으로 9 N, 왼쪽으로 4 N의 힘만 작용한다. 합력은?',
        choices: ['오른쪽으로 5 N', '왼쪽으로 5 N', '오른쪽으로 13 N', '왼쪽으로 13 N'], answer: 0,
        explanation: '힘의 방향이 반대이므로 9−4=5 N이다. 더 큰 힘이 작용하는 오른쪽이 합력의 방향이다.'
      },
      {
        id: 's-06', prompt: '오른쪽으로 움직이는 물체에 작용하는 합력이 0이 되었다. 합력이 0인 동안 물체의 운동은?',
        choices: ['바로 멈춘다.', '같은 속력으로 오른쪽으로 움직인다.', '오른쪽으로 가며 속력이 계속 커진다.', '왼쪽으로 방향을 바꾼다.'], answer: 1,
        explanation: '합력이 0이면 속력과 운동 방향이 변하지 않는다. 힘의 평형 상태에서도 물체는 움직이고 있을 수 있다.'
      },
      {
        id: 's-07', prompt: '블록이 정지한 바닥 위에서 오른쪽으로 미끄러지고 있다. 바닥이 블록에 가하는 마찰력의 방향은?',
        choices: ['오른쪽', '위쪽', '아래쪽', '왼쪽'], answer: 3,
        explanation: '블록이 바닥에 대해 오른쪽으로 미끄러지므로, 마찰력은 그 상대 운동을 방해하는 왼쪽으로 작용한다.'
      },
      {
        id: 's-08', prompt: '물속에 잠긴 공에 물이 작용하는 부력의 방향은?',
        choices: ['아래쪽', '공이 나아가는 방향', '위쪽', '물이 차가운 쪽'], answer: 2,
        explanation: '물은 물체에 위쪽으로 부력을 작용시킨다. 공의 운동 방향과 상관없이 부력은 위쪽이다.'
      }
    ]
  },
  수학: {
    questions: [
      {
        id: 'm-01', prompt: 'y가 x에 정비례하고 x=−2일 때 y=6이다. x=4일 때 y는?',
        choices: ['−12', '−3', '3', '12'], answer: 0,
        explanation: '정비례식 y=ax에 (−2, 6)을 넣으면 a=−3이다. x=4를 넣으면 y=−3×4=−12다.'
      },
      {
        id: 'm-02', prompt: 'y가 x에 반비례하고 x=3일 때 y=8이다. x=−6일 때 y는?',
        choices: ['−16', '−8', '−4', '4'], answer: 2,
        explanation: '반비례에서 xy의 값은 3×8=24로 일정하다. x=−6이면 y=24÷(−6)=−4다.'
      },
      {
        id: 'm-03', prompt: '두 직선이 교차할 때 생긴 한 각이 68°이다. 이 각의 맞꼭지각과 이웃하여 일직선을 이루는 각의 크기는 각각?',
        choices: ['68°, 68°', '68°, 112°', '112°, 68°', '112°, 112°'], answer: 1,
        explanation: '맞꼭지각은 서로 같아 68°다. 일직선을 이루는 이웃한 두 각의 합은 180°이므로 다른 각은 112°다.'
      },
      {
        id: 'm-04', prompt: '두 평행선을 한 직선이 가로지른다. 한 엇각이 47°일 때 이에 대응하는 다른 엇각은?',
        choices: ['43°', '90°', '133°', '47°'], answer: 3,
        explanation: '두 직선이 평행할 때 엇각의 크기는 서로 같다.'
      },
      {
        id: 'm-05', prompt: '두 삼각형의 대응하는 두 변 길이가 각각 5 cm, 7 cm이고 그 두 변 사이의 각이 모두 40°이다. 적용할 수 있는 합동 조건은?',
        choices: ['SSS', 'ASA', 'SAS', '세 각의 크기만 같은 조건'], answer: 2,
        explanation: '두 변과 그 끼인각이 각각 같으므로 SAS 합동이다.'
      },
      {
        id: 'm-06', prompt: '다음 세 길이 중 삼각형을 만들 수 있는 것은?',
        choices: ['2 cm, 3 cm, 5 cm', '4 cm, 5 cm, 8 cm', '3 cm, 4 cm, 8 cm', '1 cm, 4 cm, 6 cm'], answer: 1,
        explanation: '가장 긴 변이 나머지 두 변의 합보다 짧아야 한다. 8<4+5를 만족하는 두 번째 조합만 가능하다.'
      },
      {
        id: 'm-07', prompt: '내각의 크기의 합이 1,260°인 다각형은?',
        choices: ['구각형', '칠각형', '팔각형', '십각형'], answer: 0,
        explanation: '(n−2)×180°=1,260°이므로 n−2=7, n=9다.'
      },
      {
        id: 'm-08', prompt: '정십각형의 한 외각과 그에 이웃하는 한 내각의 크기는 각각?',
        choices: ['18°, 162°', '30°, 150°', '40°, 140°', '36°, 144°'], answer: 3,
        explanation: '한 외각은 360°÷10=36°다. 내각과 그에 이웃하는 외각의 합이 180°이므로 내각은 144°다.'
      }
    ]
  },
  영어: {
    practiceIntro: '교과서 단원과 새 연습 지문을 함께 사용해 만든 예상문제예요.',
    questions: [
      {
        id: 'e-01', prompt: '하나는 왜 처음 계획을 바꾸었나요?',
        passage: 'Hana planned to take a boat to the island. But the wind was too strong, so the boat did not run. She visited the town museum instead.',
        choices: ['The museum was closed.', 'The boat did not run because of strong wind.', 'Her friend was waiting at the museum.', 'She lost her ticket at the station.'], answer: 1,
        explanation: 'the wind was too strong과 the boat did not run이 이유다. instead 뒤에는 대신 한 행동인 박물관 방문이 나온다.'
      },
      {
        id: 'e-02', prompt: '지문에서 준이 한 일의 순서로 알맞은 것은?',
        passage: 'First, Jun left his bag at the hostel. Then he rented a bike and rode to the market. Before going back to the hostel, he bought some oranges.',
        choices: ['오렌지 구입 → 자전거 대여 → 짐 맡기기', '자전거 대여 → 짐 맡기기 → 오렌지 구입', '짐 맡기기 → 오렌지 구입 → 자전거 대여', '짐 맡기기 → 자전거 대여 → 오렌지 구입'], answer: 3,
        explanation: 'First로 짐을 맡긴 일이 나오고, Then으로 자전거를 빌린 일이 나온다. 시장에 간 뒤 숙소로 돌아오기 전에 오렌지를 샀다.'
      },
      {
        id: 'e-03', prompt: '학교 탐정 미나가 관찰한 두 단서를 모두 설명하는 추론은?',
        passage: 'The hall floor was dry near the main door. Only the floor near the side door was wet. A wet umbrella stood next to the side door.',
        choices: ['Someone may have come in through the side door with a wet umbrella.', 'Someone must have dropped an umbrella at the main door.', 'Both doors were closed all day.', 'The floor near the side door was dry.'], answer: 0,
        explanation: '옆문 가까이만 젖었고 그 옆에 젖은 우산이 있었다. 누군가 그 우산을 들고 옆문으로 들어왔을 가능성이 있다. may는 가능성을 나타낸다.'
      },
      {
        id: 'e-04', prompt: '지문에 직접 나온 사실은?',
        passage: 'Leo found a blue thread on the library chair. Mina wore a blue sweater that day. Leo thought Mina might have sat there, but he did not see anyone sit there.',
        choices: ['Mina sat in the chair.', 'The thread came from Mina’s sweater.', 'Leo found a blue thread on the chair.', 'Leo saw Mina sit in the chair.'], answer: 2,
        explanation: '첫 문장에 파란 실을 발견했다는 사실이 나온다. 미나가 앉았을 가능성은 레오의 추측이다.'
      },
      {
        id: 'e-05', prompt: '두 번째 문장의 “This”가 가리키는 행동은?',
        passage: 'The students washed and reused their lunch containers. This helped them throw away fewer plastic bags.',
        choices: ['일회용 봉투를 더 많이 버리기', '도시락 용기를 씻어서 다시 쓰기', '친구에게 점심을 사 주기', '빈 도시락 용기를 버리기'], answer: 1,
        explanation: 'This는 앞 문장의 행동 전체인 washed and reused their lunch containers를 가리킨다.'
      },
      {
        id: 'e-06', prompt: '앞 문장을 원인, 뒤 문장을 결과로 연결하려면 빈칸에 어떤 말이 들어가야 하나요?',
        passage: 'The classroom was empty, ___ Jisu turned off the lights.',
        choices: ['because', 'although', 'before', 'so'], answer: 3,
        explanation: '교실에 사람이 없다는 원인에서 불을 껐다는 결과가 이어진다. 원인 뒤에 결과를 이을 때 so를 쓴다.'
      },
      {
        id: 'e-07', prompt: '다음 글의 제목으로 가장 알맞은 것은?',
        passage: 'Our school held a swap day. Students brought books they had already read and took home different ones. We found new stories and kept more books in use.',
        choices: ['New Stories by Swapping Used Books', 'How to Write a School Story', 'Why Our School Buys Only New Books', 'A Day without Any Books'], answer: 0,
        explanation: '책을 교환해서 새로운 이야기를 만나고 책을 계속 사용했다는 것이 글 전체의 중심 내용이다.'
      },
      {
        id: 'e-08', prompt: '매점 근처에 물을 채울 수 있는 곳이 생긴 후 어떤 변화가 있었나요?',
        passage: 'The school added a place to refill water bottles near the snack shop. One month later, more students brought their own bottles, and the shop sold fewer single-use bottles.',
        choices: ['The refill station moved to the library.', 'More students bought single-use bottles.', 'More students brought their own bottles.', 'The snack shop stopped selling drinks.'], answer: 2,
        explanation: 'more students brought their own bottles는 더 많은 학생이 자기 물병을 가져왔다는 뜻이다. 일회용 물병 판매는 줄었다.'
      }
    ]
  },
  국어: {
    practiceIntro: '교과서 작품과 새 연습 지문을 함께 사용해 만든 예상문제예요.',
    questions: [
      {
        id: 'k-01', prompt: '다음 상황에서 지우가 겪는 갈등을 가장 잘 설명한 것은?',
        passage: '지우는 발표에 도전하고 싶었다. 하지만 실수하면 친구들이 웃을까 봐 손을 들지 못했다.',
        choices: ['지우와 친구들이 발표 순서를 두고 다툰다.', '지우에게 발표 기회가 주어지지 않는다.', '발표하고 싶은 마음과 실수에 대한 두려움이 부딪힌다.', '지우가 발표 내용을 이해하지 못한다.'], answer: 2,
        explanation: '도전하고 싶은 마음과 실수를 피하고 싶은 마음이 지우의 마음속에서 부딪히는 내적 갈등이다.'
      },
      {
        id: 'k-02', prompt: '두 인물 사이에 갈등이 생긴 직접적인 원인은?',
        passage: '현수는 공연 전에 더 연습하자고 했다. 나리는 친구들이 지쳤으니 일찍 마치자고 했다. 두 사람은 연습 시간을 정하지 못했다.',
        choices: ['공연 전 연습을 얼마나 할지에 관한 생각이 다르다.', '공연에 나갈 팀이 정해지지 않았다.', '두 사람이 맡은 배역이 바뀌었다.', '공연장이 문을 닫았다.'], answer: 0,
        explanation: '현수는 연습 시간을 늘리고 싶고, 나리는 줄이고 싶다. 같은 상황에서 우선하는 것이 달라 외적 갈등이 생겼다.'
      },
      {
        id: 'k-03', prompt: '다음 글에서 갈등을 해결한 방법은?',
        passage: '둘은 원하는 이유를 먼저 설명했다. 현수는 어려운 장면이 걱정된다고 했고, 나리는 팀원이 쉬어야 집중할 수 있다고 했다. 둘은 어려운 장면만 한 번 더 맞추고 마치기로 했다.',
        choices: ['한 사람이 상대의 말을 끊고 결정했다.', '논의를 미룬 채 각각 집에 갔다.', '다른 팀원의 의견을 몰래 바꾸었다.', '서로의 이유를 듣고 두 요구를 일부 반영한 안에 합의했다.'], answer: 3,
        explanation: '두 사람은 걱정하는 이유를 서로 듣고, 필요한 장면만 짧게 연습해 두 요구를 함께 고려했다.'
      },
      {
        id: 'k-04', prompt: '‘괜찮아’라는 말에 담긴 민지의 마음으로 가장 타당한 것은?',
        passage: '친구가 약속 시간을 한 시간 넘겨 왔다. 민지는 “괜찮아.”라고 했지만 줄곧 눈을 마주치지 않았고, 조금 전까지 들고 있던 표 두 장을 구겨 쥐었다.',
        choices: ['기다리는 시간이 즐거웠다.', '속상한 마음을 말로 드러내지 않으려 했다.', '약속 시간을 바꾸고 싶었다.', '친구가 늦었다는 사실을 몰랐다.'], answer: 1,
        explanation: '눈을 피하고 표를 구긴 행동은 말과 달리 속상함을 내비친다. 말과 행동을 함께 보면 마음을 추론할 수 있다.'
      },
      {
        id: 'k-05', prompt: '다음 상황에서 지문에 직접 나온 사실은?',
        passage: '해가 지고 운동장이 비었다. 경비실 불은 켜져 있었다. 수빈은 아직 학교 안에 누군가 있을지도 모른다고 생각했다.',
        choices: ['운동장에 아무도 없었다.', '경비원이 경비실에서 근무 중이었다.', '수빈이 학교 안의 사람을 직접 보았다.', '학교에는 수빈만 남아 있었다.'], answer: 0,
        explanation: '운동장이 비었다는 내용은 글에 직접 나온다. 불이 켜져 있다는 단서만으로 누가 어디에 있는지 확정할 수는 없다.'
      },
      {
        id: 'k-06', prompt: '축제의 여섯 공연에 대해 시간과 장소를 한눈에 비교하도록 안내하려 한다. 가장 알맞은 형식은?',
        choices: ['공연 연습 장면을 담은 짧은 영상', '첫 공연에 참여한 학생의 일기', '공연별 시간과 장소를 열로 나눈 표', '공연 분위기를 보여 주는 사진 한 장'], answer: 2,
        explanation: '비교할 항목이 시간과 장소로 정해져 있으므로, 공연별 정보를 같은 열에 배치한 표가 목적에 맞는다.'
      },
      {
        id: 'k-07', prompt: '다음 자료 중 올해 축제의 날짜를 확인하는 데 가장 적합한 것은?',
        choices: ['작성일이 없는 단체 채팅의 주장', '지난해 축제 포스터', '출처가 표시되지 않은 캡처 이미지', '게시 날짜가 표시된 학교 공식 최신 공지'], answer: 3,
        explanation: '학교 공식 공지는 출처가 분명하다. 게시 날짜를 확인하면 올해의 최신 일정인지 판단할 수 있다.'
      },
      {
        id: 'k-08', prompt: '학생들이 자신이 만든 영상의 주요 내용을 소리를 끈 상태에서도 이해하게 하려면 무엇을 추가하는 것이 가장 알맞은가?',
        choices: ['음악의 음량 조절', '말의 핵심 내용과 필요한 소리 정보를 담은 자막', '영상 마지막에만 나오는 장식 그림', '영상 설명과 관계없는 배경 음악'], answer: 1,
        explanation: '말과 중요한 소리 정보를 자막으로 전달하면 청각 정보 없이도 영상의 내용을 이해할 수 있다.'
      }
    ]
  }
};
