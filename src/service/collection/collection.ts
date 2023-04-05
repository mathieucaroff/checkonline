/**
 * Data collection
 */
import { CheckOnlineConfig, FeatureUsage } from '../../type'

export interface CollectorProps {
  getConfiguration: () => CheckOnlineConfig
  getFeatureUsage: () => FeatureUsage
}

export function createCollector(props: CollectorProps) {
  const { getConfiguration, getFeatureUsage } = props
  let sessionId = 0
  let open = new Date().toISOString()

  const me = {
    send: (reason: 'periodic' | 'event') => {
      const body = JSON.stringify({
        timezone: new Date().getTimezoneOffset() / 60,
        open,
        close: new Date().toISOString(),
        configuration: getConfiguration(),
        featureUsage: getFeatureUsage(),
        deconnectionKind: reason === 'periodic' ? 'connectivityLost' : 'tabClosed',
      })

      if (!sessionId) {
        fetch('https://data.ea9c.com/checkonline', { method: 'POST', body })
          .then<{ id: number }>((response) => response.json())
          .then(({ id }) => (sessionId = id))
      } else {
        fetch(`https://data.ea9c.com/checkonline/${sessionId}`, { method: 'PUT', body })
      }
    },
  }

  return me
}
