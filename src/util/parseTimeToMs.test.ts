import { parseTimeToMs } from './parseTimeToMs'
import { describe, expect, it } from 'vitest'

describe('parseTimeToMs', () => {
  it.each<[string, number]>([
    ['0m', 0],
    ['0', 0],
    ['500', 500],
    ['125ms', 125],
    ['1.5s', 1500],
    ['.5s', 500],
    ['+2h', 7_200_000],
    ['-120m', -7_200_000],
    [' 2 S ', 2000],
    ['30d', 2_592_000_000],
  ])('parses %s as %dms', (description, expected) => {
    expect(parseTimeToMs(description)).toBe(expected)
  })

  it.each([
    '',
    ' ',
    'garbage',
    'Infinity',
    '-Infinity',
    'NaN',
    '1s trailing',
    '1second',
    '1e3ms',
    '1.2.3s',
    'ms',
    '1s2m',
    '1fortnight',
    `${'9'.repeat(310)}d`,
  ])('rejects malformed or nonfinite duration %s', (description) => {
    expect(() => parseTimeToMs(description)).toThrow(RangeError)
  })

  it('rejects non-string input explicitly', () => {
    expect(() => parseTimeToMs(500 as unknown as string)).toThrow(TypeError)
  })

  it.each(['0m', '-1s', '.5ms', '2147483648ms', '25d'])(
    'rejects unsafe timer duration %s',
    (description) => {
      expect(() => parseTimeToMs(description, { timer: true })).toThrow(RangeError)
    },
  )

  it.each<[string, number]>([
    ['1ms', 1],
    ['125ms', 125],
    ['2147483647ms', 2_147_483_647],
  ])('accepts safe timer duration %s', (description, expected) => {
    expect(parseTimeToMs(description, { timer: true })).toBe(expected)
  })
})