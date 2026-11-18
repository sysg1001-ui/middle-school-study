const examPicker = document.querySelector('#exam');
const subjectPicker = document.querySelector('#subjects');
const content = document.querySelector('#content');
const title = document.querySelector('#section-title');
const menu = [...document.querySelectorAll('[data-view]')];
const viewLabels = { summary: '시험 범위', notes: '요약정리', practice: '문제 풀기', review: '오답 노트', textbooks: '교과서 목록' };
const storageKey = 'middle-school-study-v1';
const roundKey = 'middle-school-study:practice-round';
let view = 'summary';
let exam = exams[0];
let subject = Object.keys(exam.subjects)[0];
let progress = {};
let unsavedProgress = {};
let practiceRound;

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

function questionSets(data) {
  return [data.questions, ...(data.practiceSets ?? [])];
}

function setPracticeRound(round) {
  practiceRound = round;
  try {
    sessionStorage.setItem(roundKey, String(round));
  } catch {
    try {
      history.replaceState({ ...history.state, [roundKey]: round }, '');
    } catch {
      // The current screen can still switch sets when neither storage option is available.
    }
  }
}

function practiceQuestions(data) {
  const sets = questionSets(data);
  if (sets.length === 1) return sets[0];
  if (practiceRound === undefined) {
    let previous;
    try {
      previous = sessionStorage.getItem(roundKey);
    } catch {
      previous = history.state?.[roundKey];
    }
    const previousRound = Number.parseInt(previous, 10);
    setPracticeRound(Number.isInteger(previousRound) && previousRound >= 0
      ? (previousRound + 1) % sets.length
      : previous === undefined ? Math.floor(Math.random() * sets.length) : 0);
  }
  return sets[practiceRound % sets.length];
}

function wrongQuestions(subjectName) {
  return questionSets(exam.subjects[subjectName]).flat()
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

function showScope(data) {
  const grid = element('div', '', 'grid');
  for (const [heading, text] of data.summaries) {
    const section = card(heading);
    section.append(element('p', text, 'detail'));
    grid.append(section);
  }
  content.append(grid);
  if (data.notes) addStudyLink(`${subject} 요약정리 보기`, '#notes');
  else if (data.questions.length) addStudyLink(`${subject} 문제 ${data.questions.length}개 풀기`, '#practice');
}

function addStudyLink(label, href) {
  const actions = element('div', '', 'actions');
  const link = element('a', label, 'primary');
  link.href = href;
  actions.append(link);
  content.append(actions);
}

function showNotes(data) {
  const { intro, units, sources } = data.notes;
  content.append(element('p', '먼저 외우기 → 안 보고 답해 보기 → 문제 풀기', 'study-order'));
  if (intro) content.append(element('p', intro, 'study-intro'));
  const stack = element('div', '', 'stack study-notes');
  for (const unit of units) {
    const chapter = card(unit.title);
    chapter.prepend(element('p', unit.pages, 'tag'));
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
  if (data.questions.length) addStudyLink(`${subject} 문제 ${data.questions.length}개 풀기`, '#practice');
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

  if (!data.practiceSets?.length) {
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
    setPracticeRound((practiceRound + 1) % questionSets(data).length);
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
  title.textContent = view === 'summary' && exam.id === 'sample' ? '시험 범위 요약' : viewLabels[view];
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
