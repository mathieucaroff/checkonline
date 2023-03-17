import { default as packageInfo } from '../../package.json'
import { githubCornerHTML } from '../lib/githubCorner'
import { h } from '../lib/hyper'
import { ActionObject, CheckOnlineConfig, ConfigStorage, State } from '../type'
import { parseTimeToMs } from '../util/parseTimeToMs'
import './style.css'
import '/node_modules/bootstrap/dist/css/bootstrap.min.css'
import { Tooltip } from 'bootstrap'

function drawarea() {
  return h('canvas', {
    className: 'drawarea',
    width: 900, // 15 * 60
    height: 768, // 8 * 24 * 4
  })
}

const timeOptionArray = '125ms 250ms 500ms 1s 2s 5s'.split(' ')

export function createPage(
  config: CheckOnlineConfig,
  state: State,
  configStorage: ConfigStorage,
  action: ActionObject,
) {
  // Content
  const canvasLeft = drawarea()
  const canvasRight = drawarea()

  // GUI
  const configureButton = h('button', {
    type: 'button',
    className: 'btn btn-secondary square',
    textContent: 'Configure',
    dataset: {
      bsToggle: 'modal',
      bsTarget: '#menuModal',
    },
    style: {
      marginLeft: '556px',
      marginTop: '-8px',
    },
  })

  // Menu
  const getTimeOptionArray = (selectedTimeMs: number) =>
    timeOptionArray.map((time) =>
      h('option', {
        value: time,
        textContent: time,
        selected: parseTimeToMs(time) === selectedTimeMs,
      }),
    )

  const periodSelect = h(
    'select',
    {
      id: 'periodSelect',
      className: 'form-select',
      onchange: () => {
        action.setPeriod(periodSelect.value)
        configStorage.setItem('period', periodSelect.value)
      },
    },
    getTimeOptionArray(parseTimeToMs(config.period)),
  )
  const periodInfoMessage = `How often should the watcher emit a network query`
  const periodInfo = h(
    'span',
    {
      className: 'infomessage',
      dataset: { bsTitle: periodInfoMessage, bsCustomClass: 'infomessagetooltip' },
    },
    [document.querySelector('#svgQuestionCircle')!.cloneNode(true) as SVGElement],
  )
  new Tooltip(periodInfo)

  const reactivitySelect = h(
    'select',
    {
      id: 'reactivtySelect',
      className: 'form-select',
      onchange: () => {
        action.setReactivity(reactivitySelect.value)
        configStorage.setItem('reactivity', reactivitySelect.value)
      },
    },
    getTimeOptionArray(parseTimeToMs(config.reactivity)),
  )
  const reactivityInfoMessage = `How long should the watcher wait for a response before declaring a connectivity loss`
  const reactivityInfo = h(
    'span',
    {
      className: 'infomessage',
      dataset: { bsTitle: reactivityInfoMessage, bsCustomClass: 'infomessagetooltip' },
    },
    [document.querySelector('#svgQuestionCircle')!.cloneNode(true) as SVGElement],
  )
  new Tooltip(reactivityInfo)

  const enableCustomTitle = configStorage.getItem('enableCustomTitle')
  const titleCheckboxCallback = () => {
    if (titleCheckbox.checked) {
      modalBody.appendChild(titleConnectedAndLabel)
      modalBody.appendChild(titleDisconnectedAndLabel)
      configStorage.setItem('enableCustomTitle', true)
      configStorage.setItem('connectedTitle', config.title)
      configStorage.setItem('disconnectedTitle', config.title)
    } else {
      modalBody.removeChild(titleConnectedAndLabel)
      modalBody.removeChild(titleDisconnectedAndLabel)
      config.connectedTitle = config.title
      config.disconnectedTitle = config.title
      document.title = config.title
      configStorage.setItem('enableCustomTitle', false)
      configStorage.removeItem('connectedTitle')
      configStorage.removeItem('disconnectedTitle')
    }
  }
  const titleCheckbox = h('input', {
    type: 'checkbox',
    className: 'form-check-input',
    id: 'titleCheckbox',
    checked: enableCustomTitle,
    onclick: titleCheckboxCallback,
  })

  const titleConnected = h('input', {
    type: 'text',
    id: 'titleConnected',
    className: 'form-control',
    placeholder: 'CONNECTED',
    value: config.connectedTitle,
    onchange: () => {
      config.connectedTitle = titleConnected.value
      state.status = 'unknown'
    },
  })

  const titleConnectedAndLabel = h('div', { className: 'mb-4' }, [
    h('label', {
      for: 'titleConnexcted',
      className: 'form-label',
      textContent: 'Tab title when **online**',
    }),
    titleConnected,
  ])

  const titleDisconnected = h('input', {
    type: 'text',
    id: 'titleDisconnected',
    className: 'form-control',
    placeholder: 'DISCONNECTED',
    value: config.disconnectedTitle,
    onchange: () => {
      config.disconnectedTitle = titleDisconnected.value
      state.status = 'unknown'
    },
  })

  const titleDisconnectedAndLabel = h('div', { className: 'mb-4' }, [
    h('label', {
      for: 'titleDisconnexcted',
      className: 'form-label',
      textContent: 'Tab title when **offline**',
    }),
    titleDisconnected,
  ])

  let modalBody: HTMLDivElement

  const menuModal =
    //
    h('div', { id: 'menuModal', className: 'modal fade', tabIndex: '-1' }, [
      h('div', { className: 'modal-dialog' }, [
        h('div', { className: 'modal-content' }, [
          h('div', { className: 'modal-header' }, [
            h('div', { className: 'modal-title square fs-5', textContent: 'Configuration' }),
            h('button', {
              type: 'button',
              className: 'btn-close',
              dataset: { bsDismiss: 'modal' },
            }),
          ]),
          (modalBody = h('div', { className: 'modal-body' }, [
            h('div', { className: 'mb-4' }, [
              h('label', { for: 'periodSelect', className: 'form-label', textContent: 'Period' }, [
                periodInfo,
              ]),
              periodSelect,
            ]),
            h('div', { className: 'mb-4' }, [
              h(
                'label',
                {
                  for: 'reactivitySelect',
                  className: 'form-label',
                  textContent: 'Reactivity',
                },
                [reactivityInfo],
              ),
              reactivitySelect,
            ]),
            h('div', { className: 'form-check mb-4' }, [
              titleCheckbox,
              h('label', {
                for: 'titleCheckbox',
                textContent: 'Enable changing the title upon connectivity change',
              }),
            ]),
          ])),
        ]),
      ]),
    ])

  // bringing all parts of the page together
  const content = h('div', { id: 'page' }, [
    h('i', { innerHTML: githubCornerHTML(packageInfo.repository) }),
    h('h1', { id: 'title', className: 'square', textContent: config.title }, [configureButton]),
    menuModal,
    h('div', { id: 'display' }, [canvasLeft, canvasRight]),
  ])

  if (enableCustomTitle) {
    titleCheckboxCallback()
  }

  return { canvasLeft, canvasRight, content }
}
