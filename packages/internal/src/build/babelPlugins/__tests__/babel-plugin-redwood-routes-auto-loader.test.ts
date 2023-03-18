import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'

import { getPaths } from '../../../paths'
import babelRoutesAutoLoader from '../babel-plugin-redwood-routes-auto-loader'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../../../__fixtures__/example-todo-main/'
)

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

const transform = (filename: string) => {
  const code = fs.readFileSync(filename, 'utf-8')
  return babel.transform(code, {
    filename,
    presets: ['@babel/preset-react'],
    plugins: [babelRoutesAutoLoader],
  })
}

test('page auto loader correctly imports pages', () => {
  const result = transform(getPaths().web.routes)

  // Prerendered pages are automatically required
  expect(result.code).toContain(`const HomePage = {
  name: "HomePage",
  loader: () => require("`)

  // Pages are automatically imported
  expect(result.code).toContain(`const TypeScriptPage = {
  name: "TypeScriptPage",
  loader: () => import("`)

  // Already imported pages are left alone.
  expect(result.code).toContain(`import FooPage from 'src/pages/FooPage'`)
})
