import type { Component } from 'vue';

export interface Tool {
  name: string
  path: string
  description: string
  keywords: string[]
  component: () => Promise<Component>
  icon: Component
  redirectFrom?: string[]
  /** Use the full-width tool layout instead of the default 600px column (for full-page/iframe tools) */
  wide?: boolean
  /** Hide the tool header (title + description), e.g. for embedded full-page apps that bring their own UI */
  bare?: boolean
  isNew: boolean
  createdAt?: Date
}

export interface ToolCategory {
  name: string
  components: Tool[]
}

export type ToolWithCategory = Tool & { category: string };
