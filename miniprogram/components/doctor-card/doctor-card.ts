Component({
  properties: {
    id: { type: Number, value: 0 },
    name: { type: String, value: '' },
    title: { type: String, value: '' },
    department: { type: String, value: '' },
    specialty: { type: String, value: '' },
    statusText: { type: String, value: '有号' },
    statusType: { type: String, value: 'success' },
    fee: { type: String, value: '' },
    avatarText: { type: String, value: '医' },
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.properties.id })
    },
  },
})
