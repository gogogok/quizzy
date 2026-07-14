import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePoints } from '../src/utils/points.js';
test('wrong answer gives zero', () =>
  assert.equal(calculatePoints({ isCorrect: false, answerTime: 1, timeLimit: 10 }), 0));
test('instant correct answer gives max', () =>
  assert.equal(calculatePoints({ isCorrect: true, answerTime: 0, timeLimit: 10 }), 1000));
test('last-second correct answer gives half', () =>
  assert.equal(calculatePoints({ isCorrect: true, answerTime: 10, timeLimit: 10 }), 500));
test('time is clamped', () =>
  assert.equal(calculatePoints({ isCorrect: true, answerTime: 20, timeLimit: 10 }), 500));
