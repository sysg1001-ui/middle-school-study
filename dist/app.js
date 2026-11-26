const examPicker = document.querySelector('#exam');
const subjectPicker = document.querySelector('#subjects');
const content = document.querySelector('#content');
const title = document.querySelector('#section-title');
const menu = [...document.querySelectorAll('[data-view]')];
const viewLabels = { summary: '시험 범위', notes: '요약정리', practice: '문제 풀기', review: '오답 노트', textbooks: '교과서 목록' };
const storageKey = 'middle-school-study-v1';
const practiceSize = 16;
const practiceOffsets = new Map();
let view = 'summary';
let exam = exams[0];
let subject = Object.keys(exam.subjects)[0];
let progress = {};
let unsavedProgress = {};

function element(tag, label, className) {
  const node = document.createElement(tag);
  if (label) node.textContent = label;
  if (className) node.className = className;
  return node;
}

function showStorageWarning() {
  document.querySelector('#storage-status').textContent = '브라우저 저장소를 사용할 수 없어 이 페이지를 닫으면 기록이 사라질 수 있습니다.';
}

function readProgress() {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved === null) return {};
  if (typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Invalid study progress');
  return saved;
}

try {
  progress = readProgress();
} catch {
  showStorageWarning();
}

function saveProgress() {
  if (!Object.keys(unsavedProgress).length) return true;
  try {
    const merged = { ...readProgress(), ...unsavedProgress };
    localStorage.setItem(storageKey, JSON.stringify(merged));
    progress = merged;
    unsavedProgress = {};
    document.querySelector('#storage-status').textContent = '';
    return true;
  } catch {
    showStorageWarning();
    return false;
  }
}

function studyWorkBlockReason(nextAction) {
  if (content.querySelector('form[data-dirty="true"]')) {
    return `아직 채점하지 않은 답이 있어요. 채점한 뒤 ${nextAction}`;
  }
  if (!saveProgress()) {
    return '학습 기록을 저장하지 못했어요. 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.';
  }
  return '';
}

window.studyUpdateBlockReason = () => studyWorkBlockReason('다시 새로고침해 주세요.');

function questionKey(subjectName, question) {
  return JSON.stringify([exam.id, subjectName, question.id]);
}

function advancePractice(data, key) {
  let previous = practiceOffsets.get(key);
  if (previous === undefined) {
    try {
      previous = sessionStorage.getItem(key);
    } catch {
      // Some browsers block access to sessionStorage.
    }
    previous ??= history?.state?.[key];
  }
  const bankSize = data.practiceBank.length;
  const offset = Number.parseInt(previous, 10);
  // Each bank has enough questions for consecutive 16-question sets to stay disjoint.
  const next = Number.isInteger(offset) && offset >= 0
    ? (offset + practiceSize + 1) % bankSize
    : Math.floor(Math.random() * bankSize);
  practiceOffsets.set(key, next);
  try {
    sessionStorage.setItem(key, String(next));
  } catch {
    try {
      history.replaceState({ ...history.state, [key]: next }, '');
    } catch {
      // The current screen can still switch sets when neither storage option is available.
    }
  }
  return next;
}

function practiceKey() {
  return `middle-school-study:practice-offset:${exam.id}:${subject}`;
}

function practiceQuestions(data) {
  const bank = data.practiceBank;
  if (!bank) return data.questions;
  const key = practiceKey();
  const offset = practiceOffsets.get(key) ?? advancePractice(data, key);
  return Array.from({ length: practiceSize }, (_, index) => bank[(offset + index) % bank.length]);
}

function wrongQuestions(subjectName) {
  const data = exam.subjects[subjectName];
  return (data.practiceBank ?? data.questions)
    .filter(question => progress[questionKey(subjectName, question)] === 'wrong');
}

function updateReviewCount() {
  const count = Object.keys(exam.subjects).reduce((total, name) => total + wrongQuestions(name).length, 0);
  const badge = document.querySelector('#review-count');
  badge.hidden = count === 0;
  badge.textContent = `(${count})`;
}

