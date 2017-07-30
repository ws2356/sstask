# sstask

A promise based task scheduler written in javascript.

##Usage

```
import Scheduler from 'sstask';

const scheduler = new Scheduler();

scheduler.addTask(
  'task2', 
  ({ task1 }) => { 
    console.log('task1 finished with result: ', task1);
    return Promise.resolve('result2');
  },
  ['task1']
);
scheduler.addTask('task1', () => new Promise(resolve => setTimeout(() => resolve('result1'), 1000)));

scheduler.start()
.then({ task1, task2 } => {
  console.log('all tasks finished');
});

```
## See more details in the [docs]('docs/index.md') and in the [unit tests](__tests__)
