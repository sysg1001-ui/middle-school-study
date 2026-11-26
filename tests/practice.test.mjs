import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';

const scripts = await Promise.all(
  ['midterm', 'study-notes', 'practice-sets', 'final-study', 'finals', 'materials', 'app'].map((name) =>
    readFile(new URL(`../dist/${name}.js`, import.meta.url), 'utf8')
  )
);

class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.dataset = {};
    this.events = {};
  }
  append(...nodes) { this.children.push(...nodes); }
  prepend(...nodes) { this.children.unshift(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  add(node) { this.append(node); }
  setAttribute() {}
  removeAttribute() {}
  addEventListener(name, listener) { this.events[name] = listener; }
  showModal() { this.open = true; }
  cloneNode(deep) {
    const copy = new Element(this.tag);
    copy.className = this.className;
    copy.textContent = this.textContent;
    if (deep) copy.append(...this.children.map(child => child instanceof Element ? child.cloneNode(true) : child));
    return copy;
  }
  closest() { return this; }
  focus() {}
  querySelector(selector) {
    return [...this.walk()].find((node) => selector === '.practice-controls button'
      ? node.tag === 'button' && node.textContent === '다른 문제 풀기'
      : node.tag === 'form' && node.dataset.dirty === 'true');
  }
  *walk() {
    for (const child of this.children) {
      if (!(child instanceof Element)) continue;
      yield child;
      yield* child.walk();
    }
  }
}

function openPage(session, local, options = {}) {
  const elements = new Map();
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, new Element(selector));
      return elements.get(selector);
    },
    querySelectorAll: () => [],
    createElement: (tag) => new Element(tag),
    createTextNode: (value) => value
  };
  const storage = (records) => ({
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value)
  });
  const location = { hash: '#practice' };
  const window = new Element('window');
  const context = createContext({
    document, location, window, sessionStorage: options.sessionStorage ?? storage(session), localStorage: storage(local),
    history: options.history,
    Option: class {},
    FormData: class {
      constructor(form) { this.form = form; }
      get() { return this.form.selection ?? null; }
    }
  });
  for (const script of scripts) runInContext(script, context);
  const content = document.querySelector('#content');
  const questions = () => [...content.walk()].filter((node) => node.tag === 'h3').map((node) => node.textContent);
  return {
    context, questions, window,
    hanmunReadings() {
      return [...content.walk()].filter(node => node.className === 'hanmun-readings').map(node => node.textContent);
    },
    chooseExam(id) {
      const picker = document.querySelector('#exam');
      picker.value = id;
      picker.events.change();
    },
    signatures() {
      return [...content.walk()].filter(node => node.tag === 'article').map(card => {
        const prompt = card.children.find(node => node.tag === 'h3').textContent.replace(/^\d+\. /, '');
        const passage = card.children.find(node => node.className === 'passage')?.textContent;
        return JSON.stringify([prompt, passage]);
      }).sort();
    },
    chooseSubject(subject) {
      const option = [...document.querySelector('#subjects').walk()].find(node => node.textContent === subject);
      option.events.click();
    },
    selectAnswer(index) {
      const form = [...content.walk()].find((node) => node.tag === 'form');
      form.selection = String(index);
      form.events.change();
    },
    grade() {
      const form = [...content.walk()].find((node) => node.tag === 'form');
      form.events.submit({ preventDefault() {} });
    },
    next() { content.querySelector('.practice-controls button').events.click(); },
    print() {
      const button = [...content.walk()].find(node => node.textContent === '시험지 출력');
      button.events.click();
      return document.querySelector('#exam-print-output');
    },
    notes(subject) {
      const option = [...document.querySelector('#subjects').walk()].find(node => node.textContent === subject);
      option.events.click();
      location.hash = '#notes';
      window.events.hashchange();
      return content;
    },
    scope(subject) {
      this.chooseSubject(subject);
      location.hash = '#summary';
      window.events.hashchange();
      return [...content.walk()];
    },
    review() {
      location.hash = '#review';
      window.events.hashchange();
    }
  };
}

function membership(questions) {
  return questions.map(prompt => prompt.replace(/^\d+\. /, '')).sort();
}