function card(heading) {
  const section = element('article', '', 'card');
  section.append(element('h3', heading));
  return section;
}

function showExamSchedule(schedule) {
  const section = card('시험 시간표');
  section.className = 'card exam-schedule';
  const table = element('table', '', 'exam-schedule-table');
  table.setAttribute('aria-label', '시험 날짜와 교시별 과목');
  const head = element('thead');
  const headings = element('tr');
  for (const label of ['교시', ...schedule.map(([date]) => date)]) {
    const cell = element('th', label);
    cell.scope = 'col';
    headings.append(cell);
  }
  head.append(headings);
  const body = element('tbody');
  const periods = [['2교시', '10:10~10:55'], ['3교시', '11:10~11:55']];
  for (const [index, [period, time]] of periods.entries()) {
    const row = element('tr');
    const heading = element('th', period);
    heading.scope = 'row';
    heading.append(element('span', time, 'exam-schedule-time'));
    row.append(heading, ...schedule.map(day => element('td', day[index + 1])));
    body.append(row);
  }
  table.append(head, body);
  section.append(table);
  content.append(section);
}

function showScope(data) {
  if (exam.schedule) showExamSchedule(exam.schedule);
  const grid = element('div', '', 'grid');
  for (const [heading, text] of data.summaries) {
    const section = card(heading);
    section.append(element('p', text, 'detail'));
    grid.append(section);
  }
  content.append(grid);
  if (data.notes) addStudyLink(`${subject} 요약정리 보기`, '#notes');
  else if (data.questions.length) addStudyLink(`${subject} 문제 ${data.practiceBank ? practiceSize : data.questions.length}개 풀기`, '#practice');
}

function addStudyLink(label, href) {
  const actions = element('div', '', 'actions');
  const link = element('a', label, 'primary');
  link.href = href;
  actions.append(link);
  content.append(actions);
}

function showNoteReadings(chapter, readings) {
  const section = element('section', '', 'note-readings');
  section.append(element('h4', '지문 읽기 · 밑줄에서 근거 찾기'));
  for (const reading of readings) {
    const article = element('article', '', 'note-reading');
    article.append(element('p', reading.source, 'note-reading-source'), element('h5', reading.title));
    for (const [before, evidence, after] of reading.paragraphs) {
      const paragraph = element('p');
      if (reading.lang) paragraph.lang = reading.lang;
      paragraph.append(document.createTextNode(before), element('strong', evidence, 'reading-evidence'), document.createTextNode(after));
      article.append(paragraph);
    }
    if (reading.translation) article.append(element('p', `해석 · ${reading.translation}`, 'reading-translation'));
    article.append(element('p', reading.reason, 'reading-reason'));
    section.append(article);
  }
  chapter.append(section);
}

function showNotes(data) {
  const { intro, units, sources } = data.notes;
  const order = units.some(unit => unit.readings) ? '지문에서 근거 찾기 → 요약정리 → 문제 풀기'
    : '먼저 외우기 → 안 보고 답해 보기 → 문제 풀기';
  content.append(element('p', order, 'study-order'));
  if (intro) content.append(element('p', intro, 'study-intro'));
  const stack = element('div', '', 'stack study-notes');
  for (const unit of units) {
    const chapter = card(unit.title);
    chapter.prepend(element('p', unit.pages, 'tag'));
    if (unit.readings?.length) showNoteReadings(chapter, unit.readings);
    for (const [heading, entries] of unit.sections) {
      const section = element('section', '', 'note-section');
      const list = element('dl', '', 'note-list');
      for (const [term, explanation] of entries) {
        const row = element('div', '', 'note-row');
        row.append(element('dt', term), element('dd', explanation));
        list.append(row);
      }
      section.append(element('h4', heading), list);
      chapter.append(section);
    }
    const recall = element('div', '', 'recall');
    recall.append(element('h4', '안 보고 답해 보기'));
    for (const [prompt, answer] of unit.recall) {
      const detail = element('details');
      detail.append(element('summary', prompt), element('p', answer));
      recall.append(detail);
    }
    chapter.append(recall);
    stack.append(chapter);
  }
  content.append(stack);
  if (sources?.length) {
    const references = element('p', '참고 자료', 'note-sources');
    for (const [label, href] of sources) {
      const link = element('a', label);
      link.href = href;
      references.append(link);
    }
    content.append(references);
  }
  if (data.questions.length) addStudyLink(`${subject} 문제 ${data.practiceBank ? practiceSize : data.questions.length}개 풀기`, '#practice');
}

