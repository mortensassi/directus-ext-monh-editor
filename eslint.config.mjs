import antfu from '@antfu/eslint-config'

export default antfu({
  overrides: {
    vue: {
      'vue/max-attributes-per-line': ['error', {
        singleline: 1,
        multiline: 1,
      }],
      'vue/first-attribute-linebreak': ['error', {
        singleline: 'beside',
        multiline: 'below',
      }],
    },
  },
})
