<script setup lang="ts">
import Quill from 'quill'
import { Delta } from 'quill/core'
import { onMounted, ref, watch } from 'vue'
import LinkModal from './components/LinkModal.vue'
import 'quill/dist/quill.snow.css'

const props = defineProps<{
  field: object
  collection: string
  value: string
  primaryKey: string
}>()
const emit = defineEmits(['input'])

export type modalType = 'link' | 'file' | null

const editor = ref(null)
let editorInstance: Quill
const Parchment = Quill.import('parchment')
const modal = ref<modalType>(null)

const Link = Quill.import('formats/link')

class CustomLink extends Link {
  static create(value) {
    const node = super.create(value)
    value = this.sanitize(value)
    node.setAttribute('href', value)
    node.removeAttribute('target')
    return node
  }

  format(name, value) {
    super.format(name, value)
    this.domNode.removeAttribute('target')
  }
}

Quill.register(CustomLink, true)

// Register button class
const linkClass = new Parchment.ClassAttributor('link-type', 'ql-link-type', { scope: Parchment.Scope.INLINE })
Quill.register(linkClass, true)

onMounted(() => {
  if (editor.value) {
    editorInstance = new Quill(`#editor-${props.field}-${props.primaryKey}`, {
      modules: {
        toolbar: `#toolbar-${props.field}-${props.primaryKey}`,
      },
      theme: 'snow',
    })

    editorInstance.on('text-change', () => {
      emit('input', editorInstance.root.innerHTML)
    })

    if (props.value) {
      editorInstance.root.innerHTML = props.value
    }
  }
})

watch(() => props.value, (newValue) => {
  if (editorInstance && newValue !== editorInstance.root.innerHTML) {
    editorInstance.root.innerHTML = newValue
  }
})

function onSetLink(payload) {
  const range = editorInstance.getSelection(true)
  const linkFormat: any = {
    link: payload.url.value,
    class: payload.type,
  }
  // Add class if type is button, cta or file
  if (payload.type === 'button' || payload.type === 'cta' || payload.type === 'file') {
    linkFormat['link-type'] = payload.type
  }

  if (range && range.length > 0) {
    // Create a new Delta for selection
    const delta = new Delta()
      .retain(range.index)
      .delete(range.length)
      .insert(payload.title.value, linkFormat)

    // Apply the delta
    editorInstance.updateContents(delta, 'api')

    // Set the selection to the newly inserted text
    editorInstance.setSelection(range.index, payload.title.value.length, 'api')
  }
  else {
    // If no selection but we have a cursor position
    const cursorPosition = range ? range.index : editorInstance.getLength() - 1

    const delta = new Delta()
      .retain(cursorPosition)
      .insert(payload.title.value, linkFormat)

    editorInstance.updateContents(delta, 'api')
    editorInstance.setSelection(cursorPosition, payload.title.value.length, 'api')
  }

  modal.value = null
}

function getSelectionData() {
  const range = editorInstance.getSelection(true)
  if (!range)
    return null

  const formats = editorInstance.getFormat(range)
  const text = editorInstance.getText(range.index, range.length)

  return {
    text,
    link: formats.link || '',
    class: formats['link-type'] || '',
    range,
  }
}

function openModal(type: modalType) {
  const selection = getSelectionData()

  if (!selection?.text && type === 'link') {
    const cursor = editorInstance.getSelection(true)
    if (cursor) {
      const [leaf] = editorInstance.getLeaf(cursor.index)
      if (leaf && leaf.parent.domNode.tagName === 'A') {
        const linkLength = leaf.parent.length()
        editorInstance.setSelection(cursor.index - cursor.offset, linkLength)
      }
    }
  }

  modal.value = type
}
</script>

<template>
  <VOverlay :active="modal !== null">
    <LinkModal
      v-if="modal !== null"
      :selection="getSelectionData()"
      :type="modal"
      @cancel="modal = null"
      @set-link="onSetLink"
    />
  </VOverlay>
  <div :id="`toolbar-${field}-${primaryKey}`">
    <span class="ql-formats">
      <select class="ql-size">
        <option value="small">Small</option>
        <option
          value="normal"
          selected
        >Normal</option>
        <option value="large">Large</option>
      </select>
    </span>
    <span class="ql-formats">
      <button class="ql-bold" />
      <button class="ql-italic" />
      <button class="ql-underline" />
    </span>
    <span class="ql-formats">
      <select class="ql-align" />
    </span>
    <span class="ql-formats">
      <button
        class="ql-list"
        value="ordered"
      />
      <button
        class="ql-list"
        value="bullet"
      />
      <button
        class="ql-indent"
        value="-1"
      />
      <button
        class="ql-indent"
        value="+1"
      />
    </span>
    <span class="ql-formats">
      <button class="ql-link" />
      <button class="ql-clean" />
      <button @click="openModal('link')">
        B
      </button>
      <button @click="openModal('file')">
        F
      </button>
    </span>
  </div>

  <div
    :id="`editor-${field}-${primaryKey}`"
    ref="editor"
  />
</template>

<style>
.ql-editor {
  min-height: 240px;
}

a.ql-link-type-button,
a.ql-link-type-cta {
  display: inline-block;
  text-decoration: none;
  border-radius: 2rem;
  padding: .75rem 1rem;
  font-weight: 600;
  margin: 0 4px;
}

a.ql-link-type-button,
a.ql-link-type-file {
  background-color: #fff;
  color: #000;
}

a.ql-link-type-file {
  text-decoration: none;
  display: inline-flex;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 2px solid #000;
}

a.ql-link-type-cta {
  background-color: #883457;
  color: white;
}
</style>
