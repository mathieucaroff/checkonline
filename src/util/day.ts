export let day = (time: Date) => {
   return time.toISOString().split('T')[0]
}