function showQuestions(questions) {
  const stack = element('div', '', 'stack');
  for (const [number, question] of questions.entries()) {
    const section = card(`${number + 1}. ${question.prompt}`);
    const sourceLabel = question.source ?? exam.questionLabel ?? '연습문제';
    section.prepend(element('p', sourceLabel, 'tag'));
    if (question.passage) {
      const passage = element('p', question.passage, 'passage');
      if (subject === '영어') passage.lang = 'en';
      section.append(passage);
    }
    const form = element('form');
    const options = element('fieldset');
    options.append(element('legend', question.prompt));
    question.choices.forEach((choice, index) => {
      const label = element('label');
      const input = element('input');
      input.type = 'radio';
      input.name = 'answer';
      input.value = index;
      input.required = true;
      label.append(input, document.createTextNode(choice));
      options.append(label);
    });
    const submit = element('button', '채점하기', 'primary');
    submit.type = 'submit';
    const feedback = element('p', '', 'feedback');
    feedback.setAttribute('role', 'status');
    feedback.hidden = true;
    form.append(options, submit, feedback);
    let gradedAnswer = null;
    form.addEventListener('change', () => {
      const selected = new FormData(form).get('answer');
      form.dataset.dirty = String(selected !== null && selected !== gradedAnswer);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const selected = new FormData(form).get('answer');
      if (selected === null) return;
      const correct = Number(selected) === question.answer;
      const key = questionKey(subject, question);
      unsavedProgress[key] = correct ? 'correct' : 'wrong';
      progress[key] = unsavedProgress[key];
      gradedAnswer = selected;
      form.dataset.dirty = 'false';
      saveProgress();
      feedback.hidden = false;
      const result = correct ? '정답이에요!' : `정답은 ‘${question.choices[question.answer]}’입니다.`;
      feedback.textContent = `${result} ${question.explanation}`;
      if (question.readings?.length) {
        feedback.append(element('span', `한자 읽기 · ${question.readings.join(' · ')}`, 'hanmun-readings'));
      }
      updateReviewCount();
    });
    section.append(form);
    stack.append(section);
  }
  content.append(stack);
}

function showPrintPreview(questions) {
  const paper = element('article', '', 'exam-paper');
  const heading = element('header', '', 'exam-paper-header');
  heading.append(
    element('p', `${exam.title} · 연습용`),
    element('h3', `${subject} 시험지`),
    element('p', '반 ______　번호 ______　이름 ______________', 'exam-student')
  );
  const items = element('ol', '', 'exam-paper-items');
  for (const question of questions) {
    const item = element('li', '', 'exam-paper-question');
    item.append(element('p', question.prompt, 'exam-paper-prompt'));
    if (question.passage) {
      const passage = element('p', question.passage, 'exam-paper-passage');
      if (subject === '영어') passage.lang = 'en';
      item.append(passage);
    }
    const choices = element('ol', '', 'exam-paper-choices');
    for (const choice of question.choices) choices.append(element('li', choice));
    item.append(choices);
    items.append(item);
  }
  paper.append(heading, element('p', `총 ${questions.length}문항 · 알맞은 답을 하나씩 고르세요.`, 'exam-instructions'), items);
  document.querySelector('#exam-preview-paper').replaceChildren(paper);
  document.querySelector('#exam-print-output').replaceChildren(paper.cloneNode(true));
  document.querySelector('#exam-print-preview').showModal();
}

