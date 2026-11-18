import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';

const scripts = await Promise.all(
  ['midterm', 'study-notes', 'practice-sets', 'materials', 'app'].map((name) =>
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
    review() {
      location.hash = '#review';
      window.events.hashchange();
    }
  };
}

function membership(questions) {
  return questions.map(prompt => prompt.replace(/^\d+\. /, '')).sort();
}

test('the 40-question bank and full rotation preserve earlier IDs and avoid consecutive repeats', () => {
  const page = openPage(new Map(), new Map());
  const subjects = Object.entries(runInContext('exams[0].subjects', page.context));
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
