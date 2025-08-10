import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import SelfTest from './SelfTest';

let container;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
});

test('shows placeholder when no tests have run', () => {
  act(() => {
    ReactDOM.render(<SelfTest testLog={[]} runSelfTests={() => {}} />, container);
  });
  expect(container.textContent).toContain('아직 테스트를 실행하지 않았습니다.');
});

test('renders log items and invokes runSelfTests when clicked', () => {
  const runSelfTests = jest.fn();
  act(() => {
    ReactDOM.render(<SelfTest testLog={['ok']} runSelfTests={runSelfTests} />, container);
  });
  expect(container.textContent).toContain('ok');
  const button = container.querySelector('button');
  act(() => {
    Simulate.click(button);
  });
  expect(runSelfTests).toHaveBeenCalled();
});