test('Hanmun question and choice readings appear only after grading', () => {
  const page = openPage(new Map(), new Map());
  page.chooseSubject('한문');
  const bank = runInContext('finalHanmunBank', page.context);
  for (const question of bank) {
    const terms = new Set([question.prompt, question.passage, ...question.choices]
      .flatMap(text => text?.match(/\p{Script=Han}+(?:[ \t]+\p{Script=Han}+)*/gu) ?? []));
    assert(terms.size > 0);
    assert.equal(question.readings.length, terms.size);
    assert(question.readings.every(reading => /^[\p{Script=Han} ]+\([가-힣 ]+\)$/u.test(reading)));
  }
  assert(bank.find(question => question.prompt.startsWith('送舊迎新')).readings.includes('送舊迎新(송구영신)'));
  assert.deepEqual(page.hanmunReadings(), []);
  page.selectAnswer(0);
  assert.deepEqual(page.hanmunReadings(), []);
  page.grade();
  assert.equal(page.hanmunReadings().length, 1);
  assert.match(page.hanmunReadings()[0], /^한자 읽기 · /);
  page.chooseSubject('사회');
  page.selectAnswer(0);
  page.grade();
  assert.deepEqual(page.hanmunReadings(), []);
});

test('the final exam scope displays all first-grade subjects and the timetable', () => {
  const page = openPage(new Map(), new Map());
  const subjects = runInContext('finalExam.subjects', page.context);
  assert.deepEqual(Object.keys(subjects), ['사회', '수학', '한문', '영어', '국어', '과학']);

  for (const [subject, pages] of Object.entries({
    사회: ['122~184'], 수학: ['196~275'], 한문: ['82~121'],
    영어: ['108~123', '124~141'], 국어: ['106~141', '152~167'], 과학: ['194~252']
  })) {
    const details = page.scope(subject).filter(node => node.className === 'detail');
    assert.deepEqual(details.slice(0, pages.length).map(node => node.textContent.match(/\d+~\d+/)?.[0]), pages);
    if (subject === '영어') assert(details.every((node, index) => node.textContent.includes(`${7 + index}과 학습지`)));
    if (subject === '국어') assert.equal(details.at(-1).textContent, '해당 범위의 모든 학습지');
  }

  const table = page.scope('사회').find(node => node.tag === 'table');
  const rows = [...table.walk()].filter(node => node.tag === 'tr')
    .map(row => row.children.map(cell => [cell.textContent, ...cell.children.map(child => child.textContent)].join(' ')));
  assert.deepEqual(rows, [
    ['교시', '12월 14일(월)', '12월 15일(화)', '12월 16일(수)'],
    ['2교시 10:10~10:55', '사회', '한문', '국어'],
    ['3교시 11:10~11:55', '수학', '영어', '과학']
  ]);
  page.chooseExam('grade1-semester2-midterm');
  assert(!page.scope('수학').some(node => node.tag === 'table'));
});

test('all final exam subjects provide annotated notes, disjoint practice sets, printing, and review', () => {
  const page = openPage(new Map(), new Map());
  const subjects = runInContext('finalExam.subjects', page.context);
  assert.equal(runInContext('exam.id', page.context), 'grade1-semester2-final');
  const noteCounts = { 사회: 8, 수학: 5, 한문: 12, 영어: 4, 국어: 3, 과학: 5 };
  for (const [subject, evidenceCount] of Object.entries(noteCounts)) {
    page.chooseSubject(subject);
    const bank = subjects[subject].practiceBank;
    assert.equal(bank.length, subject === '과학' ? 45 : 36);
    assert.equal(new Set(bank.map(question => question.id)).size, bank.length);
    assert.equal(new Set(bank.map(question => question.prompt)).size, bank.length);
    for (const question of bank) {
      assert.equal(new Set(question.choices).size, 4);
      assert(question.choices[question.answer] && question.explanation);
    }
    const current = page.signatures();
    assert.equal(current.length, 16);
    page.next();
    assert(page.signatures().every(question => !current.includes(question)));
    const paper = page.print();
    assert.equal([...paper.walk()].filter(node => node.className === 'exam-paper-prompt').length, 16);
    const wrongAnswer = runInContext('(practiceQuestions(exam.subjects[subject])[0].answer + 1) % 4', page.context);
    page.selectAnswer(wrongAnswer);
    page.grade();
    page.review();
    assert.equal(page.questions().length, 1);
    const notes = page.notes(subject);
    assert.equal([...notes.walk()].filter(node => node.className === 'reading-evidence').length, evidenceCount);
    runInContext("location.hash = '#practice'; window.events.hashchange()", page.context);
  }
  assert.equal(subjects.과학.practiceBank.filter(question => question.source?.includes('쪽수 기준')).length, 9);
});