function showPracticeControls(data, questions) {
  const controls = element('div', '', 'practice-controls');
  const print = element('button', '시험지 출력', 'primary');
  print.type = 'button';
  print.addEventListener('click', () => showPrintPreview(questions));
  content.append(controls);

  if (!data.practiceBank) {
    controls.append(print);
    return;
  }
  const next = element('button', '다른 문제 풀기');
  next.type = 'button';
  const message = element('p', '', 'study-intro');
  message.setAttribute('role', 'status');
  controls.append(next, print, message);
  next.addEventListener('click', () => {
    const blocker = studyWorkBlockReason('다른 문제를 열어 주세요.');
    if (blocker) {
      message.textContent = blocker;
      return;
    }
    advancePractice(data, practiceKey());
    renderContent();
    content.querySelector('.practice-controls button').focus();
  });
}

function renderContent() {
  content.replaceChildren();
  if (view === 'textbooks') {
    content.append(document.querySelector('#textbook-list').content.cloneNode(true));
    return;
  }
  const data = exam.subjects[subject];
  if (view === 'summary' && data.summaries.length) {
    showScope(data);
    return;
  }
  if (view === 'notes') {
    if (data.notes) showNotes(data);
    else content.append(element('p', '이 시험에 등록된 요약정리가 없어요.', 'card'));
    return;
  }
  const questions = view === 'review' ? wrongQuestions(subject)
    : view === 'practice' ? practiceQuestions(data) : [];
  if ((view === 'practice' || view === 'review') && questions.length) {
    if (view === 'practice' && data.practiceIntro) {
      content.append(element('p', data.practiceIntro, 'study-intro'));
    }
    if (view === 'practice') showPracticeControls(data, questions);
    showQuestions(questions);
    return;
  }
  const messages = { summary: '등록된 시험 범위가 없어요.', practice: '등록된 연습문제가 없어요.', review: '이 과목에서 다시 풀 문제가 없어요.' };
  const empty = element('p', messages[view], 'card');
  content.append(empty);
}

function renderSubjects() {
  const buttons = Object.keys(exam.subjects).map(name => {
    const button = element('button', name);
    button.type = 'button';
    button.setAttribute('aria-pressed', name === subject);
    button.addEventListener('click', () => {
      subject = name;
      for (const option of buttons) option.setAttribute('aria-pressed', option === button);
      renderContent();
    });
    return button;
  });
  subjectPicker.replaceChildren(...buttons);
}

function renderView(moveFocus = false) {
  const hash = location.hash.slice(1);
  view = Object.hasOwn(viewLabels, hash) ? hash : 'summary';
  title.textContent = viewLabels[view];
  examPicker.closest('.controls').hidden = view === 'textbooks';
  subjectPicker.hidden = view === 'textbooks';
  for (const link of menu) {
    if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  renderContent();
  if (moveFocus) title.focus();
}

for (const entry of exams) examPicker.add(new Option(entry.title, entry.id));
examPicker.addEventListener('change', () => {
  exam = exams.find(entry => entry.id === examPicker.value);
  if (!Object.hasOwn(exam.subjects, subject)) subject = Object.keys(exam.subjects)[0];
  document.querySelector('#exam-note').textContent = exam.note;
  renderSubjects();
  renderView();
  updateReviewCount();
});
window.addEventListener('hashchange', () => {
  if (Object.hasOwn(viewLabels, location.hash.slice(1)) || !location.hash) renderView(true);
});
window.addEventListener('storage', (event) => {
  if (event.key !== storageKey) return;
  try {
    progress = { ...readProgress(), ...unsavedProgress };
    updateReviewCount();
  } catch {
    showStorageWarning();
  }
});
document.querySelector('#exam-print-confirm').addEventListener('click', () => window.print());
document.querySelector('#exam-print-preview').addEventListener('close', () => {
  document.querySelector('#exam-print-output').replaceChildren();
});
document.querySelector('#exam-note').textContent = exam.note;
renderSubjects();
renderView();
updateReviewCount();
