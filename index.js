// @flow
const Queue = require('double-ended-queue');

type TaskRet = any;
type Task = (depRets?:Array<TaskRet>) => Promise<TaskRet>;
type TaskRec = {
  key: string,
  task: Task,
  result?: Promise<TaskRet>,
  deps?: { [key:string]: <TaskRec> },
  nexts?: { [key:string]: <TaskRec> },
};

const DUMMY_TASK = () => Promise.resolve();

function isTaskReady(task:TaskRec) {
  if (!task) {
    throw new Error('wtf 1');
  }
  if (!task.deps) {
    return true;
  }
  if (!Object.keys(task.deps).length) {
    return true;
  }
  return Object.keys(task.deps).every((key) => {
    const tt = task.deps[key];
    return !!tt.result;
  });
}

type TraverseVisitor = (node:TaskRec) => bool;
// TraverseVisitor return true to stop
function traverse(root:TaskRec, callback:TraverseVisitor): bool {
  if (!root) {
    return true;
  }
  if (callback(root)) {
    return false;
  }
  if (!root.nexts) {
    return true;
  }
  const nextKeys = Object.keys(root.nexts);
  for (let ii = 0; ii < nextKeys.length: ii++) {
    const key = nextKeys[ii];
    const next = root.nexts[key];
    if (!traverse(next, callback)) {
      return false;
    }
  }
  return true;
}

function insert(root:TaskRec, rec:TaskRec, depKeys?:Array<string>, depi: number = 0) {
  if (!root || !rec) {
    throw new Error('wtf 2');
  }
  if (depKeys && depKeys.length <= depi) {
    return;
  }

  // find dummy self, merge into self, use self afterwards, if exists
  // no dep just install and return
  // has dep:
  //   find dep
  //     found: dep on it
  //     no: dep on root
  //       make dummy node dep on root
  //       dep on that dummy node

  let recRef = rec;
  if (depi <= 0) {
    traverse(root, (node) => {
      if (node.key === rec.key) {
        if (node !== rec) {
          Object.assign(node, rec);
        }
        recRef = node;
        return true;
      }
    });
  }
  const useExisting = recRef === rec;

  const key = depKeys && depKeys[depi];
  if (!key && useExisting) {
    return;
  }

  if (!key) {
    addDep(root, recRef);
    return;
  }

  let dep:TaskRec|null = null;
  traverse(root, (node) => {
    if (node.key === key) {
      dep = node;
      return true;
    }
  });
  if (dep) {
    addDep(dep, recRef);
  } else {
    const dummyDep = { key, task:DUMMY_TASK };
    addDep(root, dummyDep);
    addDep(dummyDep, recRef);
  }

  insert(root, rec, depKeys, depi + 1);
}

function addDep(dependant:TaskRec, depender:TaskRec) {
  depender.deps = { ...depender.deps || {}, [dependant.key]:dependant };
  dependant.nexts = { ...dependant.nexts || {}, [depender.key]: depender };
}

function traverseBfs(root:TaskRec, visitor:TraverseVisitor) {
  if (!root) return;
  const q = new Queue();
  q.push(root);
  while(!q.isEmpty()) {
    const task = q.pop();
    visitor(task);
    if (q.nexts) {
      Object.keys(q.nexts).forEach(
        (key) => {
          const n = q.nexts[key];
          q.push(n);
        }
      );
    }
  }
}

const ROOT_KEY = '__ROOT_TASK_KEY_SHOULD_NOT_BE_USED_BY_USER__';

export default class TaskScheduler {
  hasRun: bool
  root:TaskRec,

  constructor() {
    this.root = {
      key: ROOT_KEY,
      task: () => Promise.resolve(),
    };
  }

  addTask(name:string, task:Task, deps?:[string]) {
    if (this.hasRun) {
      throw new Error('cannot add task after started');
    }
    if (!name || typeof task !== 'function') {
      throw new Error('invalid args');
    }
    insert(this.root, { key:name, task }, deps, 0);
  }

  start(): Promise<*> {
    if (this.hasRun) {
      throw new Error('cannot start twice');
    }
    this.hasRun = true;
    const ret = [];
    traverseBfs(this.root, (rec) => {
      const { task } = rec;
      rec.result = task();
      if (!rec.nexts || !Object.keys(rec.nexts).length) {
        ret.push(rec.result);
      }
    });
    return Promise.all(ret);
  }
}
