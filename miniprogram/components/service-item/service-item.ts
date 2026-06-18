Component({
  properties: {
    icon: { type: String, value: '' },
    label: { type: String, value: '' },
    bgColor: { type: String, value: '#e6f4ff' },
    badge: { type: String, value: '' },
    url: { type: String, value: '' },
  },
  methods: {
    onTap() {
      const { url } = this.properties
      this.triggerEvent('tap')
      if (url) {
        wx.navigateTo({ url })
      }
    },
  },
})
