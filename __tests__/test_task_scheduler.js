// @flow

import Scheduler from '../index';

// test('can repeat', () => {
    // .mockReturnValueOnce('x')
    // .mockReturnValue(true);
  // // The mock function is called twice
  // expect(mockCallback.mock.calls.length).toBe(2);
  // // The first argument of the first call to the function was 0
  // expect(mockCallback.mock.calls[0][0]).toBe(0);

  // // The first argument of the second call to the function was 1
  // expect(mockCallback.mock.calls[1][0]).toBe(1);

// });
describe('test task scheduler', function () {
    var originalTimeout;

    beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });


    it('sigle task', function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;
      const RESULT1 = 'mockTask finished!';
      const mockTask = jest.fn();
      mockTask.mockReturnValue(Promise.resolve(RESULT1));
      expect.assertions(2);

      const ts = new Scheduler();
      ts.addTask('task1', mockTask);

      return ts.start()
      .then((results) => {
        expect(mockTask.mock.calls.length).toBe(1);
        expect(results.task1).toBe(RESULT1);
      });
    });


    it('two task', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';

      const mockTask1 = jest.fn();
      mockTask1.mockReturnValue(Promise.resolve(RESULT1));

      const mockTask2 = jest.fn();
      mockTask2.mockReturnValue(Promise.resolve(RESULT2));

      expect.assertions(4);

      const ts = new Scheduler();
      ts.addTask('task1', mockTask1);
      ts.addTask('task2', mockTask2, ['task1']);

      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
      });
    });


    it('serial tasks', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';
      const RESULT3 = 'mockTask3 finished!';

      const INT = 1000;

      expect.assertions(8);

      const mockTask1 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT1), INT));
      });

      const mockTask2 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT2), INT));
      });

      const mockTask3 = jest.fn((deps) => {
        expect(deps.task2).toBe(RESULT2);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT3), INT));
      });


      const ts = new Scheduler();
      ts.addTask('task3', mockTask3, ['task2']);
      ts.addTask('task2', mockTask2, ['task1']);
      ts.addTask('task1', mockTask1);
      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(mockTask3.mock.calls.length).toBe(1);
        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
        expect(results.task3).toBe(RESULT3);
      });
    });


    it('mixed tasks: 1, 23', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';
      const RESULT3 = 'mockTask3 finished!';

      const INT = 1000;

      expect.assertions(8);

      const mockTask1 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT1), INT * Math.random()));
      });

      const mockTask2 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT2), INT * Math.random()));
      });

      const mockTask3 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT3), INT * Math.random()));
      });


      const ts = new Scheduler();
      ts.addTask('task1', mockTask1);
      ts.addTask('task2', mockTask2, ['task1']);
      ts.addTask('task3', mockTask3, ['task1']);

      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(mockTask3.mock.calls.length).toBe(1);
        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
        expect(results.task3).toBe(RESULT3);
      });
    });


    it('mixed tasks: 12, 3', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';
      const RESULT3 = 'mockTask3 finished!';

      const INT = 1000;

      expect.assertions(8);

      const mockTask1 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT1), INT * Math.random()));
      });

      const mockTask2 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT2), INT * Math.random()));
      });

      const mockTask3 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        expect(deps.task2).toBe(RESULT2);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT3), INT * Math.random()));
      });

      const ts = new Scheduler();
      ts.addTask('task1', mockTask1);
      ts.addTask('task2', mockTask2);
      ts.addTask('task3', mockTask3, ['task1', 'task2']);

      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(mockTask3.mock.calls.length).toBe(1);
        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
        expect(results.task3).toBe(RESULT3);
      });
    });


    it('diamond shape tasks: 1, 23, 4', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';
      const RESULT3 = 'mockTask3 finished!';
      const RESULT4 = 'mockTask4 finished!';

      const INT = 1000;

      expect.assertions(12);

      const mockTask1 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT1), INT * Math.random()));
      });

      const mockTask2 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT2), INT * Math.random()));
      });

      const mockTask3 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT3), INT * Math.random()));
      });

      const mockTask4 = jest.fn((deps) => {
        expect(deps.task3).toBe(RESULT3);
        expect(deps.task2).toBe(RESULT2);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT4), INT * Math.random()));
      });

      const ts = new Scheduler();
      ts.addTask('task1', mockTask1);
      ts.addTask('task2', mockTask2, ['task1']);
      ts.addTask('task3', mockTask3, ['task1']);
      ts.addTask('task4', mockTask4, ['task2', 'task3']);

      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(mockTask3.mock.calls.length).toBe(1);
        expect(mockTask4.mock.calls.length).toBe(1);
        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
        expect(results.task3).toBe(RESULT3);
        expect(results.task4).toBe(RESULT4);
      });
    });


    it('task add order not important shift 1: 1, 23, 4', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';
      const RESULT3 = 'mockTask3 finished!';
      const RESULT4 = 'mockTask4 finished!';

      const INT = 1000;

      expect.assertions(12);

      const mockTask1 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT1), INT * Math.random()));
      });

      const mockTask2 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT2), INT * Math.random()));
      });

      const mockTask3 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT3), INT * Math.random()));
      });

      const mockTask4 = jest.fn((deps) => {
        expect(deps.task3).toBe(RESULT3);
        expect(deps.task2).toBe(RESULT2);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT4), INT * Math.random()));
      });

      const ts = new Scheduler();
      ts.addTask('task2', mockTask2, ['task1']);
      ts.addTask('task3', mockTask3, ['task1']);
      ts.addTask('task4', mockTask4, ['task2', 'task3']);
      ts.addTask('task1', mockTask1);

      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(mockTask3.mock.calls.length).toBe(1);
        expect(mockTask4.mock.calls.length).toBe(1);
        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
        expect(results.task3).toBe(RESULT3);
        expect(results.task4).toBe(RESULT4);
      });
    });


    it('task add order not important shift 2: 1, 23, 4', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';
      const RESULT3 = 'mockTask3 finished!';
      const RESULT4 = 'mockTask4 finished!';

      const INT = 1000;

      expect.assertions(12);

      const mockTask1 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT1), INT * Math.random()));
      });

      const mockTask2 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT2), INT * Math.random()));
      });

      const mockTask3 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT3), INT * Math.random()));
      });

      const mockTask4 = jest.fn((deps) => {
        expect(deps.task3).toBe(RESULT3);
        expect(deps.task2).toBe(RESULT2);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT4), INT * Math.random()));
      });

      const ts = new Scheduler();
      ts.addTask('task3', mockTask3, ['task1']);
      ts.addTask('task4', mockTask4, ['task2', 'task3']);
      ts.addTask('task1', mockTask1);
      ts.addTask('task2', mockTask2, ['task1']);

      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(mockTask3.mock.calls.length).toBe(1);
        expect(mockTask4.mock.calls.length).toBe(1);
        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
        expect(results.task3).toBe(RESULT3);
        expect(results.task4).toBe(RESULT4);
      });
    });


    it('task add order not important shift 3: 1, 23, 4', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';
      const RESULT3 = 'mockTask3 finished!';
      const RESULT4 = 'mockTask4 finished!';

      const INT = 1000;

      expect.assertions(12);

      const mockTask1 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT1), INT * Math.random()));
      });

      const mockTask2 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT2), INT * Math.random()));
      });

      const mockTask3 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT3), INT * Math.random()));
      });

      const mockTask4 = jest.fn((deps) => {
        expect(deps.task3).toBe(RESULT3);
        expect(deps.task2).toBe(RESULT2);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT4), INT * Math.random()));
      });

      const ts = new Scheduler();
      ts.addTask('task4', mockTask4, ['task2', 'task3']);
      ts.addTask('task1', mockTask1);
      ts.addTask('task2', mockTask2, ['task1']);
      ts.addTask('task3', mockTask3, ['task1']);

      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(mockTask3.mock.calls.length).toBe(1);
        expect(mockTask4.mock.calls.length).toBe(1);
        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
        expect(results.task3).toBe(RESULT3);
        expect(results.task4).toBe(RESULT4);
      });
    });


    it('task add order not important any order: 1, 23, 4', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';
      const RESULT3 = 'mockTask3 finished!';
      const RESULT4 = 'mockTask4 finished!';

      const INT = 1000;

      expect.assertions(12);

      const mockTask1 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT1), INT * Math.random()));
      });

      const mockTask2 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT2), INT * Math.random()));
      });

      const mockTask3 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT3), INT * Math.random()));
      });

      const mockTask4 = jest.fn((deps) => {
        expect(deps.task3).toBe(RESULT3);
        expect(deps.task2).toBe(RESULT2);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT4), INT * Math.random()));
      });

      const ts = new Scheduler();
      ts.addTask('task2', mockTask2, ['task1']);
      ts.addTask('task4', mockTask4, ['task2', 'task3']);
      ts.addTask('task1', mockTask1);
      ts.addTask('task3', mockTask3, ['task1']);

      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(mockTask3.mock.calls.length).toBe(1);
        expect(mockTask4.mock.calls.length).toBe(1);
        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
        expect(results.task3).toBe(RESULT3);
        expect(results.task4).toBe(RESULT4);
      });
    });

    it('complex one, simulating real case in toefl app: 1, 234, 5-2, 6-35, 7-46', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';
      const RESULT3 = 'mockTask3 finished!';
      const RESULT4 = 'mockTask4 finished!';

      const RESULT5 = 'mockTask5 finished!';
      const RESULT6 = 'mockTask6 finished!';
      const RESULT7 = 'mockTask7 finished!';

      const INT = 1000;

      expect.assertions(22);

      const mockTask1 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT1), INT * Math.random()));
      });

      const mockTask2 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT2), INT * Math.random()));
      });
      const mockTask3 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT3), INT * Math.random()));
      });
      const mockTask4 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT4), INT * Math.random()));
      });

      const mockTask5 = jest.fn((deps) => {
        expect(deps.task2).toBe(RESULT2);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT5), INT * Math.random()));
      });

      const mockTask6 = jest.fn((deps) => {
        expect(deps.task3).toBe(RESULT3);
        expect(deps.task5).toBe(RESULT5);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT6), INT * Math.random()));
      });

      const mockTask7 = jest.fn((deps) => {
        expect(deps.task4).toBe(RESULT4);
        expect(deps.task6).toBe(RESULT6);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT7), INT * Math.random()));
      });

      const ts = new Scheduler();
      ts.addTask('task2', mockTask2, ['task1']);
      ts.addTask('task1', mockTask1);
      ts.addTask('task4', mockTask4, ['task1']);
      ts.addTask('task3', mockTask3, ['task1']);

      ts.addTask('task6', mockTask6, ['task5', 'task3']);
      ts.addTask('task5', mockTask5, ['task2']);
      ts.addTask('task7', mockTask7, ['task6', 'task4']);

      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(mockTask3.mock.calls.length).toBe(1);
        expect(mockTask4.mock.calls.length).toBe(1);
        expect(mockTask5.mock.calls.length).toBe(1);
        expect(mockTask6.mock.calls.length).toBe(1);
        expect(mockTask7.mock.calls.length).toBe(1);

        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
        expect(results.task3).toBe(RESULT3);
        expect(results.task4).toBe(RESULT4);
        expect(results.task5).toBe(RESULT5);
        expect(results.task6).toBe(RESULT6);
        expect(results.task7).toBe(RESULT7);
      });
    });

    it('complex one, simulating real case in toefl app: 1, 234, 5-2, 6-2345, 7-4', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';
      const RESULT3 = 'mockTask3 finished!';
      const RESULT4 = 'mockTask4 finished!';

      const RESULT5 = 'mockTask5 finished!';
      const RESULT6 = 'mockTask6 finished!';
      const RESULT7 = 'mockTask7 finished!';

      const INT = 1000;

      expect.assertions(23);

      const mockTask1 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT1), INT * Math.random()));
      });

      const mockTask2 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT2), INT * Math.random()));
      });
      const mockTask3 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT3), INT * Math.random()));
      });
      const mockTask4 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT4), INT * Math.random()));
      });

      const mockTask5 = jest.fn((deps) => {
        expect(deps.task2).toBe(RESULT2);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT5), INT * Math.random()));
      });

      const mockTask6 = jest.fn((deps) => {
        expect(deps.task2).toBe(RESULT2);
        expect(deps.task3).toBe(RESULT3);
        expect(deps.task4).toBe(RESULT4);
        expect(deps.task5).toBe(RESULT5);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT6), INT * Math.random()));
      });

      const mockTask7 = jest.fn((deps) => {
        expect(deps.task4).toBe(RESULT4);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT7), INT * Math.random()));
      });

      const ts = new Scheduler();
      ts.addTask('task2', mockTask2, ['task1']);
      ts.addTask('task1', mockTask1);
      ts.addTask('task4', mockTask4, ['task1']);
      ts.addTask('task3', mockTask3, ['task1']);

      ts.addTask('task6', mockTask6, ['task5', 'task4', 'task2', 'task3']);
      ts.addTask('task5', mockTask5, ['task2']);
      ts.addTask('task7', mockTask7, ['task4']);

      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(mockTask3.mock.calls.length).toBe(1);
        expect(mockTask4.mock.calls.length).toBe(1);
        expect(mockTask5.mock.calls.length).toBe(1);
        expect(mockTask6.mock.calls.length).toBe(1);
        expect(mockTask7.mock.calls.length).toBe(1);

        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
        expect(results.task3).toBe(RESULT3);
        expect(results.task4).toBe(RESULT4);
        expect(results.task5).toBe(RESULT5);
        expect(results.task6).toBe(RESULT6);
        expect(results.task7).toBe(RESULT7);
      });
    });

    it('complex one, simulating real case in toefl app: 1, 234, 5-2, 6-2345, 7-64', function() {
      const RESULT1 = 'mockTask1 finished!';
      const RESULT2 = 'mockTask2 finished!';
      const RESULT3 = 'mockTask3 finished!';
      const RESULT4 = 'mockTask4 finished!';

      const RESULT5 = 'mockTask5 finished!';
      const RESULT6 = 'mockTask6 finished!';
      const RESULT7 = 'mockTask7 finished!';

      const INT = 1000;

      expect.assertions(24);

      const mockTask1 = jest.fn((deps) => {
        return new Promise((resolve) => setTimeout(() => resolve(RESULT1), INT * Math.random()));
      });

      const mockTask2 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT2), INT * Math.random()));
      });
      const mockTask3 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT3), INT * Math.random()));
      });
      const mockTask4 = jest.fn((deps) => {
        expect(deps.task1).toBe(RESULT1);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT4), INT * Math.random()));
      });

      const mockTask5 = jest.fn((deps) => {
        expect(deps.task2).toBe(RESULT2);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT5), INT * Math.random()));
      });

      const mockTask6 = jest.fn((deps) => {
        expect(deps.task2).toBe(RESULT2);
        expect(deps.task3).toBe(RESULT3);
        expect(deps.task4).toBe(RESULT4);
        expect(deps.task5).toBe(RESULT5);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT6), INT * Math.random()));
      });

      const mockTask7 = jest.fn((deps) => {
        expect(deps.task4).toBe(RESULT4);
        expect(deps.task6).toBe(RESULT6);
        return new Promise((resolve) => setTimeout(() => resolve(RESULT7), INT * Math.random()));
      });

      const ts = new Scheduler();
      ts.addTask('task2', mockTask2, ['task1']);
      ts.addTask('task1', mockTask1);
      ts.addTask('task4', mockTask4, ['task1']);
      ts.addTask('task3', mockTask3, ['task1']);

      ts.addTask('task6', mockTask6, ['task5', 'task4', 'task2', 'task3']);
      ts.addTask('task5', mockTask5, ['task2']);
      ts.addTask('task7', mockTask7, ['task4', 'task6']);

      return ts.start()
      .then((results) => {
        expect(mockTask1.mock.calls.length).toBe(1);
        expect(mockTask2.mock.calls.length).toBe(1);
        expect(mockTask3.mock.calls.length).toBe(1);
        expect(mockTask4.mock.calls.length).toBe(1);
        expect(mockTask5.mock.calls.length).toBe(1);
        expect(mockTask6.mock.calls.length).toBe(1);
        expect(mockTask7.mock.calls.length).toBe(1);

        expect(results.task1).toBe(RESULT1);
        expect(results.task2).toBe(RESULT2);
        expect(results.task3).toBe(RESULT3);
        expect(results.task4).toBe(RESULT4);
        expect(results.task5).toBe(RESULT5);
        expect(results.task6).toBe(RESULT6);
        expect(results.task7).toBe(RESULT7);
      });
    });
});
