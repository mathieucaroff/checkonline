import { deepEqual } from './deepEqual'

import { createExecutor, createReporter } from '../testlib/testlib'

let deExecutor = createExecutor(createReporter(console.log), deepEqual)

let a = Symbol('x')
let b = Symbol('x')

// primitives
deExecutor.case([0, 0], true)
deExecutor.case([1, 1], true)
deExecutor.case(['', ''], true)
deExecutor.case(['text', 'text'], true)
deExecutor.case([a, a], true)

deExecutor.case([0, 1], false)
deExecutor.case(['', 'a'], false)
deExecutor.case([0, ''], false)
deExecutor.case([a, b], false)

// literal objects
deExecutor.case([{}, {}], true)
deExecutor.case([{ a }, { a }], true)
deExecutor.case(
   [
      { a, b },
      { b, a },
   ],
   true,
)
deExecutor.case([{ a }, {}], false)
deExecutor.case([{}, { a }], false)
deExecutor.case([{ a }, { b }], false)
deExecutor.case([{ a, b }, { b }], false)
deExecutor.case([{ a }, { a, b }], false)

// arrays
deExecutor.case([[], []], true)
deExecutor.case([[a], [a]], true)
deExecutor.case(
   [
      [a, b],
      [a, b],
   ],
   true,
)
deExecutor.case(
   [
      [b, a],
      [b, a],
   ],
   true,
)
deExecutor.case([[a, b], [a]], false)
deExecutor.case([[a], [a, b]], false)
deExecutor.case(
   [
      [a, b],
      [b, a],
   ],
   false,
)

// functions, classes
deExecutor.case([() => {}, () => {}], false)
deExecutor.case([function() {}, function() {}], false)
deExecutor.case([class {}, class {}], false)

// class instances
deExecutor.case([new (class {})(), new (class {})()], true)

deExecutor.close()
