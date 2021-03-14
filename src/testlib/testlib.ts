import { deepEqual } from '../util/deepEqual'

export let getCodeLink = (depth: number) => {
   let { stack } = new Error()
   if (!stack) {
      return '(?)'
   }
   let line = stack.split('\n').slice(depth + 2)[0]
   if (line.includes('(')) {
      line = '(' + line.split('(').slice(-1)[0]
   }
   return line
}

export let createExecutor = <TI extends unknown[], TO>(
   reporter: Reporter,
   function_under_test: (...args: TI) => TO,
) => {
   return {
      case: (input_args: TI, expected_output: TO) => {
         let result_output = function_under_test(...input_args)
         let success = deepEqual(result_output, expected_output)
         let codeLink = getCodeLink(1)
         reporter.receive(success, codeLink, result_output, expected_output)
      },
      close: () => {
         reporter.close()
      },
   }
}

export let createReporter = (outputFunction: (...args: unknown[]) => void) => {
   let totalExecuted = 0
   let totalFailed = 0

   return {
      receive: (success: boolean, codeLink: string, result: unknown, expected: unknown) => {
         if (!success) {
            totalFailed++
            outputFunction(`failed at ${codeLink}: got`, result, 'expected', expected)
         }
         totalExecuted++
      },
      close: () => {
         outputFunction(`${totalExecuted} executed, ${totalFailed} failed`)
      },
   }
}

export type Reporter = ReturnType<typeof createReporter>
