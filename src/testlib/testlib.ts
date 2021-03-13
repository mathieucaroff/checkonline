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
         let context = `${getCodeLink(1)}: got (${result_output}), expected (${expected_output})`
         reporter.receive(success, context)
      },
      close: () => {
         reporter.close()
      },
   }
}

export let createReporter = (outputFunction: (input: string) => void) => {
   let totalExecuted = 0
   let totalFailed = 0

   return {
      receive: (success: boolean, context: string) => {
         if (!success) {
            totalFailed++
            outputFunction(`failed: ${context}`)
         }
         totalExecuted++
      },
      close: () => {
         outputFunction(`${totalExecuted} executed, ${totalFailed} failed`)
      },
   }
}

export type Reporter = ReturnType<typeof createReporter>