test('the 40-question bank and full rotation preserve earlier IDs and avoid consecutive repeats', () => {
  const page = openPage(new Map(), new Map());
  page.chooseExam('grade1-semester2-midterm');
  const subjects = Object.entries(runInContext('exam.subjects', page.context));
  const earlierSets = runInContext('midtermPracticeSets', page.context);
  for (const [subject, data] of subjects) {
    const bank = data.practiceBank;
    const ids = new Set(bank.map(question => question.id));
    assert.equal(bank.length, 40);
    assert.equal(ids.size, 40);
    assert([data.questions, ...earlierSets[subject]].flat().every(question => ids.has(question.id)));
    assert.equal(new Set(bank.map(({ prompt, passage }) => JSON.stringify([prompt, passage]))).size, 40);
    for (const question of bank) {
      assert.equal(new Set(question.choices).size, 4);
      assert(question.choices[question.answer] && question.explanation);
    }
    page.chooseSubject(subject);
    const seen = new Set();
    let previous = [];
    for (let round = 0; round < bank.length; round += 1) {
      const current = page.signatures();
      assert.equal(new Set(current).size, 16);
      assert(current.every(prompt => !previous.includes(prompt)));
      seen.add(JSON.stringify(current));
      previous = current;
      page.next();
    }
    assert.equal(seen.size, 40);
    assert(page.signatures().every(prompt => !previous.includes(prompt)));
  }
});

test('print uses the full current set and every subject includes notes with underlined evidence', () => {
  const page = openPage(new Map(), new Map());
  page.chooseExam('grade1-semester2-midterm');
  const paper = page.print();
  const prompts = [...paper.walk()].filter(node => node.className === 'exam-paper-prompt');
  assert.deepEqual(prompts.map((node, index) => `${index + 1}. ${node.textContent}`), page.questions());
  assert.equal(prompts.length, 16);
  for (const [subject, count] of Object.entries({ 과학: 4, 수학: 4, 영어: 3, 국어: 5 })) {
    const nodes = [...page.notes(subject).walk()];
    assert.equal(nodes.filter(node => node.className === 'note-reading').length, count);
    const evidence = nodes.filter(node => node.className === 'reading-evidence');
    assert.equal(evidence.length, 2 * count);
    assert(evidence.every(node => node.textContent));
    if (subject === '영어') {
      assert.equal(nodes.filter(node => node.lang === 'en').length, 2 * count);
      assert.equal(nodes.filter(node => node.className === 'reading-translation').length, count);
    }
  }
});

test('refresh and manual rotation offer different questions while old wrong answers remain reviewable', () => {
  const records = new Map([['unrelated', 'keep']]);
  const session = new Map();
  const first = openPage(session, records);
  const original = first.questions();
  first.selectAnswer(runInContext('(practiceQuestions(exam.subjects[subject])[0].answer + 1) % 4', first.context));
  assert(first.window.studyUpdateBlockReason());
  first.next();
  assert.deepEqual(first.questions(), original);
  first.grade();
  assert.equal(first.window.studyUpdateBlockReason(), '');
  const second = openPage(session, records);
  const other = second.questions();
  assert(other.length === 16 && membership(other).every(prompt => !membership(original).includes(prompt)));
  second.selectAnswer(runInContext('(practiceQuestions(exam.subjects[subject])[0].answer + 1) % 4', second.context));
  second.grade();
  second.next();
  const third = second.questions();
  assert.notDeepEqual(membership(third), membership(original));
  assert(membership(third).every(prompt => !membership(other).includes(prompt)));
  second.review();
  assert.equal(second.questions().length, 2);
  assert.deepEqual(membership(second.questions()), membership([original[0], other[0]]));
  assert.equal(records.get('unrelated'), 'keep');
});

test('reload advances the question set with history state when session storage is unavailable', () => {
  const sessionStorage = {
    getItem() { throw new Error('Blocked'); },
    setItem() { throw new Error('Blocked'); }
  };
  const history = {
    state: { unrelated: 'keep' },
    replaceState(next) { this.state = next; }
  };
  const options = { sessionStorage, history };
  const previous = openPage(new Map(), new Map(), options).questions();
  const current = openPage(new Map(), new Map(), options).questions();
  assert(membership(current).every(prompt => !membership(previous).includes(prompt)));
  assert.equal(history.state.unrelated, 'keep');
});
