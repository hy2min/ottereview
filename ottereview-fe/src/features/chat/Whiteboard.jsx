import { useThrottleCallback } from '@react-hook/throttle'
import { TDAsset, TDBinding, TDShape, TDUser, TDUserStatus, TldrawApp } from '@tldraw/tldraw'
import * as yorkie from '@yorkie-js/sdk'
import _ from 'lodash'
import randomColor from 'randomcolor'
import { useCallback, useEffect, useState } from 'react'
import { names, uniqueNamesGenerator } from 'unique-names-generator'

let client
let doc

export function useMultiplayerState(roomId) {
  const [app, setApp] = useState()
  const [loading, setLoading] = useState(true)

  const onMount = useCallback(
    (appInstance) => {
      appInstance.loadRoom(roomId)
      appInstance.setIsLoading(true)
      appInstance.pause()
      setApp(appInstance)

      const randomName = uniqueNamesGenerator({ dictionaries: [names] })

      appInstance.updateUsers([
        {
          id: appInstance.currentUser.id,
          point: [0, 0],
          color: randomColor(),
          status: TDUserStatus.Connected,
          activeShapes: [],
          selectedIds: [],
          metadata: { name: randomName },
        },
      ])
    },
    [roomId]
  )

  const onChangePage = useThrottleCallback(
    (app, shapes, bindings) => {
      if (!app || !client || !doc) return

      const getUpdatedPropertyList = (source, target) => {
        return Object.keys(source).filter((key) => !_.isEqual(source[key], target[key]))
      }

      Object.entries(shapes).forEach(([id, shape]) => {
        doc.update((root) => {
          if (!shape) {
            delete root.shapes[id]
          } else if (!root.shapes[id]) {
            root.shapes[id] = shape
          } else {
            const updates = getUpdatedPropertyList(shape, root.shapes[id].toJS())
            updates.forEach((key) => {
              root.shapes[id][key] = shape[key]
            })
          }
        })
      })

      Object.entries(bindings).forEach(([id, binding]) => {
        doc.update((root) => {
          if (!binding) {
            delete root.bindings[id]
          } else if (!root.bindings[id]) {
            root.bindings[id] = binding
          } else {
            const updates = getUpdatedPropertyList(binding, root.bindings[id].toJS())
            updates.forEach((key) => {
              root.bindings[id][key] = binding[key]
            })
          }
        })
      })

      Object.entries(app.assets).forEach(([, asset]) => {
        doc.update((root) => {
          if (!asset.id) {
            delete root.assets[asset.id]
          } else if (!root.assets[asset.id]) {
            root.assets[asset.id] = asset
          } else {
            const updates = getUpdatedPropertyList(asset, root.assets[asset.id].toJS())
            updates.forEach((key) => {
              root.assets[asset.id][key] = asset[key]
            })
          }
        })
      })
    },
    60,
    false
  )

  const onChangePresence = useThrottleCallback(
    (app, user) => {
      if (!app || !client?.isActive()) return

      doc.update((root, presence) => {
        presence.set({ tdUser: user })
      })
    },
    60,
    false
  )

  useEffect(() => {
    if (!app) return

    const handleChanges = () => {
      const root = doc.getRoot()
      const shapeRecord = JSON.parse(root.shapes.toJSON())
      const bindingRecord = JSON.parse(root.bindings.toJSON())
      const assetRecord = JSON.parse(root.assets.toJSON())

      app.replacePageContent(shapeRecord, bindingRecord, assetRecord)
    }

    let stillAlive = true

    async function setupDocument() {
      try {
        client = new yorkie.Client({
          rpcAddr: import.meta.env.VITE_YORKIE_API_ADDR,
          apiKey: import.meta.env.VITE_YORKIE_API_KEY,
          syncLoopDuration: 0,
          reconnectStreamDelay: 1000,
        })
        await client.activate()

        doc = new yorkie.Document(roomId, { enableDevtools: true })

        doc.subscribe('my-presence', (event) => {
          if (event.type === yorkie.DocEventType.Initialized) {
            const peers = doc.getPresences().map((peer) => peer.presence.tdUser)
            app.updateUsers(peers)
          }
        })

        doc.subscribe('others', (event) => {
          if (event.type === yorkie.DocEventType.Unwatched) {
            app.removeUser(event.value.presence.tdUser.id)
          }
          const peers = doc.getPresences().map((peer) => peer.presence.tdUser)
          app.updateUsers(peers)
        })

        const option = app?.currentUser && { initialPresence: { tdUser: app.currentUser } }
        await client.attach(doc, option)

        doc.update((root) => {
          if (!root.shapes) root.shapes = {}
          if (!root.bindings) root.bindings = {}
          if (!root.assets) root.assets = {}
        }, 'initialize document')

        doc.subscribe((event) => {
          if (event.type === 'remote-change') {
            handleChanges()
          }
        })

        await client.sync()

        if (stillAlive) {
          handleChanges()
          app.zoomToFit()
          if (app.zoom > 1) app.resetZoom()
          app.setIsLoading(false)
          setLoading(false)
        }
      } catch (e) {
        console.error(e)
      }
    }

    setupDocument()

    return () => {
      stillAlive = false
    }
  }, [app])

  return {
    onMount,
    onChangePage,
    loading,
    onChangePresence,
  }
}
