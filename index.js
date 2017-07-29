// @flow
const Queue = require('double-ended-queue');

type TaskRet = any;
type Task = (depRets?:{ [taskKey:string]: any }) => Promise<TaskRet>;
type TaskRec = {
  key: string,
  task: Task,
  result?: Promise<TaskRet>,
  deps?: Object,
  nexts?: Object,
  taskHasRun?: bool,
};

const DUMMY_TASK = () => Promise.resolve();

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
  for (let ii = 0; ii < nextKeys.length; ii++) {
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
  let useExisting = false;
  if (depi <= 0 && root.nexts) {
      root.nexts && Object.keys(root.nexts).findIndex((kk) => {
      const node = root.nexts && root.nexts[kk]; // to make flow happy
      if (node && node.key === rec.key) {
        if (node !== rec) {
          Object.assign(node, rec);
        }
        recRef = node;
        useExisting = true;
        return true;
      }
      return false;
    });
  }

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
    return false;
  });

  if (dep) {
    addDep(dep, recRef);
  } else {
    const dummyDep = { key, task:DUMMY_TASK };
    addDep(root, dummyDep);
    addDep(dummyDep, recRef);
  }

  if (root.nexts && root.nexts[recRef.key]) {
    delete root.nexts[recRef.key];
  }
  if (recRef.deps && recRef.deps[root.key]) {
    delete recRef.deps[root.key];
  }

  insert(root, rec, depKeys, depi + 1);
}

function addDep(dependant:TaskRec, depender:TaskRec) {
  depender.deps = { ...depender.deps || {}, [dependant.key]:dependant };
  dependant.nexts = { ...dependant.nexts || {}, [depender.key]: depender };
}

function traverseBfs(root:TaskRec, visitor:(node:TaskRec) => void) {
  if (!root) return;
  const q = new Queue();
  q.push(root);
  while(!q.isEmpty()) {
    const task = q.shift();
    visitor(task);
    if (task.nexts) {
      Object.keys(task.nexts).forEach(
        (key) => {
          const n = task.nexts[key];
          if (n.deps && Object.keys(n.deps).every(kk => !!n.deps[kk].result)) {
            q.push(n);
          }
        }
      );
    }
  }
}

function buildGtask(root:Task) {
    const ret = [];
    root.result = root.task();

    traverseBfs(root, (rec) => {
      if (rec === root) return;
      const { task, deps, result } = rec;
      // todo: this is to make flow happy, because all node have deps except root
      if (!deps) return;
      if (!!result) {
        throw new Error('should not happen: dependency graph traverse error');
      }

      const depKeys = Object.keys(deps);
      rec.result = Promise.all(depKeys.map(k => deps[k].result))
        .then((depRes) => {
          return depKeys.reduce(
            (res, it, ii) => ({
              ...res,
              [it]: depRes[ii],
            }),
            {}
          )
        })
        .then(task);
      ret.push(rec);
    });

    return Promise.all(ret.map(rt => rt.result))
    .then((resultsArr) => {
      return ret.reduce(
        (res, it, ii) => {
          return {
            ...res,
            [it.key]: resultsArr[ii],
          };
        },
        {}
      );
    });
}

// function rebuildGtask(node:TaskRec, rootResult) {
//   if (!node) {
//     throw new Error('wtf 3');
//   }
//   if (!rootResult) {
//     throw new Error('wtf 4');
//   }
//   traverse(node, (rec) => {
//     rec.result = undefined;
//   });
//   node.result = rootResult;
//   traverse(node, (rec) => {
//     rec.result = undefined;
//   });
// }

const ROOT_KEY = '__ROOT_TASK_KEY_SHOULD_NOT_BE_USED_BY_USER__';

export default class TaskScheduler {
  hasRun: bool
  hasFinished: bool
  warnedFinish: bool
  root:TaskRec

  constructor() {
    this.root = {
      key: ROOT_KEY,
      task: () => Promise.resolve(),
    };
  }

  addTask(name:string, task:Task, deps?:Array<string>, beforeRun:bool = true): TaskRec {
    if (beforeRun && this.hasRun) {
      throw new Error('cannot add task after started');
    }
    if (!name || typeof task !== 'function') {
      throw new Error('invalid args');
    }
    const t = {
      key:name,
      task,
    };
    insert(this.root, t, deps, 0);
    return t;
  }

  addTaskLate(name:string, task:Task, deps?:Array<string>) {
    if (!this.hasRun) {
      throw new Error('this is used to add a task after scheduler has already run!');
    }
    const rec = this.addTask(name, task, deps, false);
    if (!deps || !deps.length) return;

    const depTasks = [];
    traverse(this.root, (node) => {
      if (deps.indexOf(node.key) >= 0) {
        depTasks.push(node);
      }
    });

    rec.result = Promise.all(depTasks.map(it => it.result))
    .then((resultsArr) => {
      const results = resultsArr.reduce(
        (res, it, ii) => ({  ...res, [depTasks[ii].key]: it }),
        {}
      );
      return rec.task(results);
    });

    const originalResults = this.results;
    this.results = rec.result
    .then((res) => {
      return originalResults
      .then((others) => {
        return { ...others || {}, [rec.key]: res };
      });
    });
  }

  start(): Promise<{[taskName:string]: TaskRet}> {
    if (this.hasRun) {
      throw new Error('cannot start more than once');
    }
    this.hasRun = true;
    this.results = buildGtask(this.root)
    .then((results) => {
      this.hasRun = true;
      return results;
    });
    return this.results; // just for convenient, this property can change
  }

}
