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
    review() {
      location.hash = '#review';
      window.events.hashchange();
    }
  };
}

test('three distinct sets per subject and stable IDs for the original and added questions', () => {
  const page = openPage(new Map(), new Map());
  const subjects = Object.values(runInContext('exams[0].subjects', page.context));
  for (const data of subjects) {
    assert.equal(data.practiceSets.length, 2);
    const sets = [data.questions, ...data.practiceSets];
    assert(sets.every((questions) => questions.length === 8));
    assert.equal(new Set(sets.flat().map((question) => question.id)).size, 24);
    assert.equal(new Set(sets.flat().map(({ prompt, passage }) => JSON.stringify([prompt, passage]))).size, 24);
    for (const question of sets.flat()) {
      assert.equal(new Set(question.choices).size, 4);
      assert(question.choices[question.answer] && question.explanation);
    }
  }
});

test('refresh and manual rotation offer different questions while old wrong answers remain reviewable', () => {
  const records = new Map([['unrelated', 'keep']]);
  const session = new Map();
  const first = openPage(session, records);
  const original = first.questions();
  first.selectAnswer(0);
  assert(first.window.studyUpdateBlockReason());
  first.next();
  assert.deepEqual(first.questions(), original);
  first.grade();
  assert.equal(first.window.studyUpdateBlockReason(), '');
  const second = openPage(session, records);
  const other = second.questions();
  assert(other.length === 8 && other.every((prompt) => !original.includes(prompt)));
  second.selectAnswer(0);
  second.grade();
  second.next();
  const third = second.questions();
  assert(third.length === 8 && third.every((prompt) => !other.includes(prompt)));
  second.review();
  assert.equal(second.questions().length, 2);
  assert(second.questions().includes(original[0]));
  assert(second.questions()[1].endsWith(other[0].slice(3)));
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
  assert(current.every((question) => !previous.includes(question)));
  assert.equal(history.state.unrelated, 'keep');
});
