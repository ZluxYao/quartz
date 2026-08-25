import assert from "node:assert/strict"
import test from "node:test"
import { transformEnhancingMindmap } from "../src/index"

test("converts Enhancing Mindmap headings into a Mermaid hierarchy", () => {
  const source = `---
mindmap-plugin: basic
---

# mindmap-plugin: basic

## 基础

### 变量

### 函数

## 并发`

  const result = transformEnhancingMindmap(source)

  assert.match(result, /```mermaid\nmindmap/)
  assert.match(result, /  root\["思维导图"\]/)
  assert.match(result, /    node1\["基础"\]/)
  assert.match(result, /      node2\["变量"\]/)
  assert.match(result, /      node3\["函数"\]/)
  assert.match(result, /    node4\["并发"\]/)
  assert.doesNotMatch(result, /# mindmap-plugin: basic/)
})

test("uses a real first heading as the root label", () => {
  const source = `---
mindmap-plugin: basic
---

# Golang
## Channel`

  const result = transformEnhancingMindmap(source)

  assert.match(result, /root\["Golang"\]/)
  assert.match(result, /node1\["Channel"\]/)
})

test("leaves ordinary Markdown unchanged", () => {
  const source = "# 普通笔记\n\n正文"
  assert.equal(transformEnhancingMindmap(source), source)
})

test("escapes Mermaid-sensitive label characters", () => {
  const source = `---
mindmap-plugin: basic
---

# mindmap-plugin: basic
## A & "B" <C>`

  const result = transformEnhancingMindmap(source)

  assert.match(result, /A &amp; &quot;B&quot; &lt;C&gt;/)
})
