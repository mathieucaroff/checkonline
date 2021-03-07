export let parseTimeToMs = (timeDescription: string) => {
   let unit = (timeDescription.toLowerCase().match(/(ms|s|h|d)$/) ?? ['ms'])[0]
   return (
      (parseFloat(timeDescription) || 1) *
      ({
         ms: 1,
         s: 1000,
         h: 3600 * 1000,
         d: 86400 * 1000,
      }[unit] ?? 1)
   )
}
