import { defineInterface } from '@directus/extensions-sdk'
import InterfaceComponent from './interface.vue'
// import './styles.css';

export default defineInterface({
  id: 'gbp-editor',
  name: 'GPB Editor',
  icon: 'edit',
  description: 'Custom Editor for our needs',
  component: InterfaceComponent,
  options: null,
  types: ['text'],
})
